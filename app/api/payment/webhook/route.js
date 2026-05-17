import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { addMonths } from 'date-fns';

export async function POST(request) {
  try {
    const body = await request.json();
    const event = body;
    
    console.log('Webhook received from Pipedream router:', event.event);
    
    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const { invoice_id, subscription_id } = metadata;
      
      console.log(`Processing subscription payment for invoice: ${invoice_id}`);
      
      // Update invoice status
      await query(
        `UPDATE invoices 
         SET status = 'paid', 
             paid_at = NOW()
         WHERE id = $1 AND status != 'paid'`,
        [invoice_id]
      );
      
      // Update subscription status and extend period
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
      
      console.log(`Subscription payment successful for: ${subscription_id}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}