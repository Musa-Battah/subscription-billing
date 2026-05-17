import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { addMonths } from 'date-fns';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.redirect(new URL('/payment/failed', process.env.NEXTAUTH_URL));
    }
    
    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
      },
    });
    
    const data = await response.json();
    
    if (data.status && data.data.status === 'success') {
      const { invoice_id, subscription_id, customer_id } = data.data.metadata;
      
      // Update invoice status
      await query(
        `UPDATE invoices 
         SET status = 'paid', 
             paid_at = NOW()
         WHERE id = $1 AND status != 'paid'`,
        [invoice_id]
      );
      
      // Update subscription status to active and extend period
      const subResult = await query(
        'SELECT current_period_end FROM subscriptions WHERE id = $1',
        [subscription_id]
      );
      
      if (subResult.rows.length > 0) {
        const currentEnd = subResult.rows[0].current_period_end;
        const newEnd = addMonths(new Date(currentEnd), 1);
        
        await query(
          `UPDATE subscriptions 
           SET status = 'active', 
               current_period_start = NOW(),
               current_period_end = $1
           WHERE id = $2`,
          [newEnd.toISOString().split('T')[0], subscription_id]
        );
      }
      
      return NextResponse.redirect(new URL(`/payment/success?subscription=${subscription_id}`, process.env.NEXTAUTH_URL));
    } else {
      return NextResponse.redirect(new URL(`/payment/failed`, process.env.NEXTAUTH_URL));
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(new URL('/payment/failed', process.env.NEXTAUTH_URL));
  }
}