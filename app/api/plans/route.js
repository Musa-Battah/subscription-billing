import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all active subscription plans
export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM subscription_plans 
      WHERE is_active = true 
      ORDER BY price_ngn ASC
    `);
    
    // Parse JSONB features
    const plans = result.rows.map(plan => ({
      ...plan,
      features: plan.features || []
    }));
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}