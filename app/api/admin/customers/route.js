import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const result = await query(`
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM customers c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Admin customers error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}