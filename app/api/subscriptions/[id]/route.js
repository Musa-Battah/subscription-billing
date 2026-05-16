import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// DELETE - Cancel subscription (set to cancel at period end)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verify ownership
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [decoded.userId]
    );
    
    const subResult = await query(
      'SELECT customer_id FROM subscriptions WHERE id = $1',
      [id]
    );
    
    if (subResult.rows[0]?.customer_id !== customerResult.rows[0]?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Cancel at period end (don't delete immediately)
    const result = await query(`
      UPDATE subscriptions 
      SET cancel_at_period_end = true, status = 'cancelling'
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}