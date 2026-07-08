import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { ALL, BRAND, GENERAL_SECTIONS, IT_SECTIONS, getGrade, maxScore } from './data.js';
import { CERT_STORE_KEY, buildQRPayload, buildVerifyUrl, parseQRPayload, escHtml, genCertId, linkTo, navigateTo, readJson, sha256 } from './utils.js';
import { Nav, Page, ShieldLogo } from './components.jsx';
import { onAuthChange, signUpWithEmail, signInWithEmail, saveUserProfile } from './auth.js';
import { saveCertificate, getCertificate, getUserCertificates, getUserProfile, deleteCertificate } from './db.js';
import { auth } from './firebase.js';
import logoUrl from '../images/logo.png';

const TYPE_ROUTES = {
  general: '/html/assessment_general.html',
  it: '/html/assessment_it.html',
};

function findCertificate(certId) {
  if (!certId) return null;
  const store = readJson(CERT_STORE_KEY, {});
  const exact = store[certId];
  if (exact) return { id: certId, ...exact };
  const normalized = certId.trim().toLowerCase();
  const match = Object.entries(store).find(([id]) => id.toLowerCase() === normalized);
  return match ? { id: match[0], ...match[1] } : null;
}

function parseVerifyPayload(text) {
  if (!text) return null;
  // Try JSON payload format first
  const jsonPayload = parseQRPayload(text);
  if (jsonPayload?.id) {
    return {
      id: jsonPayload.id,
      name: jsonPayload.n || '',
      url: text,
      payload: jsonPayload,
      grade: jsonPayload.g || '',
      score: jsonPayload.s || '',
      date: jsonPayload.d || '',
    };
  }
  // Fallback to URL format
  try {
    const url = new URL(text, window.location.origin);
    const id = url.searchParams.get('id');
    const name = url.searchParams.get('name');
    if (id || name) return { id: id || '', name: name || '', url: url.href };
  } catch {
    const params = new URLSearchParams(text.includes('?') ? text.split('?')[1] : text);
    const id = params.get('id');
    const name = params.get('name');
    if (id || name) return { id: id || '', name: name || '', url: text };
  }
  return null;
}

function makeLocalVerificationResult(certId, fallbackName = '', payload = null) {
  const cert = findCertificate(certId);
  const id = cert?.id || certId || '';
  const name = cert?.name || fallbackName || 'Not available';
  const p = payload || {};
  return {
    isValid: Boolean(id && name),
    certificateType: 'Cyber Hygiene Assessment',
    recipientName: name,
    issuer: p.i || BRAND.name,
    courseOrSubject: 'Cyber Hygiene Assessment',
    issueDate: p.d || (cert?.createdAt ? new Date(cert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not found'),
    expiryDate: 'N/A',
    credentialId: id,
    grade: p.g || 'N/A',
    score: p.s || '',
    verificationStatus: cert || fallbackName ? 'Verified' : 'Unverified',
    notes: cert || fallbackName ? 'QR certificate details resolved successfully.' : 'Certificate ID was not found in this browser certificate registry.',
  };
}

function useRoute() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  return route;
}

function Link({ href, children, onBeforeNavigate, ...props }) {
  return (
    <a href={href} onClick={linkTo(href, onBeforeNavigate)} {...props}>
      {children}
    </a>
  );
}

function HomePage() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  useEffect(() => {
    const unsub = onAuthChange((u) => setAuthUser(u));
    return unsub;
  }, []);

  function handleStartAssessment(e) {
    e.preventDefault();
    if (authUser) {
      navigateTo('/html/type.html');
    } else {
      navigateTo('/html/login.html');
    }
  }

  return (
    <Page style={{ position: 'relative', zIndex: 1, height: 'calc(100vh - 56px)', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0' }}>
      <div style={{ position: 'absolute', top: -100, left: -150, width: 450, height: 450, background: 'var(--primary-color)', filter: 'blur(140px)', opacity: 0.12, borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 250, right: -200, width: 400, height: 400, background: '#8B5CF6', filter: 'blur(140px)', opacity: 0.1, borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />

      <div className="hero-grid" style={{ padding: '0 40px', width: '100%', maxWidth: '100%' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: -1 }}>
            How safe are you<br /><span className="text-gradient">online?</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 0 36px', lineHeight: 1.7 }}>
            Our assessment works on all devices, so you only have to set it up once, and get beautiful results forever.
          </p>

          <div className="hero-buttons" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button type="button" className="btn-primary floating" onClick={handleStartAssessment}>
              {authUser === undefined ? 'Loading...' : 'Start Assessment →'}
            </button>
            <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-color)', display: 'inline-block', boxShadow: '0 0 8px var(--primary-color)' }} />
              Free Cyber Hygiene Assessment
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32, fontWeight: 500 }}>
            5 minutes · Certificate + PDF report included
          </div>

          <div className="grid-2" style={{ marginTop: 20, alignItems: 'stretch' }}>
            <div className="card floating" style={{ textAlign: 'left', padding: '20px 22px', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: 'var(--grade-a-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShieldLogo /></div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Verify a Certificate</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Did someone share a Hackers InfoTech certificate with you? Verify its authenticity instantly using the Certificate ID or by uploading the certificate document.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                <Link href="/html/verify_id.html" className="btn-primary" style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, textDecoration: 'none', textAlign: 'center', display: 'block' }}>🔍 Verify through ID</Link>
                <Link href="/html/Certificate_Scanner.html" className="btn-primary" style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, textDecoration: 'none', textAlign: 'center', display: 'block', background: 'var(--grade-a)', color: '#fff', border: 'none' }}>📄 Upload & Verify Document</Link>
              </div>
            </div>

            <div className="card floating" style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning-border)', width: '100%', textAlign: 'left', animationDelay: '0.2s', padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--warning-title)' }}>DPDP Act 2023 Compliance</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--warning-text)', lineHeight: 1.7, marginBottom: 12 }}>
                India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> mandates that every organization collecting or storing personal data of Indian citizens must implement strict data protection controls - regardless of business size or sector.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                {['Non-compliance can attract penalties up to Rs.250 crore per violation', 'Mandatory Data Fiduciary responsibilities for businesses storing customer data', 'This free assessment identifies your compliance gaps in minutes'].map((text, index) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, color: 'var(--warning-text)', lineHeight: 1.5 }}>
                    <span style={{ color: index === 2 ? '#2ECC71' : '#F59E0B', fontSize: 13, flexShrink: 0, marginTop: 1 }}>{index === 2 ? '✓' : '⚠'}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', padding: 40 }}>
          <div style={{ position: 'absolute', width: 500, height: 500, background: 'var(--primary-color)', filter: 'blur(120px)', opacity: 0.15, zIndex: -1 }} />
          <div style={{ position: 'absolute', width: 300, height: 300, background: '#8B5CF6', filter: 'blur(100px)', opacity: 0.1, zIndex: -1, transform: 'translate(100px, -50px)' }} />
          <img src={logoUrl} alt="Company Logo" className="logo-icon floating" style={{ width: 360, marginBottom: 32 }} />
          <div style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: 56, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 12 }}>Hackers InfoTech</div>
          <div style={{ fontSize: 18, color: 'var(--primary-color)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>360° Cyber Defence for Digital Landscape</div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500, opacity: 0.8 }}>An ISO 9001:2015 Certified Company</div>
        </div>
      </div>
    </Page>
  );
}

// ── Login / Signup Page ──────────────────────────────────────────
function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [org, setOrg] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const unsub = onAuthChange((u) => { if (u) navigateTo('/'); });
    return unsub;
  }, []);

  function friendlyError(code) {
    const map = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/user-not-found': 'No account found with this email. Please sign up.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your full name.'); return; }
      if (!phone.trim()) { setError('Please enter your phone number.'); return; }
      if (!org.trim()) { setError('Please enter your organization or college name.'); return; }
    }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), company: org.trim() });
      } else {
        await signInWithEmail(email.trim(), password);
      }
      navigateTo('/');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <div className="login-page">
        <div className="login-card">
          {/* Header */}
          <div className="login-logo">
            <div className="login-logo-icon"><i className="ti ti-shield-lock" /></div>
            <div className="login-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
            <div className="login-subtitle">
              {mode === 'login'
                ? 'Sign in to access your Cyber Hygiene Assessment'
                : 'Fill in your details to get started with Hackers InfoTech'}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <i className="ti ti-alert-circle" /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <div className="input-group">
                  <label>Full Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </div>
                <div className="input-group">
                  <label>Phone Number <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    autoComplete="tel"
                  />
                </div>
                <div className="input-group">
                  <label>Organization / College <span style={{ color: '#EF4444' }}>*</span></label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Company or college name"
                    autoComplete="organization"
                  />
                </div>
              </>
            )}
            <div className="input-group">
              <label>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <label>Password <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {/* Toggle */}
          <div className="auth-toggle">
            {mode === 'login' ? (
              <>Don’t have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); }}>Sign Up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); }}>Sign In</button></>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TypePage() {
  function choose(type) {
    localStorage.setItem('assessmentType', type);
    localStorage.removeItem('answers');
    localStorage.removeItem('currentSection');
  }

  return (
    <Page style={{ paddingTop: 48, paddingBottom: 48 }}>
      <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Who is this for?</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 36, fontSize: 15 }}>Choose the profile that best matches you</p>
      <div className="grid-2" style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        <ChoiceCard type="general" icon="👤" title="General Public" subtitle="Phone · Laptop · Internet User" color="#7C3AED" items={['No technical knowledge needed', 'Mobile, passwords, banking', 'Scam & fraud awareness', '28 questions · ~4 min']} bg="#F5F3FF" border="#DDD6FE" onChoose={choose} />
        <ChoiceCard type="it" icon="💻" title="IT & Tech Users" subtitle="Developers · IT Staff · Freelancers" color="#0EA5E9" items={['Advanced security practices', 'DevOps, cloud, network', 'Threat detection & tools', '31 questions · ~6 min']} bg="#F0F9FF" border="#BAE6FD" delay="0.2s" onChoose={choose} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link href="/" className="back-btn" style={{ display: 'inline-flex' }}><i className="ti ti-arrow-left" /> Back</Link>
      </div>
    </Page>
  );
}

function ChoiceCard({ type, icon, title, subtitle, color, items, bg, border, delay, onChoose }) {
  return (
    <Link href={TYPE_ROUTES[type]} onBeforeNavigate={() => onChoose(type)} className="card floating" style={{ cursor: 'pointer', border: `2px solid ${border}`, transition: 'transform 0.2s', animationDelay: delay, textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>{subtitle}</div>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item}</span>
        </div>
      ))}
      <div style={{ marginTop: 16, background: bg, borderRadius: 8, padding: 9, textAlign: 'center', fontWeight: 600, fontSize: 13, color }}>Start →</div>
    </Link>
  );
}

function AssessmentPage({ type }) {
  const sections = type === 'it' ? IT_SECTIONS : GENERAL_SECTIONS;
  const [sec, setSec] = useState(() => {
    const stored = parseInt(localStorage.getItem('currentSection') || '0', 10);
    return Number.isNaN(stored) || stored >= sections.length ? 0 : stored;
  });
  const [answers, setAnswers] = useState(() => readJson('answers', {}));
  const allQuestions = useMemo(() => sections.flatMap((section) => section.questions), [sections]);
  const curSec = sections[sec];
  const progress = allQuestions.length > 0 ? Math.round((Object.keys(answers).length / allQuestions.length) * 100) : 0;
  const allAnswered = curSec.questions.every((question) => answers[question.id]);

  useEffect(() => {
    localStorage.setItem('assessmentType', type);
    if (sec >= sections.length) {
      setSec(0);
      localStorage.setItem('currentSection', '0');
    }
  }, [type, sec, sections.length]);

  // Scroll to top whenever the section changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [sec]);

  function setAnswer(questionId, value) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    localStorage.setItem('answers', JSON.stringify(next));
  }

  function goToSection(index) {
    setSec(index);
    localStorage.setItem('currentSection', String(index));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function done(section) {
    return section.questions.every((question) => answers[question.id]);
  }

  function nextSection() {
    if (!allAnswered) return;
    if (sec < sections.length - 1) {
      goToSection(sec + 1);
    } else {
      navigateTo('/html/lead.html');
    }
  }

  return (
    <Page style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Section {sec + 1} of {sections.length}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{progress}% complete</span>
        </div>
        <div style={{ background: 'var(--border-color)', borderRadius: 99, height: 6 }}>
          <div style={{ background: 'var(--primary-color)', height: 6, borderRadius: 99, width: `${progress}%`, transition: 'width .4s' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {sections.map((section, index) => {
            const canOpen = index <= sec || done(sections[index - 1] || { questions: [] });
            return (
              <button key={section.id} type="button" onClick={() => canOpen && goToSection(index)} disabled={!canOpen} style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: canOpen ? 'pointer' : 'not-allowed', background: index === sec ? 'var(--primary-color)' : done(section) ? 'var(--grade-ap-bg)' : 'var(--bg-color)', color: index === sec ? '#fff' : done(section) ? 'var(--grade-ap)' : 'var(--text-secondary)', border: `1px solid ${index === sec ? 'var(--primary-color)' : done(section) ? '#A7F3D0' : 'var(--border-color)'}` }}>
                {section.icon} {section.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card fade-in" style={{ marginBottom: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 22 }}>{curSec.icon}</div>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '6px 0 4px' }}>{curSec.title}</h3>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{curSec.questions.length} questions</div>
      </div>

      {curSec.questions.map((question, index) => {
        const answer = answers[question.id];
        const borderColor = answer === 'no' ? '#FCA5A5' : answer === 'yes' ? '#A7F3D0' : 'var(--border-color)';
        return (
          <div key={question.id} className="card" style={{ marginBottom: 10, padding: '18px 20px', borderColor }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>{index + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, marginBottom: 12 }}>{question.text}</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
                  <AnswerButton active={answer === 'yes'} positive onClick={() => setAnswer(question.id, 'yes')}>✓ Yes</AnswerButton>
                  <AnswerButton active={answer === 'no'} onClick={() => setAnswer(question.id, 'no')}>✕ No</AnswerButton>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        {sec === 0 ? (
          <Link href="/html/type.html" className="back-btn"><i className="ti ti-arrow-left" /> Back</Link>
        ) : (
          <button type="button" onClick={() => goToSection(sec - 1)} className="btn-secondary">← Previous</button>
        )}
        <button type="button" onClick={nextSection} disabled={!allAnswered} className="btn-primary" style={{ opacity: allAnswered ? 1 : 0.5 }}>{sec === sections.length - 1 ? 'See My Score →' : 'Next Section →'}</button>
      </div>
    </Page>
  );
}

function AnswerButton({ active, positive, onClick, children }) {
  const color = positive ? '#059669' : '#DC2626';
  const bg = positive ? 'var(--grade-ap-bg)' : 'var(--grade-cp-bg)';
  return (
    <button type="button" onClick={onClick} style={{ padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${active ? color : 'var(--border-color)'}`, background: active ? bg : 'var(--bg-color)', color: active ? color : 'var(--text-secondary)', transition: 'all 0.2s' }}>
      {children}
    </button>
  );
}

function LeadPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        // Not logged in — redirect to login
        navigateTo('/html/login.html');
        return;
      }
      // Load profile from Firestore
      const p = await getUserProfile(firebaseUser.uid);
      const resolved = p || { name: firebaseUser.displayName || '', email: firebaseUser.email || '', phone: '', company: '', uid: firebaseUser.uid };
      setProfile({ ...resolved, uid: firebaseUser.uid });
      setLoading(false);
    });
    return unsub;
  }, []);

  async function submit() {
    if (!profile) return;
    setSubmitting(true);
    const certId = genCertId();
    const hash = await sha256(`${profile.name.trim()}|${certId}`);
    // Keep localStorage for backward compatibility
    const store = readJson(CERT_STORE_KEY, {});
    store[certId] = { hash, name: profile.name.trim(), createdAt: new Date().toISOString() };
    localStorage.setItem(CERT_STORE_KEY, JSON.stringify(store));
    localStorage.setItem('lead', JSON.stringify({
      name: profile.name?.trim() || '',
      email: profile.email?.trim() || '',
      phone: profile.phone?.trim() || '',
      company: profile.company?.trim() || '',
      certId,
      uid: profile.uid,
    }));
    navigateTo('/html/results.html');
  }

  if (loading) {
    return (
      <Page style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading your profile...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page style={{ padding: '40px 40px 48px', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your results are ready!</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>We'll generate your certificate using your account profile.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Your Certificate Details</span>
          <button type="button" onClick={() => navigateTo('/html/profile.html')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-edit" style={{ fontSize: 16 }} /> Edit
          </button>
        </div>
        {[
          { icon: 'ti-user', label: 'Name', value: profile?.name || '—' },
          { icon: 'ti-mail', label: 'Email', value: profile?.email || '—' },
          { icon: 'ti-phone', label: 'Phone', value: profile?.phone || 'Not set' },
          { icon: 'ti-building', label: 'Company', value: profile?.company || 'Not set' },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--grade-a-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${icon}`} style={{ color: 'var(--primary-color)', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
          Updates made here will be automatically saved to your profile.
        </p>
      </div>

      <button type="button" onClick={submit} className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
        {submitting ? '⏳ Preparing your results...' : 'Show My Cyber Safety Score →'}
      </button>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <Link href="/html/type.html" className="back-btn"><i className="ti ti-arrow-left" /> Back</Link>
      </div>
    </Page>
  );
}

function LeadInput({ label, value, onChange, onBlur, placeholder, type = 'text', error }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder={placeholder} style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: `1px solid ${error ? '#EF4444' : 'var(--border-color)'}`, borderRadius: 9, background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
      {error && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 3, fontWeight: 500 }}>{error}</div>}
    </div>
  );
}

function ResultsPage() {
  const queryId = new URLSearchParams(window.location.search).get('id');
  const [dbData, setDbData] = useState(null);
  const [loadingDb, setLoadingDb] = useState(!!queryId);
  const [busy, setBusy] = useState('');
  const [emailState, setEmailState] = useState('');
  const [certQrDataUrl, setCertQrDataUrl] = useState('');
  const [certSaved, setCertSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Fetch from Firestore when opened via ?id= URL ---
  useEffect(() => {
    if (queryId) {
      getCertificate(queryId).then(cert => {
        if (cert) {
          setDbData({
            lead: { certId: cert.certId, name: cert.name, email: cert.email || '', company: cert.company || '', uid: cert.uid },
            type: cert.assessmentType || 'general',
            answers: cert.answers || {},
            score: cert.score || 0,
            mx: cert.maxScore || 100,
            pct: cert.percentage || 0,
            date: cert.issuedAt?.toDate
              ? cert.issuedAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
              : new Date(cert.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
          });
        }
        setLoadingDb(false);
      }).catch(() => setLoadingDb(false));
    }
  }, [queryId]);

  // --- Derived values (all computed before any early return) ---
  const lead        = dbData ? dbData.lead    : readJson('lead', {});
  const type        = dbData ? dbData.type    : localStorage.getItem('assessmentType');
  const answers     = dbData ? dbData.answers : readJson('answers', {});
  const reportDate  = dbData ? dbData.date    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const sections    = ALL[type] || GENERAL_SECTIONS;
  const allQuestions = sections.flatMap(s => s.questions);
  const mx    = dbData ? dbData.mx  : maxScore(type);
  const score = dbData ? dbData.score : allQuestions.reduce((sum, q) => sum + (answers[q.id] === 'yes' ? q.w : 0), 0);
  const pct   = dbData ? dbData.pct  : (mx > 0 ? Math.round((score / mx) * 100) : 0);
  const grade = getGrade(pct);
  const failed = allQuestions.filter(q => answers[q.id] === 'no');
  const date = reportDate;
  const reportTime = dbData ? new Date(dbData.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const time = reportTime;
  const certId   = lead.certId || queryId || '';
  const verifyUrl = certId ? `${location.origin}/html/results.html?id=${encodeURIComponent(certId)}` : '';
  
  // The QR payload will now contain the exact text details of the certificate.
  // This allows offline verification simply by scanning the code, without needing to open a URL.
  const qrPayload = useMemo(() => {
    if (!certId) return '';
    return `Hackers InfoTech - Official Certificate
Name: ${lead.name}
${lead.company ? `Company: ${lead.company}\n` : ''}Grade: ${grade.grade} (${grade.label})
Score: ${pct}%
Date: ${date}
Time: ${time}
ID: ${certId}`;
  }, [certId, lead.name, lead.company, grade.grade, grade.label, pct, date, time]);

  // --- Redirect (no data and not a direct link) ---
  useEffect(() => {
    if (!loadingDb && !queryId && (!type || !lead.email)) navigateTo('/');
  }, [type, lead.email, loadingDb, queryId]);

  // --- Generate QR code image (MUST be above early return) ---
  useEffect(() => {
    let active = true;
    if (!qrPayload) { setCertQrDataUrl(''); return; }
    QRCode.toDataURL(qrPayload, { width: 160, margin: 1, errorCorrectionLevel: 'L', color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then(url  => { if (active) setCertQrDataUrl(url); })
      .catch(()  => { if (active) setCertQrDataUrl(''); });
    return () => { active = false; };
  }, [qrPayload]);

  // --- Save to Firestore once (MUST be above early return) ---
  useEffect(() => {
    if (!lead.certId || !lead.uid || certSaved || !qrPayload) return;
    saveCertificate({
      uid: lead.uid, certId: lead.certId, name: lead.name, email: lead.email,
      company: lead.company || '', assessmentType: type, score, maxScore: mx,
      percentage: pct, grade: grade.grade, gradeLabel: grade.label,
      answers, qrPayload, verifyUrl,
    }).then(() => setCertSaved(true)).catch(console.error);
  }, [lead.certId, lead.uid, qrPayload]);

  // --- Loading spinner ---
  if (loadingDb) {
    return (
      <Page style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading certificate details...</div>
        </div>
      </Page>
    );
  }


  async function makeQRDataUrl(text, size) {
    try {
      return await QRCode.toDataURL(text, {
        width: 400,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (e) {
      console.error("QR Code Generation failed inside makeQRDataUrl:", e);
      return '';
    }
  }

  function buildReportHtml() {
    return `<div style="font-family:'DM Sans', sans-serif; color:#0F172A;">
      <div style="background:#0C1B2E; color:#fff; padding:24px; border-radius:12px; margin-bottom:20px;">
        <div style="font-size:10px; letter-spacing:.1em; color:#38BDF8; text-transform:uppercase; margin-bottom:6px;">Hackers InfoTech - Confidential Report</div>
        <div style="font-size:22px; font-weight:700; margin-bottom:4px;">Cyber Hygiene Assessment Report</div>
        <div style="font-size:13px; color:#94A3B8;">Prepared for: <b style="color:#fff">${escHtml(lead.name)}</b>${lead.company ? ` - ${escHtml(lead.company)}` : ''} - ${date}</div>
        <div style="font-size:12px; color:#64748B; margin-top:4px;">Email: ${escHtml(lead.email)} - Phone: ${escHtml(lead.phone)}</div>
      </div>
      <div style="background:#F8FAFC; border:2px solid ${grade.color}44; border-radius:12px; padding:20px; text-align:center; margin-bottom:18px;">
        <div style="font-size:60px; font-weight:700; color:${grade.color}; line-height:1; font-family:'DM Mono', monospace;">${grade.grade}</div>
        <div style="font-size:16px; font-weight:600;">${grade.label}</div>
        <div style="font-size:18px; font-weight:700; color:${grade.color};">${pct}% - ${score}/${mx} pts</div>
        <div style="font-size:12px; color:#64748B; margin-top:6px;">${grade.desc}</div>
      </div>
      <h3 style="font-size:14px; margin-bottom:10px;">Category Breakdown</h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px; border:1px solid #E2E8F0;"><thead><tr style="background:#F1F5F9;"><th style="padding:8px 10px; text-align:left;">Category</th><th style="padding:8px 10px; text-align:center;">Score %</th><th style="padding:8px 10px; text-align:center;">Points</th></tr></thead><tbody>${sections.map((section) => {
        const sectionMax = section.questions.reduce((sum, question) => sum + question.w, 0);
        const sectionScore = section.questions.reduce((sum, question) => sum + (answers[question.id] === 'yes' ? question.w : 0), 0);
        const sectionPct = Math.round((sectionScore / sectionMax) * 100);
        return `<tr><td style="padding:7px 10px; border-bottom:1px solid #E2E8F0;">${section.icon} ${escHtml(section.title)}</td><td style="padding:7px 10px; border-bottom:1px solid #E2E8F0; text-align:center; font-weight:600; color:${sectionPct >= 80 ? '#059669' : sectionPct >= 60 ? '#D97706' : '#DC2626'};">${sectionPct}%</td><td style="padding:7px 10px; border-bottom:1px solid #E2E8F0; text-align:center;">${sectionScore}/${sectionMax}</td></tr>`;
      }).join('')}</tbody></table>
      ${failed.length > 0 ? `<h3 style="font-size:14px; margin-bottom:10px;">Action Plan (${failed.length} items)</h3>${failed.map((question, index) => `<div style="margin-bottom:12px; padding-left:10px; border-left:3px solid #EF4444;"><div style="font-weight:600; font-size:12px; margin-bottom:2px;">${index + 1}. ${escHtml(question.text)}</div><div style="font-size:11px; color:#64748B;"><b style="color:#0EA5E9;">Fix: </b>${escHtml(question.tip)}</div></div>`).join('')}` : ''}
      <div style="background:#0C1B2E; color:#fff; border-radius:10px; padding:14px; margin-top:20px; font-size:11px; text-align:center;"><b>${BRAND.name}</b> - ${BRAND.url} - ${BRAND.email} - ${BRAND.phone} - ${BRAND.city}</div>
    </div>`;
  }

  async function buildCertHtml() {
    // --- BUG 1 FIX: GUARANTEE QR DATA URL VALUE ---
    let qrDataUrl = certQrDataUrl;
    
    // If the React state hasn't finished compiling yet (fast click), force-generate it synchronously right now
    if (!qrDataUrl && qrPayload) {
      try {
        qrDataUrl = await QRCode.toDataURL(qrPayload, { 
          width: 160, 
          margin: 1, 
          errorCorrectionLevel: 'L', 
          color: { dark: '#0F172A', light: '#FFFFFF' } 
        });
      } catch (e) {
        console.error("Inline QR matrix compilation failed:", e);
      }
    }
    
    // --- BUG 2 FIX: REMOVE max-width:760px AND EXTEND TO 100% ---
    // This allows the certificate layout to spread perfectly over the 1123px landscape space
    return `<div style="width:100%; height:100%; background:#0C1B2E; border:10px solid #38BDF8; border-radius:30px; padding:40px 50px; text-align:center; color:#fff; font-family:Arial,sans-serif; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between;">
      <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size:16px; letter-spacing:.12em; color:#38BDF8; text-transform:uppercase; margin-bottom:10px;">Hackers InfoTech - Official Certificate</div>
        <div style="font-size:42px; font-weight:700; color:#F0F9FF; margin-bottom:10px;">Cyber Hygiene Assessment</div>
        <div style="color:#64748B; margin-bottom:20px; font-size:16px;">Certificate of Completion</div>
        <div style="font-size:18px; color:#94A3B8; margin-bottom:6px;">This certifies that</div>
        <div style="font-size:38px; font-weight:700; color:#38BDF8; margin-bottom:4px;">${escHtml(lead.name)}</div>
        ${lead.company ? `<div style="font-size:16px; color:#64748B; margin-bottom:12px;">${escHtml(lead.company)}</div>` : ''}
        <div style="font-size:16px; color:#94A3B8; margin-bottom:14px;">has completed the Cyber Hygiene Assessment and achieved the grade</div>
        <div style="font-size:90px; font-weight:700; color:${grade.color}; line-height:1; font-family:monospace;">${grade.grade}</div>
        <div style="font-size:24px; font-weight:600; color:#F0F9FF; margin:8px 0 6px;">${grade.label}</div>
        <div style="font-size:26px; color:${grade.color}; font-weight:700; margin-bottom:6px;">${pct}% (${score}/${mx} pts)</div>
        <div style="color:#475569; font-size:16px; margin-bottom:18px;">Assessed on ${date}</div>
        
        ${qrDataUrl ? `<div style="background:#FFFFFF; border:3px solid #E2E8F0; border-radius:16px; padding:10px 14px; display:inline-flex; flex-direction:column; align-items:center; gap:6px; margin: 0 auto;">
          <img src="${qrDataUrl}" width="100" height="100" style="display:block;" />
          <div style="color:${grade.color}; font-family:monospace; font-size:12px; font-weight:700;">${escHtml(certId)}</div>
        </div>` : `<div style="color:#EF4444; font-size:16px;">QR code unavailable</div>`}
      </div>
      <div style="border-top:1px solid #1E3050; padding-top:20px; display:flex; justify-content:center; gap:40px; font-size:14px; color:#94A3B8; font-family:Arial,sans-serif; font-weight: 500; letter-spacing: 0.5px;">
        <span>${BRAND.url}</span><span>${BRAND.email}</span><span>${BRAND.city}</span>
      </div>
    </div>`;
  }

  async function downloadPdf(which) {
    const html2canvas = window.html2canvas;
    const jsPDF = window.jspdf?.jsPDF;
    if (!html2canvas || !jsPDF) {
      alert('PDF libraries are still loading. Please try again.');
      return;
    }
    setBusy(which);
    
    // Create a fresh off-document container
    const el = document.createElement('div');
    
    // Enforce matching container dimensions based on the document type
    // Certificate requires wide landscape boundaries; Report uses standard portrait width
    const isCert = which === 'cert';
    const widthPx = isCert ? 1123 : 794;  // 1123px matches A4 landscape at 96 DPI
    const heightPx = isCert ? 794 : 1123; // 1123px matches A4 portrait at 96 DPI
    
    el.style.cssText = `
      position: absolute; 
      top: -20000px; 
      left: 0; 
      width: ${widthPx}px; 
      height: ${heightPx}px;
      box-sizing: border-box;
      overflow: hidden;
      background: ${isCert ? '#0C1B2E' : '#ffffff'};
      padding: ${isCert ? '0px' : '40px 30px'};
      color: ${isCert ? '#fff' : '#000'};
    `;
    document.body.appendChild(el);
    
    try {
      el.innerHTML = isCert ? await buildCertHtml() : buildReportHtml();
      
      // Wait for all images (QR codes) to signal structural completion and FORCE decoding
      const images = Array.from(el.querySelectorAll('img'));
      await Promise.all(images.map(async (img) => {
        try {
          if (!img.complete) {
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }
          // Explicitly force the browser to decode the Base64 image payload into memory
          // This prevents html2canvas from capturing a blank box if the browser deferred rendering it off-screen
          await img.decode();
        } catch (e) {
          console.warn("Image decode failed, continuing anyway", e);
        }
      }));

      // THE CRITICAL PAINT TICK
      // Forces the browser main thread to pause for 400 milliseconds.
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const canvas = await html2canvas(el, {
        scale: 3, // 3x scale for ~300 DPI print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: isCert ? '#0C1B2E' : '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      // MATCH PDF ORIENTATION TO DOCUMENT TYPE
      // Certificate must be landscape ('l'), Report must be portrait ('p')
      const pdf = new jsPDF({ 
        orientation: isCert ? 'l' : 'p', 
        unit: 'mm', 
        format: 'a4' 
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 297mm for Landscape, 210mm for Portrait
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm for Landscape, 297mm for Portrait
      
      // Render the high-resolution canvas snapshot perfectly across the entire page canvas
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        0, 
        0, 
        pdfWidth, 
        pdfHeight, 
        undefined, 
        'FAST'
      );
      
      const fileName = isCert ? `${lead.name}_Certificate.pdf` : `${lead.name}_CyberReport.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("PDF generation pipeline failed:", error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Clean up the DOM node element to prevent severe web app memory leaks
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
      setBusy('');
    }
  }

  async function downloadCertificateImage() {
    const html2canvas = window.html2canvas;
    if (!html2canvas) {
      alert('Image library is still loading. Please try again.');
      return;
    }
    setBusy('image');
    
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute; 
      top: -20000px; 
      left: 0; 
      width: 1123px; 
      height: 794px;
      box-sizing: border-box;
      overflow: hidden;
      background: #0C1B2E;
      padding: 0px;
      color: #fff;
    `;
    document.body.appendChild(el);
    
    try {
      el.innerHTML = await buildCertHtml();
      
      const images = Array.from(el.querySelectorAll('img'));
      await Promise.all(images.map(async (img) => {
        try {
          if (!img.complete) {
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }
          await img.decode();
        } catch (e) {
          console.warn("Image decode failed", e);
        }
      }));

      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0C1B2E',
        logging: false
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to generate image.');
          setBusy('');
          return;
        }
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Cyber_Hygiene_Certificate.png';
        a.click();
        
        setBusy('');
      }, 'image/png');

    } catch (error) {
      console.error("Image generation failed:", error);
      alert('Error generating certificate image. Please try again.');
      setBusy('');
    } finally {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }


  function handleCopyVerifyLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(verifyUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((err) => {
        console.error('Copy failed', err);
        fallbackCopy(verifyUrl);
      });
    } else {
      fallbackCopy(verifyUrl);
    }
  }

  function fallbackCopy(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Failed to copy. Please manually copy this link:\n' + text);
    }
  }

  async function sendEmail() {
    const targetEmail = lead.email || (auth.currentUser ? auth.currentUser.email : null);
    
    if (!targetEmail) {
      alert("No email address found to send this report to. Please update your profile.");
      setEmailState('');
      return;
    }

    if (!window.emailjs) {
      alert('Email library is still loading. Please try again.');
      return;
    }
    setEmailState('sending');
    try {
      window.emailjs.init(BRAND.emailjs.publicKey);
      await window.emailjs.send(BRAND.emailjs.serviceId, BRAND.emailjs.templateId, {
        to_email: targetEmail,
        to_name: lead.name,
        subject: `Cyber Hygiene Report`,
        html_body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px;background:#ffffff;border:1px solid #E2E8F0;border-radius:12px;">
          <h2 style="color:#0C1B2E;margin-bottom:20px;font-size:24px;">Cyber Hygiene Report</h2>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px;">Dear <b>${escHtml(lead.name)}</b>,</p>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:20px;">Thank you for taking the time to complete the Cyber Hygiene Assessment. We have successfully processed your responses and calculated your cyber safety score.</p>
          <p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:30px;">Your overall grade is <b>${grade.grade}</b> (${pct}%). This score reflects your current cybersecurity posture and readiness against common digital threats.</p>
          
          <div style="margin-top:40px;margin-bottom:40px;text-align:center;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:#0C1B2E;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;margin:10px;font-size:15px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">📄 Download Certificate</a>
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:#F1F5F9;color:#0F172A;text-decoration:none;border-radius:8px;font-weight:bold;border:1px solid #CBD5E1;margin:10px;font-size:15px;">📊 View Full Report</a>
          </div>
          
          <p style="color:#475569;font-size:15px;line-height:1.6;border-top:1px solid #E2E8F0;padding-top:20px;margin-top:30px;">
            Best regards,<br/>
            <strong>Hackers InfoTech</strong>
          </p>
        </div>`,
      });
      setEmailState('sent');
    } catch (error) {
      console.error('EmailJS Error:', error);
      setEmailState(error?.text || error?.message || 'Check config or quota');
    }
  }

  return (
    <>
      {queryId && <Nav />}
      <Page style={{ paddingTop: 36, paddingBottom: 48 }}>
        <div className="card" style={{ background: grade.bg, borderColor: `${grade.color}33`, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: grade.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Cyber Safety Grade · {date}</div>
          <div style={{ fontSize: 88, fontWeight: 700, color: grade.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{grade.grade}</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{grade.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: grade.color, marginTop: 4 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>{score} / {mx} points</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>{grade.desc}</div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>📄 Your Official Certificate</h3>
          
          {/* Inline Certificate Preview */}
          {certQrDataUrl ? (
            <div style={{ background: '#0C1B2E', border: `3px solid #38BDF8`, borderRadius: 20, padding: '30px 20px', textAlign: 'center', color: '#fff', marginBottom: 20, fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: '#38BDF8', textTransform: 'uppercase', marginBottom: 10 }}>Hackers InfoTech - Official Certificate</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#F0F9FF', marginBottom: 4 }}>Cyber Hygiene Assessment</div>
              <div style={{ color: '#64748B', marginBottom: 24, fontSize: 11 }}>Certificate of Completion</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>This certifies that</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#38BDF8', marginBottom: 2 }}>{lead.name}</div>
              {lead.company && <div style={{ fontSize: 11, color: '#64748B', marginBottom: 16 }}>{lead.company}</div>}
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12, marginTop: lead.company ? 0 : 12 }}>has completed the Cyber Hygiene Assessment and achieved the grade</div>
              <div style={{ fontSize: 72, fontWeight: 700, color: grade.color, lineHeight: 1, fontFamily: 'monospace' }}>{grade.grade}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#F0F9FF', margin: '6px 0 4px' }}>{grade.label}</div>
              <div style={{ fontSize: 18, color: grade.color, fontWeight: 700, marginBottom: 4 }}>{pct}% ({score}/{mx} pts)</div>
              <div style={{ color: '#475569', fontSize: 11, marginBottom: 20 }}>Assessed on {date}</div>
              
              <div style={{ background: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: 12, padding: 12, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                <img src={certQrDataUrl} width="100" height="100" style={{ display: 'block' }} alt="Verify QR" />
                <div style={{ color: grade.color, fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{certId}</div>
              </div>
              
              <div style={{ borderTop: '1px solid #1E3050', marginTop: 10, paddingTop: 16, display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: '#94A3B8', flexWrap: 'wrap', fontWeight: 500 }}>
                <span>{BRAND.url}</span>
                <span>{BRAND.email}</span>
              </div>
            </div>
          ) : (
            <div style={{ background: '#0C1B2E', borderRadius: 20, padding: '50px 20px', textAlign: 'center', marginBottom: 20 }}>
              <div className="loader" style={{ margin: '0 auto 16px', borderColor: '#38BDF8 transparent #38BDF8 transparent' }} />
              <div style={{ color: '#94A3B8', fontSize: 12 }}>Generating certificate and QR code...</div>
            </div>
          )}
          <div className="grid-2" style={{ marginBottom: 10 }}>
            <button type="button" onClick={() => downloadPdf('cert')} disabled={busy === 'cert'} style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: '#7C3AED', cursor: 'pointer' }}>{busy === 'cert' ? '⏳ Generating...' : '🏅 Download PDF Certificate'}</button>
            <button type="button" onClick={downloadCertificateImage} disabled={busy === 'image'} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: '#059669', cursor: 'pointer' }}>{busy === 'image' ? '⏳ Generating...' : '🖼️ Download Image to Share'}</button>
          </div>
          <button type="button" onClick={() => downloadPdf('report')} disabled={busy === 'report'} style={{ width: '100%', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', marginBottom: 14 }}>{busy === 'report' ? '⏳ Generating...' : '📋 Download Full Report'}</button>
          
          <button type="button" onClick={sendEmail} disabled={emailState !== ''} style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: (emailState !== '' && emailState !== 'sending' && emailState !== 'sent') ? '#EF4444' : '#64748B', cursor: emailState === '' ? 'pointer' : 'default' }}>
            {emailState === '' ? `📧 Email Report to ${lead.email}` : emailState === 'sending' ? '⏳ Sending...' : emailState === 'sent' ? `✅ Report sent to ${lead.email}` : `❌ Failed: ${emailState}`}
          </button>

          {/* Social Share */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>🌐 Share Your Achievement</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* LinkedIn Post */}
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(verifyUrl)}&title=${encodeURIComponent(`I scored ${grade.grade} (${pct}%) on the Cyber Hygiene Assessment!`)}&summary=${encodeURIComponent(`I just completed the Cyber Hygiene Assessment by Hackers InfoTech and achieved the grade ${grade.grade} (${pct}%). Verify my certificate: ${verifyUrl}`)}&source=${encodeURIComponent('Hackers InfoTech')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0A66C2', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1877F2', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎓 I scored ${grade.grade} (${pct}%) on the Cyber Hygiene Assessment by @HackersInfoTech!\n\nVerify my certificate:`)}&url=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#000', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.763l7.724-8.833L1.5 2.25h6.312l4.261 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X (Twitter)
              </a>
            </div>
          </div>
        </div>

        <CategoryBreakdown sections={sections} answers={answers} />
        {failed.length > 0 && <ActionPlan failed={failed} />}
        <ConsultationCta isHistoryView={!!queryId} />
      </Page>
    </>
  );
}

function CategoryBreakdown({ sections, answers }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Category Breakdown</h3>
      {sections.map((section) => {
        const sectionMax = section.questions.reduce((sum, question) => sum + question.w, 0);
        const sectionScore = section.questions.reduce((sum, question) => sum + (answers[question.id] === 'yes' ? question.w : 0), 0);
        const percent = Math.round((sectionScore / sectionMax) * 100);
        const color = percent >= 80 ? '#059669' : percent >= 60 ? '#D97706' : '#DC2626';
        const bg = percent >= 80 ? '#059669' : percent >= 60 ? '#F59E0B' : '#EF4444';
        return (
          <div key={section.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{section.icon} {section.title}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{percent}%</span>
            </div>
            <div style={{ background: 'var(--border-color)', borderRadius: 99, height: 7 }}>
              <div style={{ background: bg, height: 7, borderRadius: 99, width: `${percent}%`, transition: 'width .6s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionPlan({ failed }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Your Action Plan</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 18px' }}>Fix these {failed.length} items to improve your score</p>
      {failed.map((question, index) => (
        <div key={question.id} style={{ borderLeft: '3px solid #EF4444', paddingLeft: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.5 }}>{question.text}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}><span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Fix: </span>{question.tip}</div>
        </div>
      ))}
    </div>
  );
}

function ConsultationCta({ isHistoryView }) {
  return (
    <div style={{ background: '#0C1B2E', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#F0F9FF', margin: '0 0 8px' }}>Want Hackers InfoTech to fix this for you?</div>
      <div style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 22px', lineHeight: 1.7 }}>Book a free 30-minute consultation. We will walk through your results and create a personalised cyber security plan.</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href={BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14, padding: '12px 24px' }}>📅 Book Free 30-Min Call</a>
        {isHistoryView ? (
          <button type="button" onClick={() => history.back()} style={{ background: 'transparent', border: '1px solid #1E3050', color: '#94A3B8', borderRadius: 9, padding: '12px 24px', fontSize: 14, cursor: 'pointer' }}><i className="ti ti-arrow-left" style={{ marginRight: 4 }}/> Back</button>
        ) : (
          <button type="button" onClick={() => navigateTo('/')} style={{ background: 'transparent', border: '1px solid #1E3050', color: '#94A3B8', borderRadius: 9, padding: '12px 24px', fontSize: 14, cursor: 'pointer' }}>Retake Assessment</button>
        )}
      </div>
      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #1E3050', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#64748B' }}>🌐 {BRAND.url}</span>
        <span style={{ fontSize: 12, color: '#64748B' }}>📞 {BRAND.phone}</span>
        <span style={{ fontSize: 12, color: '#64748B' }}>✉️ {BRAND.email}</span>
      </div>
    </div>
  );
}

function VerifyIdPage() {
  const [certId, setCertId] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [warning, setWarning] = useState(false);
  const [status, setStatus] = useState(null);

  async function checkDB() {
    setWarning(false);
    try {
      const response = await fetch('http://127.0.0.1:8000/health/');
      if (!response.ok) throw new Error();
      return true;
    } catch {
      setWarning(true);
      return false;
    }
  }

  async function verifyCertificate() {
    const trimmedId = certId.trim();
    const trimmedName = name.trim();
    const nextErrors = { certId: !trimmedId };
    setErrors(nextErrors);
    if (nextErrors.certId) return;

    setStatus({ type: '', text: 'Checking records...' });

    // First try Firebase (works globally on any device)
    try {
      const fbCert = await getCertificate(trimmedId);
      if (fbCert) {
        if (trimmedName && fbCert.name && trimmedName.toLowerCase() !== fbCert.name.toLowerCase()) {
          setStatus({ type: 'error', title: 'Verification Failed', text: 'Certificate ID found, but the entered name does not match this certificate.' });
          return;
        }
        const issueDate = fbCert.issuedAt?.toDate
          ? fbCert.issuedAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
          : 'On Record';
        setWarning(false);
        setStatus({
          type: 'success',
          title: 'Verification Successful',
          text: 'Certificate record verified against the secure database.',
          cert: {
            name: fbCert.name || 'Not available',
            id: fbCert.certId,
            grade: fbCert.grade,
            gradeLabel: fbCert.gradeLabel,
            score: fbCert.score,
            maxScore: fbCert.maxScore,
            percentage: fbCert.percentage,
            assessmentType: fbCert.assessmentType,
            issueDate,
          },
        });
        return;
      }
    } catch {}

    // Fallback: localStorage
    const localCert = findCertificate(trimmedId);
    if (localCert) {
      if (trimmedName && localCert.name && trimmedName.toLowerCase() !== localCert.name.toLowerCase()) {
        setStatus({ type: 'error', title: 'Verification Failed', text: 'Certificate ID found, but the entered name does not match this certificate.' });
        return;
      }
      setWarning(false);
      setStatus({
        type: 'success',
        title: 'Verification Successful',
        text: 'Certificate record found in this browser registry.',
        cert: { name: localCert.name || 'Not available', id: localCert.id },
      });
      return;
    }

    setStatus({ type: 'error', title: 'Certificate Not Found', text: 'This certificate ID was not found in our records. Please check the ID and try again.' });
  }

  return (
    <>
      <Nav />
      <div className="container fade-in verify-page">
        {warning && <div className="db-warning"><i className="ti ti-alert-triangle" /> Database Server is Offline. Verification may not work.</div>}
        <div className="card verify-card">
          <div style={{ marginBottom: 30 }}>
            <div style={{ width: 64, height: 64, background: 'var(--grade-a-bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', margin: '0 auto 16px' }}><i className="ti ti-certificate" style={{ fontSize: 32 }} /></div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Certificate Verification</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Verify authenticity through secure ID lookup.</p>
          </div>
          <VerifyInput label="Certificate ID" value={certId} setValue={setCertId} error={errors.certId} errorText="Please enter the Certificate ID" placeholder="e.g. CERT-2024-001" />
          <VerifyInput label="Recipient Full Name (optional)" value={name} setValue={setName} error={false} errorText="" placeholder="Name as printed on certificate" />
          <button className="btn-primary" style={{ width: '100%' }} type="button" onClick={verifyCertificate}><i className="ti ti-shield-check" /> Verify Certificate</button>
          {status && (
            <div className={`status-box ${status.type}`} style={{ display: 'block', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>{status.title || status.text}</div>
              {status.title && <div style={{ fontSize: 13, opacity: 0.9, textAlign: 'center', marginBottom: status.cert ? 12 : 0 }}>{status.text}</div>}
              {status.cert && (
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Recipient Name', value: status.cert.name },
                    { label: 'Certificate ID', value: status.cert.id, mono: true },
                    status.cert.grade && { label: 'Grade', value: `${status.cert.grade} — ${status.cert.gradeLabel || ''}` },
                    status.cert.percentage != null && { label: 'Score', value: `${status.cert.percentage}%  (${status.cert.score}/${status.cert.maxScore} pts)` },
                    status.cert.assessmentType && { label: 'Assessment Type', value: status.cert.assessmentType === 'it' ? 'IT Professional' : 'General Public' },
                    status.cert.issueDate && { label: 'Issue Date', value: status.cert.issueDate },
                  ].filter(Boolean).map(({ label, value, mono }) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: mono ? 'DM Mono, monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Link href="/" className="btn-secondary"><i className="ti ti-arrow-left" /> Back to Home</Link>
      </div>
    </>
  );
}

function VerifyInput({ label, value, setValue, error, errorText, placeholder }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input value={value} onChange={(event) => setValue(event.target.value)} className={error ? 'error' : ''} placeholder={placeholder} />
      <div className="error-text" style={{ display: error ? 'block' : 'none' }}>{errorText}</div>
    </div>
  );
}

function CertDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get('id');
  const rawName = params.get('name');
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function lookup() {
      // Parse QR JSON payload if present
      let parsedQR = null;
      try { parsedQR = parseQRPayload(decodeURIComponent(rawId || '')); } catch {}

      const resolvedId = parsedQR?.id || rawId;
      const resolvedName = parsedQR?.n || rawName;

      // 1. Try Firestore first (works on ANY device globally)
      let found = null;
      try { found = await getCertificate(resolvedId); } catch {}

      // 2. Fallback to localStorage (same browser only)
      if (!found) found = findCertificate(resolvedId);

      if (found) {
        setCert({ ...found, qrGrade: parsedQR?.g, qrScore: parsedQR?.s, qrPct: parsedQR?.p, qrDate: parsedQR?.d });
        setVerified(true);
      } else if (resolvedId) {
        setCert({ id: resolvedId, name: resolvedName, createdAt: null, qrGrade: parsedQR?.g, qrScore: parsedQR?.s, qrPct: parsedQR?.p, qrDate: parsedQR?.d });
        setVerified(false);
      }
      setLoading(false);
    }
    lookup();
  }, [rawId, rawName]);

  const displayName = cert?.name || rawName || 'Unknown';
  const displayId = cert?.id || rawId || '';
  const issueDate = cert?.issuedAt?.toDate
    ? cert.issuedAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : cert?.createdAt
      ? new Date(cert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : (cert?.qrDate || 'On Record');

  return (
    <>
      <Nav />
      <div className="page-body">
        <div className="cert-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="loader" />
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Verifying certificate...</div>
            </div>
          ) : !displayId ? (
            <div style={{ textAlign: 'center' }}>
              <div className="error-icon"><i className="ti ti-link-off" /></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Invalid Certificate Link</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>This QR code is missing required certificate information. Please scan the QR code on the original certificate.</div>
              <Link href="/" className="btn-home"><i className="ti ti-home" /> Back to Home</Link>
            </div>
          ) : (
            <>
              <div className="cert-badge" style={{ background: verified ? 'rgba(5,150,105,0.12)' : 'rgba(56,189,248,0.12)', borderColor: verified ? 'rgba(5,150,105,0.3)' : 'rgba(56,189,248,0.3)', color: verified ? '#059669' : '#0EA5E9' }}>
                <i className={`ti ti-${verified ? 'shield-check' : 'certificate'}`} />
              </div>
              <div className="cert-issued">Hackers InfoTech — Official Certificate</div>
              <div className="cert-title">Cyber Hygiene Assessment</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: verified ? '#ECFDF5' : '#FFF7ED', border: `1px solid ${verified ? '#6EE7B7' : '#FED7AA'}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: verified ? '#059669' : '#B45309', marginBottom: 20 }}>
                <i className={`ti ti-${verified ? 'circle-check' : 'alert-circle'}`} />
                {verified ? 'Verified' : 'Certificate Presented (QR Data)'}
              </div>
              <div className="info-block">
                <div className="info-row">
                  <div className="info-icon blue"><i className="ti ti-user" /></div>
                  <div className="info-text">
                    <div className="info-label">Recipient Name</div>
                    <div className="info-value">{displayName}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon green"><i className="ti ti-id" /></div>
                  <div className="info-text">
                    <div className="info-label">Certificate ID</div>
                    <div className="info-value mono">{displayId}</div>
                  </div>
                </div>
                {(cert?.qrGrade || cert?.qrPct) && (
                  <div className="info-row">
                    <div className="info-icon blue"><i className="ti ti-award" /></div>
                    <div className="info-text">
                      <div className="info-label">Grade / Score</div>
                      <div className="info-value">{cert.qrGrade} — {cert.qrPct} ({cert.qrScore})</div>
                    </div>
                  </div>
                )}
                <div className="info-row">
                  <div className="info-icon blue"><i className="ti ti-calendar" /></div>
                  <div className="info-text">
                    <div className="info-label">Issue Date</div>
                    <div className="info-value">{issueDate}</div>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-icon green"><i className="ti ti-building" /></div>
                  <div className="info-text">
                    <div className="info-label">Issued By</div>
                    <div className="info-value">Hackers InfoTech</div>
                  </div>
                </div>
              </div>
              <div className="issued-by">This certificate was issued by <strong>Hackers InfoTech</strong>, Coimbatore, India — an ISO 9001:2015 certified cybersecurity company.</div>
              <Link href={`/html/results.html?id=${encodeURIComponent(displayId)}`} className="btn-home"><i className="ti ti-certificate" /> View Full Certificate</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SecureVerifyPage() {
  const certId = new URLSearchParams(window.location.search).get('id');
  const [name, setName] = useState('');
  const [state, setState] = useState(certId ? 'ready' : 'invalid');
  const [message, setMessage] = useState('');

  async function startVerification() {
    if (!name.trim()) {
      alert('Please enter the name');
      return;
    }
    setState('loading');
    try {
      const response = await fetch(`http://127.0.0.1:8000/verify/${certId}/?name=${encodeURIComponent(name.trim())}`);
      const data = await response.json();
      setState(response.ok ? 'success' : 'error');
      setMessage(data.message || 'The provided name does not match the secure hash for this ID.');
    } catch {
      setState('connection');
      setMessage('Could not connect to the verification server.');
    }
  }

  return (
    <Page>
      <div className="card verify-card-simple">
        {state === 'invalid' && <StatusIcon icon="alert-triangle" className="error" title="Invalid Link" text="No Certificate ID found in the URL." />}
        {state === 'ready' && (
          <>
            <StatusIcon icon="shield-lock" title="Secure Verification" text={`Certificate ID: ${certId}`} />
            <div style={{ marginTop: 20 }}>
              <p>Please enter the <strong>Recipient Name</strong> as shown on the certificate:</p>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full Name" style={{ width: '100%', padding: 12, margin: '15px 0', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <button className="btn primary" type="button" onClick={startVerification}>Verify Now</button>
            </div>
          </>
        )}
        {state === 'loading' && <StatusIcon icon="loader animate-spin" title="Verifying Authenticity..." />}
        {state === 'success' && <StatusIcon icon="circle-check" className="success" title="Certificate Verified" text={message} />}
        {state === 'error' && <StatusIcon icon="circle-x" className="error" title="Verification Failed" text={message} />}
        {state === 'connection' && <StatusIcon icon="wifi-off" className="error" title="Connection Error" text={message} />}
      </div>
    </Page>
  );
}

function StatusIcon({ icon, title, text, className = '' }) {
  return (
    <div>
      <i className={`ti ti-${icon} ${className} status-icon`} />
      <h2 className={className}>{title}</h2>
      {text && <p>{text}</p>}
      {className && <Link href="/" className="btn" style={{ marginTop: 20 }}>Back to Home</Link>}
    </div>
  );
}

function CertGeneratePage() {
  const [name, setName] = useState('');
  const [certId, setCertId] = useState('');
  const [errors, setErrors] = useState({});
  const [output, setOutput] = useState(null);
  const [storeTick, setStoreTick] = useState(0);
  const [outputQrDataUrl, setOutputQrDataUrl] = useState('');

  const store = readJson(CERT_STORE_KEY, {});
  const entries = Object.entries(store).reverse();

  useEffect(() => {
    let active = true;
    if (!output) {
      setOutputQrDataUrl('');
      return undefined;
    }
    const payload = buildQRPayload({
      certId: output.certId,
      name: output.name,
      grade: output.grade || 'N/A',
      score: 'N/A',
      pct: 'N/A',
      date: output.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      issuer: BRAND.name,
    });
    QRCode.toDataURL(payload, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then((dataUrl) => {
      if (active) setOutputQrDataUrl(dataUrl);
    });
    return () => {
      active = false;
    };
  }, [output]);

  function generateUUID() {
    const id = `CERT-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    setCertId(id);
    setErrors({ ...errors, certId: false });
  }

  async function generateCertificate() {
    const nextErrors = { name: !name.trim(), certId: !certId.trim() };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.certId) return;
    const hash = await sha256(`${name.trim()}|${certId.trim()}`);
    const verifyUrl = buildVerifyUrl(certId.trim(), name.trim());
    const nextStore = readJson(CERT_STORE_KEY, {});
    nextStore[certId.trim()] = { hash, createdAt: new Date().toISOString(), name: name.trim() };
    localStorage.setItem(CERT_STORE_KEY, JSON.stringify(nextStore));
    setOutput({
      name: name.trim(), certId: certId.trim(), hash, verifyUrl,
      grade: 'N/A',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    });
    setStoreTick((tick) => tick + 1);
  }

  function downloadQR() {
    if (!outputQrDataUrl) return;
    const link = document.createElement('a');
    link.href = outputQrDataUrl;
    link.download = `certificate_qr_${output.certId}.png`;
    link.click();
  }

  function deleteCert(id) {
    if (!confirm(`Revoke certificate "${id}"? This cannot be undone.`)) return;
    const nextStore = readJson(CERT_STORE_KEY, {});
    delete nextStore[id];
    localStorage.setItem(CERT_STORE_KEY, JSON.stringify(nextStore));
    setStoreTick((tick) => tick + 1);
  }

  return (
    <>
      <Nav />
      <div className="page-body gen-page" data-tick={storeTick}>
        <div className="gen-card">
          <div className="card-header"><div className="card-icon"><i className="ti ti-certificate" /></div><div><div className="card-title">Certificate Generator</div><div className="card-sub">Create tamper-proof certificates with QR verification</div></div></div>
          <GenField label="Recipient Full Name" value={name} setValue={setName} error={errors.name} errorText="Please enter the recipient's name." placeholder="e.g. Madhan Kumar" />
          <div className="field">
            <label>Certificate ID</label>
            <div className="field-row">
              <input value={certId} onChange={(event) => setCertId(event.target.value)} className={errors.certId ? 'error' : ''} placeholder="e.g. CERT-001 or auto-generate ->" />
              <button className="btn-gen-uuid" type="button" onClick={generateUUID}><i className="ti ti-refresh" /> UUID</button>
            </div>
            <div className="error-msg" style={{ display: errors.certId ? 'block' : 'none' }}>Please enter or generate a Certificate ID.</div>
          </div>
          <button className="btn-generate" type="button" onClick={generateCertificate}><i className="ti ti-qrcode" /> Generate Certificate & QR Code</button>
          <hr className="divider" />
          {output && (
            <div className="output-panel" style={{ display: 'block' }}>
              <div className="output-header"><i className="ti ti-check-circle" style={{ color: '#16A34A', fontSize: 20 }} /><span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Certificate Created</span><span className="badge">Secure ✓</span></div>
              <div className="qr-wrapper">{outputQrDataUrl && <img src={outputQrDataUrl} alt="Certificate verification QR code" width="200" height="200" />}</div>
              <table className="cert-info-table"><tbody>
                <tr><td>Name</td><td>{output.name}</td></tr>
                <tr><td>Certificate ID</td><td>{output.certId}</td></tr>
                <tr><td>Verify URL</td><td style={{ wordBreak: 'break-all', fontSize: 10, color: 'var(--primary-color)' }}>{output.verifyUrl}</td></tr>
                <tr className="hash-row"><td>SHA-256 Hash</td><td>{output.hash}</td></tr>
              </tbody></table>
              <div className="btn-row"><button className="btn-outline" type="button" onClick={downloadQR}><i className="ti ti-download" /> Download QR</button><button className="btn-outline" type="button" onClick={() => navigator.clipboard.writeText(output.verifyUrl)}><i className="ti ti-copy" /> Copy URL</button><button className="btn-danger-outline" type="button" onClick={() => { setName(''); setCertId(''); setOutput(null); }}><i className="ti ti-refresh" /> New</button></div>
            </div>
          )}
        </div>
        <div className="registry-card">
          <div className="registry-header"><div className="registry-title"><i className="ti ti-database" /> Certificate Registry</div><div className="registry-count">{entries.length} record{entries.length !== 1 ? 's' : ''}</div></div>
          <div className="registry-list">
            {entries.length === 0 ? <div className="registry-empty"><i className="ti ti-certificate-off" />No certificates yet. Generate one to get started.</div> : entries.map(([id, value]) => (
              <div className="cert-item" key={id}><div className="cert-item-info"><div className="cert-item-name">{value.name || '-'}</div><div className="cert-item-id">{id}</div><div className="cert-item-date"><i className="ti ti-clock" /> {value.createdAt ? new Date(value.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div></div><div className="cert-item-actions"><button className="icon-btn" title="Copy verify link" type="button" onClick={() => navigator.clipboard.writeText(buildVerifyUrl(id, value.name || ''))}><i className="ti ti-link" /></button><button className="icon-btn del" title="Revoke certificate" type="button" onClick={() => deleteCert(id)}><i className="ti ti-trash" /></button></div></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function GenField({ label, value, setValue, error, errorText, placeholder }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(event) => setValue(event.target.value)} className={error ? 'error' : ''} placeholder={placeholder} />
      <div className="error-msg" style={{ display: error ? 'block' : 'none' }}>{errorText}</div>
    </div>
  );
}

function ScannerPage() {
  const [status, setStatus] = useState({ state: '', label: 'Idle' });
  const [uploaded, setUploaded] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setLastResult(null);
    setUploaded({ file, data: '', ready: false });
    
    if (file.type === 'application/pdf') {
      setStatus({ state: 'active', label: 'Reading PDF' });
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const tempCanvas = document.createElement('canvas');
        tempCanvas.height = viewport.height;
        tempCanvas.width = viewport.width;
        await page.render({ canvasContext: tempCanvas.getContext('2d'), viewport }).promise;
        setUploaded({ file, data: tempCanvas.toDataURL('image/jpeg', 0.92), ready: true });
        setStatus({ state: 'done', label: 'PDF Ready' });
      } catch {
        alert('Could not read PDF. Please try an image.');
        setStatus({ state: 'error', label: 'PDF Error' });
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploaded({ file, data: event.target.result, ready: true });
        setStatus({ state: 'done', label: 'Image Ready' });
      };
      reader.readAsDataURL(file);
    }
  }

  async function analyzeUploaded() {
    if (!uploaded?.data) return;
    setProcessing(true);
    setStatus({ state: 'active', label: 'Analyzing QR Code' });
    
    const qrText = await decodeQrFromImage(uploaded.data);
    const qrPayload = parseVerifyPayload(qrText);
    
    if (qrPayload?.id) {
      // Check Firebase
      try {
        const certData = await getCertificate(qrPayload.id);
        if (certData) {
          setLastResult({
             isValid: true,
             certificateType: certData.assessmentType || 'Cyber Hygiene Assessment',
             recipientName: certData.name,
             issuer: BRAND.name,
             issueDate: certData.issuedAt?.toDate ? certData.issuedAt.toDate().toLocaleDateString() : 'N/A',
             credentialId: certData.certId,
             grade: certData.gradeLabel || certData.grade,
             verificationStatus: 'Verified',
             notes: 'Certificate successfully verified against the database.'
          });
          setStatus({ state: 'done', label: 'Verified in Database' });
        } else {
          setLastResult({
             isValid: false,
             certificateType: '-',
             recipientName: '-',
             issuer: '-',
             issueDate: '-',
             credentialId: qrPayload.id,
             grade: '-',
             verificationStatus: 'Unverified',
             notes: 'QR code read successfully, but no matching certificate was found in the database.'
          });
          setStatus({ state: 'error', label: 'Record Not Found' });
        }
      } catch (e) {
        setStatus({ state: 'error', label: 'Database Error' });
        alert('Error connecting to database to verify certificate.');
      }
    } else {
      setLastResult({
         isValid: false,
         certificateType: '-',
         recipientName: '-',
         issuer: '-',
         issueDate: '-',
         credentialId: '-',
         grade: '-',
         verificationStatus: 'Error',
         notes: 'No valid QR code was detected in the uploaded image. Please ensure the QR code is clearly visible.'
      });
      setStatus({ state: 'error', label: 'No QR Found' });
    }
    setProcessing(false);
  }

  function decodeQrFromImage(imageData) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(pixels.data, pixels.width, pixels.height);
        resolve(decoded?.data || '');
      };
      image.onerror = () => resolve('');
      image.src = imageData;
    });
  }

  function parseVerifyPayload(text) {
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      if (parsed.t === 'hit-cert' && parsed.d?.id) {
        return { id: parsed.d.id, name: parsed.d.n, payload: parsed.d };
      }
    } catch {
      // Not JSON
    }
    
    // Match legacy URL format (e.g. ?id=HIT-1234)
    let match = text.match(/id=([^&\s]+)/i);
    if (match) return { id: decodeURIComponent(match[1]) };
    
    // Match new plain text format (e.g. ID: HIT-1234)
    match = text.match(/ID:\s*([A-Za-z0-9\-]+)/i);
    if (match) return { id: match[1].trim() };
    
    return null;
  }

  const verified = lastResult?.isValid && lastResult?.verificationStatus === 'Verified';
  const rows = lastResult ? [
    ['Certificate Type', lastResult.certificateType],
    ['Recipient Name', lastResult.recipientName],
    ['Issued By', lastResult.issuer],
    ['Issue Date', lastResult.issueDate],
    ['Credential ID', lastResult.credentialId],
    ['Grade / Score', lastResult.grade],
  ].filter(([, value]) => value && !['N/A', 'Not found', '-'].includes(value)) : [];

  return (
    <>
      <Nav />
      <div className="container fade-in scanner-page">
        <div className="scanner-container">
          <div className="scanner-header"><div className="logo-group"><div className="scanner-logo-icon"><i className="ti ti-certificate" /></div><div><div className="logo-title">Certificate Verification</div></div></div><span className={`status-badge ${status.state}`}><span className={`dot${status.state === 'active' ? ' pulse' : ''}`} /> {status.label}</span></div>
          
          <div>
            {!uploaded?.ready && (
              <>
                <div className="upload-zone" onClick={() => fileInputRef.current.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]); }}><i className="ti ti-file-upload" /><h3>Drop certificate image here</h3><p>or click to browse - JPG, PNG supported</p></div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" className="btn" onClick={() => history.back()}><i className="ti ti-arrow-left" /> Back</button>
                </div>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => handleFile(event.target.files[0])} style={{ display: 'none' }} />
            {uploaded?.ready && <div className="card" style={{ marginTop: 0, textAlign: 'center' }}><div style={{ marginBottom: 20 }}><span className="status-badge done"><i className="ti ti-check" /> File Ready for Analysis</span></div><div style={{ background: 'var(--bg-color)', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px dashed var(--border-color)' }}><img src={uploaded.data} alt="Uploaded certificate" style={{ maxHeight: 280, maxWidth: '100%', borderRadius: 8, display: 'block', margin: '0 auto' }} /><div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}><i className="ti ti-file" /> {uploaded.file.name} - {(uploaded.file.size / 1024).toFixed(1)} KB</div></div><div className="controls"><Link href="/" className="btn"><i className="ti ti-arrow-left" /> Back to Home</Link><button className="btn primary" type="button" onClick={analyzeUploaded}><i className="ti ti-scan" /> Verify QR Code</button><button className="btn danger" type="button" onClick={() => { setUploaded(null); setLastResult(null); setStatus({ state: '', label: 'Idle' }); }}><i className="ti ti-trash" /> Clear</button></div></div>}
            {processing && <div className="card processing" style={{ position: 'relative', minHeight: 120, borderRadius: 16, display: 'flex', marginTop: 16, background: 'var(--card-bg)' }}><div className="spinner" style={{ borderTopColor: 'var(--primary-color)' }} /><p style={{ color: 'var(--text-primary)', marginTop: 12 }}>Analyzing QR code...</p></div>}
          </div>

          {lastResult && <div className="card fade-in" style={{ marginTop: 24 }}><div className="result-header"><div className="result-title"><i className="ti ti-file-check" style={{ fontSize: 20, color: 'var(--primary-color)' }} /> Verification Result</div><span className={`status-badge ${verified ? 'done' : 'error'}`}>{verified ? <><i className="ti ti-check" /> Verified</> : <><i className="ti ti-alert-circle" /> {lastResult.verificationStatus || 'Unverified'}</>}</span></div>{rows.map(([key, value]) => <div className="field-row" key={key}><span className="field-label">{key}</span><span className="field-value">{value}</span></div>)}<div className="controls" style={{ marginTop: 20, justifyContent: 'flex-start' }}><button className="btn" type="button" onClick={() => { setUploaded(null); setLastResult(null); }}><i className="ti ti-refresh" /> Scan Another</button></div></div>}
        </div>
      </div>
    </>
  );
}

function MyCertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState([]);
  const [certToDelete, setCertToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        navigateTo('/html/login.html');
        return;
      }
      const data = await getUserCertificates(firebaseUser.uid);
      data.sort((a, b) => (b.issuedAt?.seconds || 0) - (a.issuedAt?.seconds || 0));
      setCerts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <Nav />
      <Page style={{ paddingTop: 36, paddingBottom: 48 }}>
        <button 
          type="button" 
          onClick={() => history.back()} 
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: '6px 14px', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease' }}>
          <i className="ti ti-arrow-left" /> Back
        </button>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>My Certificates</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Assessments you have completed</p>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><div className="loader" style={{margin: '0 auto'}} /></div>
        ) : certs.length === 0 ? (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No certificates yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>You haven't completed any assessments.</p>
            <button onClick={() => navigateTo('/html/type.html')} className="btn-primary">Start Assessment</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {certs.map(cert => {
              const d = cert.issuedAt?.toDate ? cert.issuedAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              return (
                <div key={cert.certId} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{cert.assessmentType === 'it' ? 'IT & Tech' : 'General'} Assessment</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Grade: <b style={{color: 'var(--text-primary)'}}>{cert.grade}</b> ({cert.percentage}%) • {d}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigateTo(`/html/results.html?id=${cert.certId}`)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>View Details</button>
                    <button onClick={() => setCertToDelete(cert.certId)} style={{ padding: '8px 16px', fontSize: 13, background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Page>

      {certToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg)', width: '90%', maxWidth: 400, borderRadius: 16, padding: 32, border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#EF4444' }}>
              <i className="ti ti-trash" style={{ fontSize: 28 }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Delete Certificate?</h3>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to permanently delete this certificate? This action cannot be undone and it will be completely removed from our records.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="button" 
                onClick={() => setCertToDelete(null)}
                className="btn-secondary" 
                style={{ flex: 1, padding: '12px 0', fontSize: 15 }}
                disabled={isDeleting}
              >Cancel</button>
              <button 
                type="button" 
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteCertificate(certToDelete);
                    // Permanently delete from local storage cache too
                    const store = readJson(CERT_STORE_KEY, {});
                    if (store[certToDelete]) {
                      delete store[certToDelete];
                      localStorage.setItem(CERT_STORE_KEY, JSON.stringify(store));
                    }
                    setCerts(prev => prev.filter(c => c.certId !== certToDelete));
                  } catch(e) {
                    alert('Error deleting certificate');
                  }
                  setIsDeleting(false);
                  setCertToDelete(null);
                }} 
                className="btn-primary" 
                style={{ flex: 1, padding: '12px 0', background: '#EF4444', borderColor: '#EF4444', fontSize: 15 }}
                disabled={isDeleting}
              >{isDeleting ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '', company: '' });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const p = await getUserProfile(user.uid);
        if (p) setProfile({ name: p.name || '', phone: p.phone || '', company: p.company || '' });
      } else {
        navigateTo('/html/login.html');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function save() {
    if (!profile.name.trim()) return alert('Name is required');
    setSaving(true);
    try {
      await saveUserProfile(auth.currentUser.uid, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        company: profile.company.trim()
      });
      // Update fallback store if it exists
      const lead = readJson('lead', {});
      lead.name = profile.name.trim();
      lead.phone = profile.phone.trim();
      lead.company = profile.company.trim();
      localStorage.setItem('lead', JSON.stringify(lead));
      
      alert('Profile updated successfully!');
      window.history.back();
    } catch (err) {
      console.error(err);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Page><div style={{textAlign:'center', marginTop:100}}>Loading...</div></Page>;

  return (
    <Page style={{ padding: '40px 20px', maxWidth: 450, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--grade-a-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <i className="ti ti-user-edit" style={{ fontSize: 28, color: 'var(--primary-color)' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Edit Profile</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Update your certificate details below.</p>
      </div>
      
      <div className="card" style={{ padding: 24 }}>
        <LeadInput label="Full Name (For Certificate)" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="e.g. DHARSIKA SK" />
        <LeadInput label="Phone Number (Optional)" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="e.g. +91 98765 43210" />
        <LeadInput label="Company / Institution (Optional)" value={profile.company} onChange={(v) => setProfile({ ...profile, company: v })} placeholder="e.g. KEC" />
        
        <button onClick={save} className="btn-primary" style={{ width: '100%', marginTop: 24, padding: 12, fontSize: 15 }} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={() => window.history.back()} type="button" className="btn-secondary" style={{ width: '100%', marginTop: 12, padding: 12, fontSize: 15 }}>
          Cancel
        </button>
      </div>
    </Page>
  );
}

export default function App() {
  const route = useRoute();
  if (route.endsWith('/html/profile.html')) return <ProfilePage />;
  if (route.endsWith('/html/login.html')) return <LoginPage />;
  if (route.endsWith('/html/type.html')) return <TypePage />;
  if (route.endsWith('/html/assessment_general.html')) return <AssessmentPage type="general" />;
  if (route.endsWith('/html/assessment_it.html')) return <AssessmentPage type="it" />;
  if (route.endsWith('/html/lead.html')) return <LeadPage />;
  if (route.endsWith('/html/results.html')) return <ResultsPage />;
  if (route.endsWith('/html/my-certificates.html')) return <MyCertificatesPage />;
  if (route.endsWith('/html/verify_id.html')) return <VerifyIdPage />;
  if (route.endsWith('/html/cert_verify.html')) return <CertDetailsPage />;
  if (route.endsWith('/html/verify.html')) return <SecureVerifyPage />;
  if (route.endsWith('/html/cert_generate.html')) return <CertGeneratePage />;
  if (route.endsWith('/html/Certificate_Scanner.html')) return <ScannerPage />;
  return <HomePage />;
}
