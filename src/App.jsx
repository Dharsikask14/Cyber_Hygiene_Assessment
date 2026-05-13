import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { ALL, BRAND, GENERAL_SECTIONS, IT_SECTIONS, getGrade, maxScore } from './data.js';
import { CERT_STORE_KEY, buildVerifyUrl, escHtml, genCertId, linkTo, navigateTo, readJson, sha256 } from './utils.js';
import { Nav, Page, ShieldLogo } from './components.jsx';
import logoUrl from '../images/logo.jpeg';

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

function makeLocalVerificationResult(certId, fallbackName = '') {
  const cert = findCertificate(certId);
  const id = cert?.id || certId || '';
  const name = cert?.name || fallbackName || 'Not available';
  return {
    isValid: Boolean(id && name),
    certificateType: 'Cyber Hygiene Assessment',
    recipientName: name,
    issuer: BRAND.name,
    courseOrSubject: 'Cyber Hygiene Assessment',
    issueDate: cert?.createdAt ? new Date(cert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not found',
    expiryDate: 'N/A',
    credentialId: id,
    grade: 'N/A',
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
  return (
    <Page style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'absolute', top: -100, left: -150, width: 450, height: 450, background: 'var(--primary-color)', filter: 'blur(140px)', opacity: 0.12, borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 250, right: -200, width: 400, height: 400, background: '#8B5CF6', filter: 'blur(140px)', opacity: 0.1, borderRadius: '50%', zIndex: -1, pointerEvents: 'none' }} />

      <div className="hero-grid" style={{ padding: '56px 0 40px' }}>
        <div style={{ textAlign: 'left' }}>
          <div className="floating" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-color)', display: 'inline-block', boxShadow: '0 0 8px var(--primary-color)' }} />
            Free Cyber Hygiene Assessment
          </div>

          <h1 style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: -1 }}>
            How safe are you<br /><span className="text-gradient">online?</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 0 36px', lineHeight: 1.7 }}>
            Our assessment works on all devices, so you only have to set it up once, and get beautiful results forever.
          </p>

          <div className="hero-buttons">
            <Link href="/html/type.html" className="btn-primary floating">Start Assessment →</Link>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32, fontWeight: 500 }}>
            5 minutes · 100% free · Certificate + PDF report included
          </div>

          <div className="grid-2" style={{ marginTop: 20, alignItems: 'stretch' }}>
            <div className="card floating" style={{ textAlign: 'left', padding: '20px 22px', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: 'var(--grade-a-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShieldLogo /></div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Verify a Certificate</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Did someone share a Hackers InfoTech certificate with you? Verify its authenticity instantly using the Certificate ID or by scanning it with your camera.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                <Link href="/html/verify_id.html" className="btn-primary" style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, textDecoration: 'none', textAlign: 'center', display: 'block' }}>🔍 Verify through ID</Link>
                <Link href="/html/Certificate_Scanner.html" className="btn-primary" style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 8, textDecoration: 'none', textAlign: 'center', display: 'block', background: 'var(--grade-a)', color: '#fff', border: 'none' }}>📷 Verify through Scanner (Camera)</Link>
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

function TypePage() {
  function choose(type) {
    localStorage.setItem('assessmentType', type);
    localStorage.removeItem('answers');
    localStorage.removeItem('currentSection');
  }

  return (
    <Page style={{ paddingTop: 48 }}>
      <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Who is this for?</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 36, fontSize: 15 }}>Choose the profile that best matches you</p>
      <div className="grid-2" style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        <ChoiceCard type="general" icon="👤" title="General Public" subtitle="Phone · Laptop · Internet User" color="#7C3AED" items={['No technical knowledge needed', 'Mobile, passwords, banking', 'Scam & fraud awareness', '28 questions · ~4 min']} bg="#F5F3FF" border="#DDD6FE" onChoose={choose} />
        <ChoiceCard type="it" icon="💻" title="IT & Tech Users" subtitle="Developers · IT Staff · Freelancers" color="#0EA5E9" items={['Advanced security practices', 'DevOps, cloud, network', 'Threat detection & tools', '31 questions · ~6 min']} bg="#F0F9FF" border="#BAE6FD" delay="0.2s" onChoose={choose} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13 }}>← Back</Link>
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
    <Page style={{ paddingTop: 32 }}>
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
        <button type="button" onClick={() => sec > 0 && goToSection(sec - 1)} disabled={sec === 0} className="btn-primary" style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>← Previous</button>
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
  const [lead, setLead] = useState({ name: '', email: '', phone: '', company: '' });
  const [loading, setLoading] = useState(false);
  const valid = lead.name.trim() && lead.email.trim() && lead.phone.trim();

  async function submit() {
    if (!valid) return;
    setLoading(true);
    const certId = genCertId();
    const hash = await sha256(`${lead.name.trim()}|${certId}`);
    const store = readJson(CERT_STORE_KEY, {});
    store[certId] = { hash, name: lead.name.trim(), createdAt: new Date().toISOString() };
    localStorage.setItem(CERT_STORE_KEY, JSON.stringify(store));
    localStorage.setItem('lead', JSON.stringify({ name: lead.name.trim(), email: lead.email.trim(), phone: lead.phone.trim(), company: lead.company.trim(), certId }));
    navigateTo('/html/results.html');
  }

  return (
    <Page style={{ paddingTop: 48, maxWidth: 480 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Your results are ready!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>Enter your details to get your grade, PDF certificate, full report, and personalised action plan - sent to your email instantly.</p>
      </div>
      <div className="card floating">
        <LeadInput label="Full Name *" value={lead.name} placeholder="Your full name" onChange={(name) => setLead({ ...lead, name })} />
        <LeadInput label="Email Address *" type="email" value={lead.email} placeholder="you@email.com" onChange={(email) => setLead({ ...lead, email })} />
        <LeadInput label="Phone Number *" value={lead.phone} placeholder="+91 XXXXX XXXXX" onChange={(phone) => setLead({ ...lead, phone })} />
        <LeadInput label="Company / College (optional)" value={lead.company} placeholder="Where you work or study" onChange={(company) => setLead({ ...lead, company })} />
        <button type="button" onClick={submit} id="submitBtn" className="btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={!valid || loading}>{loading ? '⏳ Preparing your results...' : 'Show My Cyber Safety Score →'}</button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>Your information is kept confidential and used only for sending your results and cybersecurity updates from Hackers InfoTech.</p>
      </div>
    </Page>
  );
}

function LeadInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid var(--border-color)', borderRadius: 9, background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }} />
    </div>
  );
}

function ResultsPage() {
  const lead = readJson('lead', {});
  const type = localStorage.getItem('assessmentType');
  const answers = readJson('answers', {});
  const pdfCertRef = useRef(null);
  const pdfReportRef = useRef(null);
  const [emailState, setEmailState] = useState('');
  const [busy, setBusy] = useState('');
  const [certQrDataUrl, setCertQrDataUrl] = useState('');

  useEffect(() => {
    if (!type || !lead.email) {
      navigateTo('/');
    }
  }, [type, lead.email]);

  const sections = ALL[type] || GENERAL_SECTIONS;
  const allQuestions = sections.flatMap((section) => section.questions);
  const mx = maxScore(type);
  const score = allQuestions.reduce((sum, question) => sum + (answers[question.id] === 'yes' ? question.w : 0), 0);
  const pct = mx > 0 ? Math.round((score / mx) * 100) : 0;
  const grade = getGrade(pct);
  const failed = allQuestions.filter((question) => answers[question.id] === 'no');
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const verifyUrl = lead.certId ? buildVerifyUrl(lead.certId, lead.name) : '';

  useEffect(() => {
    let active = true;
    if (!verifyUrl) {
      setCertQrDataUrl('');
      return undefined;
    }
    QRCode.toDataURL(verifyUrl, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then((dataUrl) => {
      if (active) setCertQrDataUrl(dataUrl);
    });
    return () => {
      active = false;
    };
  }, [verifyUrl]);

  async function makeQRDataUrl(text, size) {
    return QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });
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
    const qrDataUrl = verifyUrl ? await makeQRDataUrl(verifyUrl, 200) : '';
    return `<div style="border:2px solid #0EA5E9; border-radius:20px; padding:50px 40px; text-align:center; color:#fff; max-width:700px; margin:0 auto; font-family:'DM Sans', sans-serif;">
      <div style="font-size:12px; letter-spacing:.12em; color:#38BDF8; text-transform:uppercase; margin-bottom:12px;">Hackers InfoTech - Official Certificate</div>
      <div style="font-size:30px; font-weight:700; color:#F0F9FF; margin-bottom:4px;">Cyber Hygiene Assessment</div>
      <div style="color:#64748B; margin-bottom:32px; font-size:13px;">Certificate of Completion</div>
      <div style="font-size:14px; color:#94A3B8; margin-bottom:6px;">This certifies that</div>
      <div style="font-size:28px; font-weight:700; color:#38BDF8; margin-bottom:4px;">${escHtml(lead.name)}</div>
      ${lead.company ? `<div style="font-size:13px; color:#64748B; margin-bottom:24px;">${escHtml(lead.company)}</div>` : ''}
      <div style="font-size:13px; color:#94A3B8; margin-bottom:16px;">has completed the Cyber Hygiene Assessment and achieved the grade</div>
      <div style="font-size:96px; font-weight:700; color:${grade.color}; line-height:1; font-family:'DM Mono', monospace;">${grade.grade}</div>
      <div style="font-size:20px; font-weight:600; color:#F0F9FF; margin:8px 0 4px;">${grade.label}</div>
      <div style="font-size:22px; color:${grade.color}; font-weight:700; margin-bottom:4px;">${pct}% (${score}/${mx} pts)</div>
      <div style="color:#475569; font-size:12px; margin-bottom:28px;">Assessed on ${date}</div>
      ${qrDataUrl ? `<div style="background:#0A1628; border:1px solid #1E3050; border-radius:14px; padding:20px; margin-bottom:28px; display:inline-flex; flex-direction:column; align-items:center; gap:10px;"><img src="${qrDataUrl}" width="130" height="130" style="border-radius:8px; display:block;" /><div style="color:#94A3B8; font-size:10px; letter-spacing:.06em; text-transform:uppercase;">Scan to verify</div><div style="color:#38BDF8; font-family:monospace; font-size:11px; font-weight:700;">${escHtml(lead.certId)}</div></div>` : ''}
      <div style="border-top:1px solid #1E3050; padding-top:18px; display:flex; justify-content:space-between; font-size:11px; color:#475569;"><span>${BRAND.url}</span><span>${BRAND.email}</span><span>${BRAND.city}</span></div>
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
    const el = which === 'cert' ? pdfCertRef.current : pdfReportRef.current;
    el.innerHTML = which === 'cert' ? await buildCertHtml() : buildReportHtml();
    el.style.display = 'block';
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: which === 'cert' ? '#0C1B2E' : '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
      pdf.save(which === 'cert' ? `${lead.name}_Certificate.pdf` : `${lead.name}_CyberReport.pdf`);
    } catch (error) {
      console.error(error);
      alert('Error generating PDF.');
    } finally {
      el.style.display = 'none';
      setBusy('');
    }
  }

  async function sendEmail() {
    if (!window.emailjs) {
      alert('Email library is still loading. Please try again.');
      return;
    }
    setEmailState('sending');
    try {
      window.emailjs.init(BRAND.emailjs.publicKey);
      await window.emailjs.send(BRAND.emailjs.serviceId, BRAND.emailjs.templateId, {
        to_email: lead.email,
        to_name: lead.name,
        subject: `Your Cyber Hygiene Report - Grade ${grade.grade} (${pct}%) | Hackers InfoTech`,
        html_body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:30px;"><h2>Hackers InfoTech</h2><p>Dear <b>${escHtml(lead.name)}</b>,</p><p>Your grade is <b>${grade.grade}</b> (${pct}%).</p>${failed.length > 0 ? failed.map((q, index) => `<p><b>${index + 1}. ${escHtml(q.text)}</b><br/>Fix: ${escHtml(q.tip)}</p>`).join('') : '<p>Excellent! No action items needed.</p>'}</div>`,
      });
      setEmailState('sent');
    } catch (error) {
      console.error(error);
      setEmailState('failed');
    }
  }

  return (
    <>
      <Page style={{ paddingTop: 36 }}>
        <div className="card" style={{ background: grade.bg, borderColor: `${grade.color}33`, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: grade.color, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Cyber Safety Grade · {date}</div>
          <div style={{ fontSize: 88, fontWeight: 700, color: grade.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{grade.grade}</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{grade.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: grade.color, marginTop: 4 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>{score} / {mx} points</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>{grade.desc}</div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>📄 Your Certificate & Report</h3>
          <div style={{ background: 'var(--bg-color)', border: '1px dashed var(--border-color)', borderRadius: 12, padding: 16, marginBottom: 14, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: 10, borderRadius: 10, flexShrink: 0, width: 120, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {certQrDataUrl ? <img src={certQrDataUrl} alt="Certificate verification QR code" width="100" height="100" style={{ display: 'block' }} /> : <span style={{ color: '#64748B', fontSize: 11 }}>QR loading...</span>}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Certificate ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--primary-color)', wordBreak: 'break-all', marginBottom: 8 }}>{lead.certId || 'Not available'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Scan the QR code to verify this certificate's authenticity instantly.</div>
              <button type="button" onClick={() => navigator.clipboard.writeText(verifyUrl)} style={{ marginTop: 8, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>🔗 Copy Verify Link</button>
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <button type="button" onClick={() => downloadPdf('cert')} disabled={busy === 'cert'} style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: '#7C3AED', cursor: 'pointer' }}>{busy === 'cert' ? '⏳ Generating...' : '🏅 Download Certificate'}</button>
            <button type="button" onClick={() => downloadPdf('report')} disabled={busy === 'report'} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>{busy === 'report' ? '⏳ Generating...' : '📋 Download Full Report'}</button>
          </div>
          <button type="button" onClick={sendEmail} style={{ width: '100%', background: emailState === 'sent' ? '#ECFDF5' : 'var(--primary-color)', border: emailState === 'sent' ? '1px solid #A7F3D0' : 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, color: emailState === 'sent' ? '#059669' : '#fff', cursor: 'pointer' }}>
            {emailState === 'sending' ? '⏳ Sending...' : emailState === 'sent' ? `✅ Report sent to ${lead.email}` : emailState === 'failed' ? '❌ Send failed. Check config.' : `📧 Email Report to ${lead.email}`}
          </button>
        </div>

        <CategoryBreakdown sections={sections} answers={answers} />
        {failed.length > 0 && <ActionPlan failed={failed} />}
        <ConsultationCta />
      </Page>
      <div ref={pdfCertRef} style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: 794, zIndex: -999, background: '#0C1B2E', padding: '60px 40px', boxSizing: 'border-box' }} />
      <div ref={pdfReportRef} style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: 794, zIndex: -999, background: '#fff', padding: '40px 30px', boxSizing: 'border-box', color: '#000' }} />
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

function ConsultationCta() {
  return (
    <div style={{ background: '#0C1B2E', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#F0F9FF', marginBottom: 8 }}>Want Hackers InfoTech to fix this for you?</div>
      <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 22, lineHeight: 1.7 }}>Book a free 30-minute consultation. We will walk through your results and create a personalised cyber security plan.</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href={BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14, padding: '12px 24px' }}>📅 Book Free 30-Min Call</a>
        <button type="button" onClick={() => navigateTo('/')} style={{ background: 'transparent', border: '1px solid #1E3050', color: '#94A3B8', borderRadius: 9, padding: '12px 24px', fontSize: 14, cursor: 'pointer' }}>Retake Assessment</button>
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
        cert: { name: localCert.name || 'Not available', id: localCert.id, createdAt: localCert.createdAt },
      });
      return;
    }

    if (!(await checkDB())) {
      setStatus({ type: 'error', title: 'Certificate Not Found', text: 'This certificate ID was not found in the local registry. Start the backend server to check server records.' });
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/verify/${encodeURIComponent(trimmedId)}/?name=${encodeURIComponent(trimmedName)}`);
      const data = await response.json();
      setStatus(response.ok
        ? { type: 'success', title: 'Verification Successful', text: data.message, cert: { name: data.name || trimmedName || 'Verified user', id: trimmedId } }
        : { type: 'error', title: 'Verification Failed', text: data.message || 'Details do not match our secure records.' });
    } catch {
      setStatus({ type: 'error', title: 'Connection Error', text: 'Could not reach verification server. Ensure the backend is running.' });
    }
    return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/verify/${encodeURIComponent(trimmedId)}/?name=${encodeURIComponent(trimmedName)}`);
      const data = await response.json();
      setStatus(response.ok ? { type: 'success', title: '✅ Verification Successful', text: data.message } : { type: 'error', title: '❌ Verification Failed', text: data.message || 'Details do not match our secure records.' });
    } catch {
      setStatus({ type: 'error', title: '⚠️ Connection Error', text: 'Could not reach verification server. Ensure the backend is running.' });
    }
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
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>User Name</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{status.cert.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Certificate ID</div>
                  <div style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: 'var(--primary-color)', wordBreak: 'break-all' }}>{status.cert.id}</div>
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
  const certId = params.get('id');
  const name = params.get('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Nav />
      <div className="page-body">
        <div className="cert-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="loader" />
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading certificate...</div>
            </div>
          ) : !certId || !name ? (
            <div style={{ textAlign: 'center' }}>
              <div className="error-icon"><i className="ti ti-link-off" /></div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Invalid Certificate Link</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>This QR code is missing required certificate information. Please scan the QR code on the original certificate.</div>
              <Link href="/" className="btn-home"><i className="ti ti-home" /> Back to Home</Link>
            </div>
          ) : (
            <>
              <div className="cert-badge"><i className="ti ti-certificate" /></div>
              <div className="cert-issued">Hackers InfoTech - Official Certificate</div>
              <div className="cert-title">Cyber Hygiene Assessment</div>
              <div className="info-block">
                <div className="info-row"><div className="info-icon blue"><i className="ti ti-user" /></div><div className="info-text"><div className="info-label">Recipient Name</div><div className="info-value">{name}</div></div></div>
                <div className="info-row"><div className="info-icon green"><i className="ti ti-id" /></div><div className="info-text"><div className="info-label">Certificate ID</div><div className="info-value mono">{certId}</div></div></div>
              </div>
              <div className="issued-by">This certificate was issued by <strong>Hackers InfoTech</strong>, Coimbatore, India - an ISO 9001:2015 certified cybersecurity company.</div>
              <Link href="/" className="btn-home"><i className="ti ti-home" /> Back to Home</Link>
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
    QRCode.toDataURL(output.verifyUrl, {
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
    setOutput({ name: name.trim(), certId: certId.trim(), hash, verifyUrl });
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
  const [tabName, setTabName] = useState('camera');
  const [status, setStatus] = useState({ state: '', label: 'Idle' });
  const [warning, setWarning] = useState(false);
  const [hint, setHint] = useState('Tap "Start Camera" to begin. Allow camera permission when prompted.');
  const [cameraState, setCameraState] = useState('off');
  const [preview, setPreview] = useState('');
  const [uploaded, setUploaded] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [multiCam, setMultiCam] = useState(false);
  const streamRef = useRef(null);
  const facingRef = useRef('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => () => stopCamera(), []);

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

  async function startCamera() {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingRef.current, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setCameraState('live');
      setPreview('');
      setLastResult(null);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMultiCam(devices.filter((device) => device.kind === 'videoinput').length > 1);
      setHint('Position the certificate inside the frame, then tap Capture.');
      setStatus({ state: 'active', label: 'Camera Live' });
    } catch {
      setHint('Camera access denied. Please allow camera permission in your browser settings and try again.');
      setStatus({ state: 'error', label: 'Blocked' });
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('off');
    setHint('Tap "Start Camera" to begin. Allow camera permission when prompted.');
    setStatus({ state: '', label: 'Idle' });
  }

  async function switchCamera() {
    facingRef.current = facingRef.current === 'environment' ? 'user' : 'environment';
    await startCamera();
  }

  function captureFrame() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.92);
    setPreview(imageData);
    setCameraState('captured');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setHint('Image captured. Analyzing...');
    analyzeCertificate(imageData, 'camera');
  }

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
    analyzeCertificate(uploaded.data, 'upload');
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

  async function analyzeCertificate(imageData, source) {
    setProcessing(true);
    setStatus({ state: 'active', label: 'Analyzing' });
    const qrText = await decodeQrFromImage(imageData);
    const qrPayload = parseVerifyPayload(qrText);
    if (qrPayload?.id) {
      setLastResult(makeLocalVerificationResult(qrPayload.id, qrPayload.name));
      setStatus({ state: 'done', label: 'QR Verified' });
      setProcessing(false);
      return;
    }

    const base64 = imageData.split(',')[1];
    const mime = imageData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const prompt = `You are an expert certificate scanner. Carefully analyze this certificate image and extract all visible information.
Respond ONLY with a valid JSON object - no markdown fences, no preamble. Use exactly these keys:
{"isValid": true, "certificateType": "type", "recipientName": "full name", "issuer": "issuer", "courseOrSubject": "course", "issueDate": "date", "expiryDate": "expiry or N/A", "credentialId": "certificate ID or N/A", "grade": "grade or N/A", "verificationStatus": "Verified or Unverified", "notes": "notes"}`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mime, data: base64 } }, { type: 'text', text: prompt }] }] }),
      });
      const data = await response.json();
      const text = (data.content || []).map((block) => block.text || '').join('');
      let result;
      try {
        result = JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch {
        result = { isValid: false, certificateType: 'Parse Error', recipientName: 'N/A', issuer: 'N/A', courseOrSubject: 'N/A', issueDate: 'N/A', expiryDate: 'N/A', credentialId: 'N/A', grade: 'N/A', verificationStatus: 'Unverified', notes: text || 'Could not parse the response.' };
      }
      setLastResult(result);
      setStatus({ state: result.isValid && result.verificationStatus === 'Verified' ? 'done' : '', label: result.isValid ? 'Complete' : 'Done' });
    } catch {
      setLastResult({ isValid: false, certificateType: 'Error', recipientName: '-', issuer: '-', courseOrSubject: '-', issueDate: '-', expiryDate: '-', credentialId: '-', grade: '-', verificationStatus: 'Error', notes: 'Could not reach analysis service. Check your internet connection and try again.' });
      setStatus({ state: 'error', label: 'Error' });
    } finally {
      setProcessing(false);
    }
  }

  function downloadResult() {
    if (!lastResult) return;
    const lines = ['CERTIFICATE SCAN REPORT', '========================', `Generated : ${new Date().toLocaleString()}`, '', ...Object.entries(lastResult).map(([key, value]) => `${key.padEnd(22)}: ${value}`)].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `certificate_scan_${Date.now()}.txt`;
    link.click();
  }

  async function secureDatabaseVerify() {
    if (!lastResult?.credentialId || !lastResult?.recipientName) {
      alert('Could not find enough info for secure verification. Please try a clearer scan.');
      return;
    }
    const localCert = findCertificate(lastResult.credentialId);
    if (localCert) {
      setLastResult(makeLocalVerificationResult(localCert.id, localCert.name));
      alert(`Verified: ${localCert.name || 'User'} (${localCert.id})`);
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/verify/${encodeURIComponent(lastResult.credentialId)}/?name=${encodeURIComponent(lastResult.recipientName)}`);
      const data = await response.json();
      alert(`${data.status === 'verified' ? '✅' : '❌'} ${data.message || 'Verification Failed'}`);
    } catch {
      alert('❌ Error connecting to verification server. Please ensure the Django backend is running.');
    }
  }

  const verified = lastResult?.isValid && lastResult?.verificationStatus === 'Verified';
  const rows = lastResult ? [
    ['Certificate Type', lastResult.certificateType],
    ['Recipient Name', lastResult.recipientName],
    ['Issued By', lastResult.issuer],
    ['Course / Subject', lastResult.courseOrSubject],
    ['Issue Date', lastResult.issueDate],
    ['Expiry Date', lastResult.expiryDate],
    ['Credential ID', lastResult.credentialId],
    ['Grade / Score', lastResult.grade],
    ['Notes', lastResult.notes],
  ].filter(([, value]) => value && !['N/A', 'Not found', '-'].includes(value)) : [];

  return (
    <>
      <Nav />
      <div className="container fade-in scanner-page">
        <div className="scanner-container">
          {warning && <div className="db-warning"><i className="ti ti-alert-triangle" /> Database Server is Offline. Verification may not work.</div>}
          <div className="scanner-header"><div className="logo-group"><div className="scanner-logo-icon"><i className="ti ti-certificate" /></div><div><div className="logo-title">Certificate Verification</div></div></div><span className={`status-badge ${status.state}`}><span className={`dot${status.state === 'active' ? ' pulse' : ''}`} /> {status.label}</span></div>
          <div className="tabs"><button className={`tab ${tabName === 'camera' ? 'active' : ''}`} type="button" onClick={() => { setTabName('camera'); setLastResult(null); }}><i className="ti ti-camera" /> Camera</button><button className={`tab ${tabName === 'upload' ? 'active' : ''}`} type="button" onClick={() => { setTabName('upload'); setLastResult(null); }}><i className="ti ti-upload" /> Upload Image</button></div>

          {tabName === 'camera' && (
            <div>
              <div className="scanner-wrap card" style={{ padding: 0 }}>
                {cameraState === 'off' && <div className="cam-placeholder"><i className="ti ti-camera-off" /><p>Camera is off.<br />Tap <strong>Start Camera</strong> to begin scanning.</p></div>}
                <video ref={videoRef} autoPlay playsInline muted style={{ display: cameraState === 'live' ? 'block' : 'none' }} />
                {preview && <img src={preview} alt="Captured certificate" id="preview-img" style={{ display: 'block' }} />}
                {cameraState === 'live' && <div className="overlay-frame" style={{ display: 'block' }}><div className="corner c-tl" /><div className="corner c-tr" /><div className="corner c-bl" /><div className="corner c-br" /><div className="scan-line" /><div className="frame-hint">Align certificate within the frame</div></div>}
                {processing && <div className="processing" style={{ display: 'flex' }}><div className="spinner" /><p>Analyzing certificate...</p></div>}
              </div>
              <div className="hint-bar"><i className="ti ti-info-circle" style={{ fontSize: 20, flexShrink: 0 }} /><span>{hint}</span></div>
              <div className="controls"><Link href="/" className="back-btn"><i className="ti ti-arrow-left" /> Back to Home</Link>{cameraState !== 'live' && <button className="btn primary" type="button" onClick={startCamera}><i className="ti ti-camera" /> Start Camera</button>}{cameraState === 'live' && <><button className="btn success" type="button" onClick={captureFrame}><i className="ti ti-camera-rotate" /> Capture</button>{multiCam && <button className="btn" type="button" onClick={switchCamera}><i className="ti ti-switch-horizontal" /> Flip Camera</button>}<button className="btn danger" type="button" onClick={stopCamera}><i className="ti ti-x" /> Stop</button></>}{cameraState === 'captured' && <button className="btn" type="button" onClick={() => { setPreview(''); setCameraState('off'); setLastResult(null); }}><i className="ti ti-refresh" /> Rescan</button>}</div>
            </div>
          )}

          {tabName === 'upload' && (
            <div>
              {!uploaded?.ready && <div className="upload-zone" onClick={() => fileInputRef.current.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]); }}><i className="ti ti-file-upload" /><h3>Drop certificate image here</h3><p>or click to browse - JPG, PNG, WebP, PDF supported</p></div>}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event.target.files[0])} style={{ display: 'none' }} />
              {uploaded?.ready && <div className="card" style={{ marginTop: 0, textAlign: 'center' }}><div style={{ marginBottom: 20 }}><span className="status-badge done"><i className="ti ti-check" /> File Ready for Analysis</span></div><div style={{ background: 'var(--bg-color)', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px dashed var(--border-color)' }}><img src={uploaded.data} alt="Uploaded certificate" style={{ maxHeight: 280, maxWidth: '100%', borderRadius: 8, display: 'block', margin: '0 auto' }} /><div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}><i className="ti ti-file" /> {uploaded.file.name} - {(uploaded.file.size / 1024).toFixed(1)} KB</div></div><div className="controls"><Link href="/" className="btn"><i className="ti ti-arrow-left" /> Back to Home</Link><button className="btn primary" type="button" onClick={analyzeUploaded}><i className="ti ti-scan" /> Analyze Certificate</button><button className="btn danger" type="button" onClick={() => { setUploaded(null); setLastResult(null); setStatus({ state: '', label: 'Idle' }); }}><i className="ti ti-trash" /> Clear</button></div></div>}
              {processing && <div className="card processing" style={{ position: 'relative', minHeight: 120, borderRadius: 16, display: 'flex', marginTop: 16, background: 'var(--card-bg)' }}><div className="spinner" style={{ borderTopColor: 'var(--primary-color)' }} /><p style={{ color: 'var(--text-primary)', marginTop: 12 }}>Analyzing certificate...</p></div>}
            </div>
          )}

          {lastResult && <div className="card fade-in" style={{ marginTop: 24 }}><div className="result-header"><div className="result-title"><i className="ti ti-file-check" style={{ fontSize: 20, color: 'var(--primary-color)' }} /> Scan Result</div><span className={`status-badge ${verified ? 'done' : lastResult.verificationStatus === 'Error' ? 'error' : ''}`}>{verified ? <><i className="ti ti-check" /> Verified</> : <><i className="ti ti-alert-circle" /> {lastResult.verificationStatus || 'Unverified'}</>}</span></div>{rows.map(([key, value]) => <div className="field-row" key={key}><span className="field-label">{key}</span><span className="field-value">{value}</span></div>)}<div className="controls" style={{ marginTop: 20, justifyContent: 'flex-start' }}><button className="btn success" type="button" onClick={secureDatabaseVerify}><i className="ti ti-shield-check" /> Secure Database Verify</button><button className="btn primary" type="button" onClick={downloadResult}><i className="ti ti-download" /> Download Report</button><button className="btn" type="button" onClick={() => navigator.clipboard.writeText(Object.entries(lastResult).map(([key, value]) => `${key}: ${value}`).join('\n'))}><i className="ti ti-copy" /> Copy</button><button className="btn" type="button" onClick={() => { stopCamera(); setUploaded(null); setLastResult(null); setTabName('camera'); }}><i className="ti ti-refresh" /> New Scan</button></div></div>}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}

export default function App() {
  const route = useRoute();
  if (route.endsWith('/html/type.html')) return <TypePage />;
  if (route.endsWith('/html/assessment_general.html')) return <AssessmentPage type="general" />;
  if (route.endsWith('/html/assessment_it.html')) return <AssessmentPage type="it" />;
  if (route.endsWith('/html/lead.html')) return <LeadPage />;
  if (route.endsWith('/html/results.html')) return <ResultsPage />;
  if (route.endsWith('/html/verify_id.html')) return <VerifyIdPage />;
  if (route.endsWith('/html/cert_verify.html')) return <CertDetailsPage />;
  if (route.endsWith('/html/verify.html')) return <SecureVerifyPage />;
  if (route.endsWith('/html/cert_generate.html')) return <CertGeneratePage />;
  if (route.endsWith('/html/Certificate_Scanner.html')) return <ScannerPage />;
  return <HomePage />;
}
