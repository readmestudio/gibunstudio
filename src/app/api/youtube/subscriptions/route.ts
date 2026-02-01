import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }

    // Set up OAuth2 client with the access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token });

    // Get YouTube subscriptions
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    let allSubscriptions: any[] = [];
    let nextPageToken: string | undefined;

    // Fetch all pages of subscriptions
    do {
      const response = await youtube.subscriptions.list({
        part: ['snippet'],
        mine: true,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      if (response.data.items) {
        allSubscriptions = allSubscriptions.concat(response.data.items);
      }

      nextPageToken = response.data.nextPageToken || undefined;
    } while (nextPageToken);

    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Store subscriptions in database
    const subscriptionsData = allSubscriptions.map((sub) => ({
      user_id: user.id,
      channel_id: sub.snippet.resourceId.channelId,
      channel_title: sub.snippet.title,
      channel_description: sub.snippet.description || '',
      subscriber_count: null, // We'd need additional API calls to get this
    }));

    // Insert subscriptions (upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from('youtube_subscriptions')
      .upsert(subscriptionsData, {
        onConflict: 'user_id,channel_id',
      });

    if (insertError) {
      console.error('Failed to store subscriptions:', insertError);
      return NextResponse.json(
        { error: 'Failed to store subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: allSubscriptions.length,
      channels: subscriptionsData.map((sub) => ({
        title: sub.channel_title,
        description: sub.channel_description,
      })),
    });
  } catch (error: any) {
    console.error('YouTube API error:', error);

    if (error.code === 401 || error.code === 403) {
      return NextResponse.json(
        { error: 'YouTube access denied or expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch YouTube subscriptions' },
      { status: 500 }
    );
  }
}
