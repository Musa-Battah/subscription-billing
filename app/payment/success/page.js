'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('subscription');

  return (
    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
      <h1>Subscription Successful!</h1>
      <p style={{ color: '#888', marginBottom: '10px' }}>
        Your subscription has been activated successfully.
      </p>
      {subscriptionId && (
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
          Subscription ID: {subscriptionId}
        </p>
      )}
      <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
        Go to Dashboard
      </Link>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="card">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}