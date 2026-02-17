import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PaymentClient } from './PaymentClient';

export default async function PaymentPage({
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
    redirect('/husband-match/birth-info');
  }

  // Fetch Phase 1 results to verify ownership
  const { data: phase1Result, error: phase1Error } = await supabase
    .from('phase1_results')
    .select('*')
    .eq('id', phase1_id)
    .single();

  if (phase1Error || !phase1Result) {
    notFound();
  }

  if (phase1Result.user_id !== user.id) {
    notFound();
  }

  // Check if payment already exists
  const { data: existingPayment } = await supabase
    .from('husband_match_payments')
    .select('*')
    .eq('phase1_id', phase1_id)
    .eq('status', 'confirmed')
    .single();

  if (existingPayment) {
    // Payment already confirmed, redirect to survey
    redirect(`/husband-match/survey/${phase1_id}`);
  }

  return <PaymentClient phase1Id={phase1_id} userEmail={user.email || ''} />;
}
