'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo" onClick={() => setIsMenuOpen(false)}>
          💳 <span>Sub</span>Billing NG
        </Link>
        
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </button>
        
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link href="/plans" className={`nav-link ${isActive('/plans') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
            Plans
          </Link>
          {user && (
            <>
              <Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                Dashboard
              </Link>
              <Link href="/invoices" className={`nav-link ${isActive('/invoices') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                Invoices
              </Link>
            </>
          )}
          {user ? (
            <span className="nav-link" style={{ color: '#666' }}>
              👋 {user.name}
            </span>
          ) : (
            <>
              <Link href="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link href="/register" className="nav-link" onClick={() => setIsMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}