import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const REFERENCE_PREFIX = process.env.NEXT_PUBLIC_REFERENCE_PREFIX || 'SUB-';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { amount, email, invoiceId, subscriptionId, customerId } = await request.json();
    
    // Generate unique reference with SUB- prefix for Pipedream routing
    const reference = `${REFERENCE_PREFIX}${invoiceId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Save payment reference to invoice
    await query(
      'UPDATE invoices SET payment_reference = $1 WHERE id = $2',
      [reference, invoiceId]
    );
    
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        email: email,
        reference: reference,
        metadata: {
          invoice_id: invoiceId,
          subscription_id: subscriptionId,
          customer_id: customerId,
          user_id: decoded.userId,
          type: 'subscription_payment'
        },
        callback_url: `${process.env.NEXTAUTH_URL}/api/payment/verify`,
      }),
    });
    
    const data = await response.json();
    
    if (data.status) {
      return NextResponse.json({
        success: true,
        authorization_url: data.data.authorization_url,
        reference: data.data.reference
      });
    } else {
      console.error('Paystack error:', data);
      return NextResponse.json({ error: data.message }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}