import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET all subscriptions for current user
export async function GET() {
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
    
    // Get customer first
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (customerResult.rows.length === 0) {
      return NextResponse.json([]);
    }
    
    const result = await query(`
      SELECT 
        s.*, 
        sp.name as plan_name, 
        sp.price_ngn as plan_price, 
        sp.billing_interval
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.customer_id = $1
      ORDER BY s.created_at DESC
    `, [customerResult.rows[0].id]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST create new subscription
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
    
    const body = await request.json();
    const { plan_id, customer_id, payment_method } = body;
    
    console.log('Creating subscription:', { plan_id, customer_id, payment_method });
    
    // Get plan details
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );
    
    if (planResult.rows.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    const plan = planResult.rows[0];
    const today = new Date();
    const periodStart = today.toISOString().split('T')[0];
    
    let periodEnd;
    if (plan.billing_interval === 'monthly') {
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 1);
      periodEnd = endDate.toISOString().split('T')[0];
    } else if (plan.billing_interval === 'yearly') {
      const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + 1);
      periodEnd = endDate.toISOString().split('T')[0];
    } else {
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 1);
      periodEnd = endDate.toISOString().split('T')[0];
    }
    
    const result = await query(`
      INSERT INTO subscriptions (customer_id, plan_id, current_period_start, current_period_end, payment_method, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `, [customer_id, plan_id, periodStart, periodEnd, payment_method || 'card']);
    
    console.log('Subscription created:', result.rows[0]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}