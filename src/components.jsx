import { useEffect, useState } from 'react';
import { BRAND } from './data.js';
import { linkTo } from './utils.js';

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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', nextTheme);
    setTheme(nextTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  }

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
