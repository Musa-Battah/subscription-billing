'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function FailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
      <h1>Payment Failed</h1>
      <p style={{ color: '#888', marginBottom: '10px' }}>
        We couldn't process your payment. Please try again.
      </p>
      {error && (
        <p style={{ color: '#ef4444', marginBottom: '30px', fontSize: '14px' }}>
          Error: {error}
        </p>
      )}
      <Link href="/plans" className="btn-primary" style={{ textDecoration: 'none' }}>
        Try Again
      </Link>
    </div>
  );
}

export default function PaymentFailed() {
  return (
    <Suspense fallback={<div className="card">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}