import { useEffect, useRef, useState } from 'react';
import { BRAND } from './data.js';
import { linkTo, navigateTo } from './utils.js';
import { onAuthChange, signOutUser } from './auth.js';
import { getUserProfile } from './db.js';

export function ShieldLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#38BDF8" opacity=".15" />
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Nav() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', nextTheme);
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleTheme() {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  }

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOutUser();
    navigateTo('/');
  }

  // Get initials for avatar fallback
  const initials = (profile?.name || user?.displayName || user?.email || 'U')
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const avatarUrl = profile?.photoURL || user?.photoURL || '';

  return (
    <nav>
      <div className="nav-content">
        <a href="/" className="nav-brand" onClick={linkTo('/')}>
          <ShieldLogo />
          <span>{BRAND.name}</span>
        </a>
        <div className="nav-right">
          <button id="themeToggle" className="theme-toggle-btn" type="button" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <span className="nav-city">{BRAND.city}</span>

          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                title={profile?.name || user.displayName || user.email}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="avatar-img" />
                ) : (
                  <div className="avatar-initials">{initials}</div>
                )}
                <i className="ti ti-chevron-down" style={{ fontSize: 12, opacity: 0.7 }} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {profile?.name || user.displayName || 'User'}
                      <button type="button" onClick={() => { setDropdownOpen(false); navigateTo('/html/profile.html'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
                        <i className="ti ti-edit" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                    <div className="dropdown-email">{user.email}</div>
                    {user?.metadata?.lastSignInTime && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                        Logged in: {new Date(user.metadata.lastSignInTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    )}
                  </div>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-item" onClick={() => { setDropdownOpen(false); navigateTo('/html/my-certificates.html'); }}>
                    <i className="ti ti-certificate" /> My Certificates
                  </button>
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-item danger" onClick={handleSignOut}>
                    <i className="ti ti-logout" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="btn-nav-login" onClick={() => navigateTo('/html/login.html')}>
              <i className="ti ti-login" /> Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Page({ children, className = '', style }) {
  return (
    <>
      <Nav />
      <div className={`container fade-in ${className}`} style={style}>
        {children}
      </div>
    </>
  );
}
