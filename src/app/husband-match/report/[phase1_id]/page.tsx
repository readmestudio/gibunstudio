import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Phase1ReportClient } from './Phase1ReportClient';

export default async function Phase1ReportPage({
  params,
}: {
  params: Promise<{ phase1_id: string }>;
}) {
  const { phase1_id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/husband-match/onboarding');
  }

  // Fetch Phase 1 results
  const { data: result, error } = await supabase
    .from('phase1_results')
    .select('*')
    .eq('id', phase1_id)
    .single();

  if (error || !result) {
    notFound();
  }

  // Check ownership
  if (result.user_id !== user.id) {
    notFound();
  }

  return <Phase1ReportClient result={result} />;
}
