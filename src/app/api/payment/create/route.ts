import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { phase1_id, amount, payment_method, depositor_name } = await request.json();

    if (!phase1_id || !amount || !depositor_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify phase1 result exists and belongs to user
    const { data: phase1Result, error: phase1Error } = await supabase
      .from('phase1_results')
      .select('id, user_id')
      .eq('id', phase1_id)
      .single();

    if (phase1Error || !phase1Result || phase1Result.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Invalid phase1_id' },
        { status: 400 }
      );
    }

    // Check for existing pending/confirmed payment
    const { data: existingPayment } = await supabase
      .from('husband_match_payments')
      .select('id, status')
      .eq('phase1_id', phase1_id)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (existingPayment) {
      return NextResponse.json({
        payment_id: existingPayment.id,
        message: 'Payment already exists',
      });
    }

    // Create payment record
    const orderId = `HM-${Date.now()}-${nanoid(8)}`;

    const { data: payment, error: paymentError } = await supabase
      .from('husband_match_payments')
      .insert({
        user_id: user.id,
        phase1_id,
        amount,
        payment_method: payment_method || 'bank_transfer',
        order_id: orderId,
        status: 'pending',
        payment_key: depositor_name, // Store depositor name in payment_key field
      })
      .select('id')
      .single();

    if (paymentError) {
      console.error('Failed to create payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to admin for payment confirmation

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      order_id: orderId,
      message: 'Payment request created. Waiting for admin confirmation.',
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
