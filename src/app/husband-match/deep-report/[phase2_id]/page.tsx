import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Phase2ReportClient } from './Phase2ReportClient';

export default async function Phase2ReportPage({
  params,
}: {
  params: { phase2_id: string };
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/husband-match/onboarding');
  }

  // Fetch Phase 2 results with related data
  const { data: result, error } = await supabase
    .from('phase2_results')
    .select('*, phase1_results(*)')
    .eq('id', params.phase2_id)
    .single();

  if (error || !result) {
    notFound();
  }

  // Check ownership
  if (result.user_id !== user.id) {
    notFound();
  }

  return <Phase2ReportClient result={result} />;
}
