import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET customer for current user
export async function GET(request) {
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
    
    const result = await query(
      'SELECT * FROM customers WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST create new customer
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
    const { business_name, business_type, phone, address, city, state } = body;
    
    // Check if customer already exists
    const existing = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (existing.rows.length > 0) {
      // Update existing customer
      const result = await query(`
        UPDATE customers 
        SET business_name = $1, business_type = $2, phone = $3, 
            address = $4, city = $5, state = $6
        WHERE user_id = $7
        RETURNING *
      `, [business_name, business_type, phone, address, city, state, decoded.userId]);
      
      return NextResponse.json(result.rows[0]);
    } else {
      // Create new customer
      const result = await query(`
        INSERT INTO customers (user_id, business_name, business_type, phone, address, city, state)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [decoded.userId, business_name, business_type, phone, address, city, state]);
      
      return NextResponse.json(result.rows[0], { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}