    import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET all invoices for current user
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
    
    const customerResult = await query(
      'SELECT id FROM customers WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (customerResult.rows.length === 0) {
      return NextResponse.json([]);
    }
    
    const result = await query(`
      SELECT i.*, sp.name as plan_name
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.customer_id = $1
      ORDER BY i.created_at DESC
    `, [customerResult.rows[0].id]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST create new invoice
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
    const { subscription_id, amount } = body;
    
    const vatRate = 7.5;
    const vatAmount = amount * (vatRate / 100);
    const total = amount + vatAmount;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // Due in 14 days
    
    const result = await query(`
      INSERT INTO invoices (subscription_id, invoice_number, subtotal, vat_rate, vat_amount, total, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [subscription_id, invoiceNumber, amount, vatRate, vatAmount, total, dueDate]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}