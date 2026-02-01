import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { SurveyClient } from './SurveyClient';

export default async function SurveyPage({
  params,
}: {
  params: { phase1_id: string };
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/husband-match/onboarding');
  }

  // Verify phase1 result exists and belongs to user
  const { data: phase1Result, error: phase1Error } = await supabase
    .from('phase1_results')
    .select('id, user_id')
    .eq('id', params.phase1_id)
    .single();

  if (phase1Error || !phase1Result || phase1Result.user_id !== user.id) {
    notFound();
  }

  // Check payment status
  const { data: payment, error: paymentError } = await supabase
    .from('husband_match_payments')
    .select('id, status')
    .eq('phase1_id', params.phase1_id)
    .eq('status', 'confirmed')
    .single();

  if (paymentError || !payment) {
    // No confirmed payment, redirect to payment page
    redirect(`/husband-match/payment/${params.phase1_id}`);
  }

  // Check if survey already submitted
  const { data: existingSurvey } = await supabase
    .from('phase2_surveys')
    .select('id')
    .eq('phase1_id', params.phase1_id)
    .single();

  if (existingSurvey) {
    // Survey already submitted, check if phase2 results exist
    const { data: phase2Result } = await supabase
      .from('phase2_results')
      .select('id')
      .eq('phase1_id', params.phase1_id)
      .single();

    if (phase2Result) {
      redirect(`/husband-match/deep-report/${phase2Result.id}`);
    } else {
      // Survey submitted but results not ready yet
      // Show a waiting page or redirect to loading
      redirect(`/husband-match/loading?phase1_id=${params.phase1_id}&type=phase2`);
    }
  }

  return <SurveyClient phase1Id={params.phase1_id} paymentId={payment.id} />;
}
