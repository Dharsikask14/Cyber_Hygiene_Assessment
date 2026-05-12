const { useState, useRef } = React;

// ─── CONFIG — update before going live ───────────────────────────────────────
const BRAND = {
  name:       "Hackers InfoTech",
  url:        "hackersinfotech.com",
  city:       "Coimbatore, India",
  phone:      "+91 XXXXX XXXXX",       // ← update this
  email:      "thehackersinfotech@gmail.com",
  bookingUrl: "https://calendly.com/hackersinfotech", // ← update this
  emailjs: {
    serviceId:  "service_bn1go7u",
    templateId: "template_d0r6x1i",
    publicKey:  "IYAEEHJKqAieS9uH0",
  },
};

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const GENERAL_SECTIONS = [
  { id:"mobile", icon:"📱", title:"Mobile Phone Safety", questions:[
    {id:"g1",  w:3, text:"Do you have a screen lock (PIN / fingerprint / face lock) on your phone?",                     tip:"Anyone can open your phone and access your photos, WhatsApp, and banking apps without a lock."},
    {id:"g2",  w:3, text:"Do you update your phone's software whenever updates are available?",                          tip:"Old software has security holes hackers exploit silently. Enable auto-update in Settings."},
    {id:"g3",  w:3, text:"Do you download apps ONLY from Google Play Store or Apple App Store?",                        tip:"Apps from other websites can steal your contacts, photos, and banking details. No APK files from WhatsApp links."},
    {id:"g4",  w:2, text:"Do you check app permissions before installing (e.g., a torch app asking for your contacts)?",tip:"Apps can secretly read your messages, camera, and location. Ask: does this app really need this permission?"},
    {id:"g5",  w:3, text:"Do you avoid installing apps sent via WhatsApp links or unknown websites?",                   tip:"This is the #1 way phones get hacked in India. Only use Play Store / App Store — always."},
  ]},
  { id:"passwords", icon:"🔑", title:"Passwords & Account Security", questions:[
    {id:"g6",  w:3, text:"Do you use different passwords for WhatsApp, email, Facebook, and banking apps?",             tip:"If one password is stolen, ALL your accounts get hacked. Use Google Password Manager (free)."},
    {id:"g7",  w:2, text:"Is your password longer than 8 characters with numbers and symbols?",                        tip:"Short/simple passwords are cracked in seconds. Example: Sun@2024#Kovai"},
    {id:"g8",  w:3, text:"Do you use Two-Step Verification / OTP login on WhatsApp, Gmail, and Facebook?",             tip:"Even if someone steals your password, 2-Step Verification stops them. Enable it NOW — free, 2 minutes."},
    {id:"g9",  w:3, text:"Do you NEVER share your OTP with anyone — even if they claim to be from your bank?",         tip:"Banks NEVER ask for OTP by phone. Anyone asking for your OTP is a SCAMMER. Hang up immediately."},
    {id:"g10", w:2, text:"Do you avoid saving passwords on shared or public computers?",                               tip:"Anyone using that computer can see your saved passwords. Always log out on shared devices."},
  ]},
  { id:"laptop", icon:"💻", title:"Laptop & Computer Safety", questions:[
    {id:"g11", w:3, text:"Are you using genuine/original Windows or macOS — NOT a cracked or pirated version?",        tip:"Pirated OS gets NO security updates. 80–90% of malware attacks target unpatched systems."},
    {id:"g12", w:3, text:"Do you have antivirus software installed and updated on your laptop?",                       tip:"Windows Defender is free and built-in — make sure it is ON in Windows Security settings."},
    {id:"g13", w:3, text:"Do you download software ONLY from official websites?",                                      tip:"Fake download sites bundle malware with software. Always check the URL carefully."},
    {id:"g14", w:3, text:"Do you avoid using cracked or pirated software (Photoshop, Office, games)?",                tip:"Cracked software is the #1 source of ransomware in India. Use free alternatives: LibreOffice, GIMP."},
    {id:"g15", w:2, text:"Do you take backups of important files to an external drive or cloud (Google Drive)?",       tip:"Ransomware can delete ALL your files. Back up to Google Drive (free 15GB) or USB monthly."},
  ]},
  { id:"internet", icon:"🌐", title:"Internet & Browsing Safety", questions:[
    {id:"g16", w:3, text:"Do you check if a website starts with 'https://' before entering your password or card details?", tip:"'http://' sites are not secure. NEVER enter passwords or card details on http:// sites."},
    {id:"g17", w:3, text:"Do you avoid clicking links in SMS, WhatsApp, or email without verifying the sender?",       tip:"This is Phishing. If unsure, type the website address manually — never click the link."},
    {id:"g18", w:3, text:"Do you avoid connecting to unknown public Wi-Fi for banking or shopping?",                   tip:"Public Wi-Fi is like shouting your password in a crowd. Use mobile data (4G/5G) for banking."},
    {id:"g19", w:2, text:"Do you ignore pop-ups saying 'Your phone has a virus! Click here to clean it!'?",           tip:"These are FAKE pop-ups. Close the browser tab immediately. Never call any number shown."},
    {id:"g20", w:3, text:"Do you check the full URL before clicking? (e.g., 'sbi-login.net' is FAKE — real is 'onlinesbi.sbi')", tip:"Scammers create websites identical to real bank sites. Bookmark your bank and use only that."},
  ]},
  { id:"banking", icon:"💳", title:"Online Payments & Banking", questions:[
    {id:"g21", w:3, text:"Do you use only official bank apps from Play Store / App Store for UPI and net banking?",    tip:"Fake banking apps steal your credentials. Check the developer name carefully before installing."},
    {id:"g22", w:3, text:"Do you verify UPI payment requests before approving — especially 'Collect Money' requests?", tip:"'Collect Money' means YOU are paying THEM. NEVER approve unexpected collect requests."},
    {id:"g23", w:3, text:"Do you avoid screen-sharing while doing banking transactions?",                              tip:"Any app with screen access can see your OTP and card numbers. Real banks NEVER ask for screen access."},
    {id:"g24", w:2, text:"Do you have transaction SMS alerts enabled for all your bank accounts?",                     tip:"Enable alerts so you know instantly if any transaction happens. Report unknowns within 24 hours."},
  ]},
  { id:"scams", icon:"⚠️", title:"Scam & Fraud Awareness", questions:[
    {id:"g25", w:3, text:"Do you know that NO bank, government, or police will EVER ask for your OTP or PIN on a call?", tip:"ANY call asking for OTP/PIN is a SCAM — 100% of the time. Hang up and block the number."},
    {id:"g26", w:3, text:"Do you avoid 'KYC expiry', 'FASTag blocked', 'TRAI disconnecting your number' scam calls?",tip:"Government/TRAI/bank NEVER calls for KYC over phone. Hang up. Block. Report on Sanchar Saathi."},
    {id:"g27", w:2, text:"Do you avoid lottery/prize scams — 'You won ₹50 lakh, send ₹500 to claim'?",               tip:"No real prize ever asks you to pay first. Always a scam. Delete and block."},
    {id:"g28", w:2, text:"Can you identify a fake email? (wrong sender address, urgent language, suspicious link)",   tip:"Check sender email carefully. Look for spelling errors and 'Verify NOW' urgency. Never click."},
  ]},
];

const IT_SECTIONS = [
  { id:"iam", icon:"🔐", title:"Identity & Access Management", questions:[
    {id:"t1",  w:3, text:"Do you use a password manager (Bitwarden, 1Password, KeePass) for all credentials?",        tip:"Reusing passwords is the #1 cause of account takeovers. Bitwarden is free & open-source."},
    {id:"t2",  w:3, text:"Is TOTP-based MFA (not just SMS) enabled on email, GitHub, cloud, and VPN accounts?",       tip:"SMS OTP can be SIM-swapped in India in under 2 hours. Use Google Authenticator or Authy."},
    {id:"t3",  w:2, text:"Do you use a separate non-admin account for daily browsing and work?",                      tip:"Using an admin account daily means any malware runs with full system privileges."},
    {id:"t4",  w:2, text:"Do you audit and revoke unused OAuth/third-party app permissions regularly?",               tip:"Check myaccount.google.com/permissions — revoke all apps you no longer use."},
    {id:"t5",  w:2, text:"Do you use unique randomly-generated passwords (20+ characters) per service?",              tip:"Short/reused passwords are cracked via credential stuffing within hours of a breach."},
  ]},
  { id:"device", icon:"🖥️", title:"Device & OS Hardening", questions:[
    {id:"t6",  w:3, text:"Is your OS fully updated with the latest security patches applied within 30 days?",          tip:"Unpatched OS is the #1 attack vector. Enable Windows Update or macOS auto-update."},
    {id:"t7",  w:3, text:"Is full-disk encryption (BitLocker / FileVault / LUKS) enabled on your laptop?",            tip:"Physical theft = all data exposed without FDE. BitLocker is free on Windows Pro/Enterprise."},
    {id:"t8",  w:2, text:"Is Secure Boot enabled and BIOS protected with a password?",                               tip:"Without Secure Boot, bootkits and rootkits can persist undetected across reinstalls."},
    {id:"t9",  w:2, text:"Do you disable unused services — Bluetooth off when not needed, SMBv1 disabled, RDP closed?",tip:"Every open service is an attack surface. Close RDP port 3389 if you do not use remote desktop."},
    {id:"t10", w:2, text:"Do you verify SHA256 file hashes when downloading tools/software from the internet?",       tip:"Compromised download mirrors serve malware-laced files. Always verify hash from official source."},
  ]},
  { id:"network", icon:"🌐", title:"Network & Browser Security", questions:[
    {id:"t11", w:3, text:"Do you use a reputable VPN (ProtonVPN, Mullvad) on public or untrusted networks?",          tip:"Public Wi-Fi enables trivial MITM attacks. Always use a paid, no-log VPN on networks you don't control."},
    {id:"t12", w:3, text:"Have you changed your home router's default admin credentials and disabled WPS?",           tip:"Default credentials are public knowledge. Disable WPS — it has a known brute-force vulnerability."},
    {id:"t13", w:2, text:"Do you use DNS-over-HTTPS (DoH) or a private encrypted DNS (1.1.1.1, 9.9.9.9)?",          tip:"Plain DNS leaks your browsing history and can be hijacked. Use NextDNS for system-wide encrypted DNS."},
    {id:"t14", w:2, text:"Do you use browser security extensions like uBlock Origin and Privacy Badger?",             tip:"uBlock Origin (free) blocks 99% of malicious ads and scripts. Essential for any professional."},
    {id:"t15", w:2, text:"Is your home/office Wi-Fi using WPA3 or at minimum WPA2-AES encryption?",                  tip:"WEP and WPA (TKIP) are cracked in minutes. Check router settings — upgrade to WPA2-AES minimum."},
  ]},
  { id:"phishing", icon:"📧", title:"Phishing & Social Engineering", questions:[
    {id:"t16", w:3, text:"Can you identify spear phishing emails that use your name, company, or role?",              tip:"Verify any unexpected request involving money, credentials, or access by calling the sender directly."},
    {id:"t17", w:2, text:"Do you hover over links to verify the actual destination URL before clicking?",             tip:"Displayed text can say 'paypal.com' while the actual link goes to 'paypa1.ru'. Always hover to check."},
    {id:"t18", w:3, text:"Do you avoid plugging in unknown USB drives received as gifts or found in public?",         tip:"A malicious USB can execute payloads within seconds of connection. Never plug in an unknown USB."},
    {id:"t19", w:2, text:"Have you verified your domain's DMARC, DKIM, and SPF records if you run a business email?",tip:"Without DMARC, attackers can spoof your email domain to phish your clients."},
  ]},
  { id:"data", icon:"💾", title:"Data Protection & Backup", questions:[
    {id:"t20", w:3, text:"Do you follow the 3-2-1 backup rule (3 copies, 2 media types, 1 offsite)?",                tip:"Ransomware encrypts local and network drives simultaneously. Only an offsite backup guarantees recovery."},
    {id:"t21", w:3, text:"Is sensitive data encrypted before uploading to cloud?",                                    tip:"Encrypt sensitive files with Veracrypt (free) or 7-Zip AES-256 before uploading."},
    {id:"t22", w:2, text:"Do you use secure deletion tools (Eraser / shred) instead of regular delete for sensitive files?",tip:"Regular delete leaves data fully recoverable with free tools. Use Eraser (Windows) or shred (Linux)."},
    {id:"t23", w:2, text:"Are your cloud storage sharing links set to 'Restricted' — not 'Anyone with the link'?",   tip:"Public Google Drive links get indexed by search engines and accessed by bots within hours."},
  ]},
  { id:"tools", icon:"🛡️", title:"Security Tools & Monitoring", questions:[
    {id:"t24", w:2, text:"Do you monitor Have I Been Pwned for your email address in data breaches?",                 tip:"Free at haveibeenpwned.com — enable breach alerts. You may already be compromised without knowing."},
    {id:"t25", w:2, text:"Do you use VirusTotal to scan suspicious files and URLs before opening them?",             tip:"Free at virustotal.com — check against 70+ antivirus engines. Takes 10 seconds."},
    {id:"t26", w:2, text:"Do you review installed browser extensions periodically and remove unknown ones?",          tip:"Malicious extensions read all your web traffic and passwords in real time."},
    {id:"t27", w:2, text:"Are ALL installed applications (not just OS) kept up to date with auto-updates enabled?",  tip:"Use Patch My PC (Windows, free) to keep all applications updated automatically."},
  ]},
  { id:"cloud", icon:"☁️", title:"Cloud & DevOps Security", questions:[
    {id:"t28", w:3, text:"Are your cloud accounts (AWS/GCP/Azure/personal) using MFA — not just passwords?",         tip:"Cloud account takeover leads to data theft plus unexpected billing. Enable MFA on root/admin accounts."},
    {id:"t29", w:3, text:"Do you store API keys, tokens, and secrets in a secrets manager — NOT hardcoded in code?", tip:"Hardcoded secrets in GitHub repos are found by bots within minutes of a push."},
    {id:"t30", w:2, text:"Do you scan your public GitHub/GitLab repos for accidentally committed secrets?",          tip:"Use GitGuardian (free tier) or git-secrets to scan your repos."},
    {id:"t31", w:2, text:"Do you review connected app sessions periodically on Google, Apple, and Microsoft accounts?",tip:"Go to myaccount.google.com → Security → Your Devices. Revoke old sessions quarterly."},
  ]},
];

const ALL = { general: GENERAL_SECTIONS, it: IT_SECTIONS };
const maxScore = (type) => ALL[type].reduce((s,sec)=>s+sec.questions.reduce((a,q)=>a+q.w,0),0);
const getGrade = (p) => {
  if(p>=95) return {grade:"A+",label:"Cyber Safe Champion",color:"#059669",bg:"#ECFDF5",desc:"Excellent! You follow best security practices. You are well protected."};
  if(p>=85) return {grade:"A", label:"Very Good",          color:"#0891B2",bg:"#ECFEFF",desc:"Strong security habits with only minor gaps to address."};
  if(p>=75) return {grade:"B+",label:"Above Average",      color:"#D97706",bg:"#FFFBEB",desc:"Good effort, but a few risky habits remain that need attention."};
  if(p>=65) return {grade:"B", label:"Average",            color:"#EA580C",bg:"#FFF7ED",desc:"Moderate risk. You are vulnerable to common cyber attacks."};
  if(p>=50) return {grade:"C+",label:"Below Average",      color:"#DC2626",bg:"#FEF2F2",desc:"Several bad habits. You are an easy target for scammers and hackers."};
  return          {grade:"C", label:"High Risk",           color:"#991B1B",bg:"#FEF2F2",desc:"Critical! Your accounts and data are in serious danger right now."};
};

// ─── PDF ─────────────────────────────────────────────────────────────────────
async function downloadPDF(id, filename) {
  const el = document.getElementById(id);
  el.style.display = "block";
  await new Promise(r => setTimeout(r, 200));
  const canvas = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:"#ffffff" });
  el.style.display = "none";
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const w = pdf.internal.pageSize.getWidth();
  const h = (canvas.height * w) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
  pdf.save(filename);
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Warn = ({s=16}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h20L12 2z" fill="#F59E0B" opacity=".2"/><path d="M12 2L2 20h20L12 2z" stroke="#F59E0B" strokeWidth="1.5"/><path d="M12 9v5M12 16v1" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/></svg>;

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen]   = useState("home");
  const [type, setType]       = useState(null);
  const [ans, setAns]         = useState({});
  const [sec, setSec]         = useState(0);
  const [lead, setLead]       = useState({name:"",email:"",phone:"",company:""});
  const [mailSt, setMailSt]   = useState("idle");
  const [mailMsg, setMailMsg] = useState("");
  const [pdfSt, setPdfSt]     = useState("idle");
  const top = useRef(null);

  const sections = type ? ALL[type] : [];
  const mx       = type ? maxScore(type) : 0;
  const allQ     = sections.flatMap(s=>s.questions);
  const score    = allQ.reduce((s,q)=>s+(ans[q.id]==="yes"?q.w:0),0);
  const pct      = mx>0 ? Math.round((score/mx)*100) : 0;
  const G        = getGrade(pct);
  const failed   = allQ.filter(q=>ans[q.id]==="no");
  const progPct  = allQ.length>0 ? Math.round((Object.keys(ans).length/allQ.length)*100) : 0;
  const date     = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const curSec   = sections[sec] || {icon:"",title:"",questions:[]};
  const done     = (s) => s.questions.every(q=>ans[q.id]);

  const go = (s) => { setScreen(s); setTimeout(()=>top.current?.scrollIntoView({behavior:"smooth"}),50); };

  // ── Email ──
  const sendEmail = async () => {
    setMailSt("sending");
    try {
      await emailjs.send(
        BRAND.emailjs.serviceId,
        BRAND.emailjs.templateId,
        {
          to_email: lead.email,
          to_name:  lead.name,
          subject:  `Your Cyber Hygiene Report — Grade ${G.grade} (${pct}%) | Hackers InfoTech`,
          html_body: `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:30px;">
            <div style="background:#0C1B2E;color:#fff;padding:24px;border-radius:12px;margin-bottom:20px;">
              <h2 style="margin:0 0 6px;color:#38BDF8;">Hackers InfoTech</h2>
              <p style="margin:0;color:#94A3B8;font-size:13px;">Cyber Hygiene Assessment Report · ${date}</p>
            </div>
            <p>Dear <b>${lead.name}</b>,</p>
            <p>Thank you for completing the <b>Hackers InfoTech Cyber Hygiene Assessment</b>.</p>
            <div style="background:#F8FAFC;border:2px solid ${G.color}44;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
              <div style="font-size:60px;font-weight:700;color:${G.color};line-height:1;">${G.grade}</div>
              <div style="font-size:18px;font-weight:600;">${G.label}</div>
              <div style="font-size:20px;font-weight:700;color:${G.color};">${pct}% · ${score}/${mx} points</div>
              <p style="color:#64748B;font-size:13px;margin-top:8px;">${G.desc}</p>
            </div>
            ${failed.length>0 ? `<h3>Your Action Plan (${failed.length} items to fix)</h3>
            ${failed.map((q,i)=>`<div style="margin-bottom:14px;padding-left:12px;border-left:3px solid #EF4444;">
              <b style="font-size:13px;">${i+1}. ${q.text}</b><br/>
              <span style="font-size:12px;color:#64748B;"><span style="color:#0EA5E9;font-weight:600;">Fix:</span> ${q.tip}</span>
            </div>`).join("")}` : `<p style="color:#059669;font-weight:600;">✅ Excellent! No action items needed.</p>`}
            <div style="background:#0C1B2E;color:#fff;border-radius:10px;padding:18px;margin-top:24px;text-align:center;">
              <p style="margin:0 0 8px;font-weight:600;">Book a Free 30-Min Consultation</p>
              <a href="${BRAND.bookingUrl}" style="color:#38BDF8;">${BRAND.bookingUrl}</a><br/>
              <p style="margin:10px 0 0;font-size:12px;color:#64748B;">${BRAND.name} · ${BRAND.email} · ${BRAND.phone} · ${BRAND.city}</p>
            </div>
          </div>`,
        },
        BRAND.emailjs.publicKey
      );
      setMailSt("sent"); setMailMsg(`Report sent to ${lead.email}`);
    } catch(e) {
      setMailSt("error"); setMailMsg(e?.text || "Send failed. Check EmailJS config.");
    }
  };

  // ── PDF ──
  const dlPDF = async (which) => {
    setPdfSt("loading");
    await downloadPDF(which==="cert"?"pdf-cert":"pdf-report",
      which==="cert" ? `${lead.name}_Certificate.pdf` : `${lead.name}_CyberReport.pdf`);
    setPdfSt("idle");
  };

  const btn = (label, onClick, bg="#0EA5E9", color="#fff", disabled=false, extra={}) => (
    <button onClick={onClick} disabled={disabled} style={{
      background:disabled?"#CBD5E1":bg, color:disabled?"#94A3B8":color,
      border:"none", borderRadius:10, padding:"12px 20px", fontSize:14,
      fontWeight:600, cursor:disabled?"not-allowed":"pointer", ...extra }}>
      {label}
    </button>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC"}}>
      <div ref={top}/>

      {/* Hidden PDF targets */}
      <div id="pdf-cert" style={{display:"none",position:"fixed",top:0,left:0,width:"794px",zIndex:-999,background:"#0C1B2E",padding:"60px 40px"}}>
        <div style={{border:"2px solid #0EA5E9",borderRadius:20,padding:"50px 40px",textAlign:"center",color:"#fff",maxWidth:700,margin:"0 auto"}}>
          <div style={{fontSize:12,letterSpacing:".12em",color:"#38BDF8",textTransform:"uppercase",marginBottom:12}}>Hackers InfoTech — Official Certificate</div>
          <div style={{fontSize:30,fontWeight:700,color:"#F0F9FF",marginBottom:4}}>Cyber Hygiene Assessment</div>
          <div style={{color:"#64748B",marginBottom:32,fontSize:13}}>Certificate of Completion</div>
          <div style={{fontSize:14,color:"#94A3B8",marginBottom:6}}>This certifies that</div>
          <div style={{fontSize:28,fontWeight:700,color:"#38BDF8",marginBottom:4}}>{lead.name}</div>
          {lead.company&&<div style={{fontSize:13,color:"#64748B",marginBottom:24}}>{lead.company}</div>}
          <div style={{fontSize:13,color:"#94A3B8",marginBottom:16}}>has completed the Cyber Hygiene Assessment and achieved the grade</div>
          <div style={{fontSize:96,fontWeight:700,color:G.color,lineHeight:1}}>{G.grade}</div>
          <div style={{fontSize:20,fontWeight:600,color:"#F0F9FF",margin:"8px 0 4px"}}>{G.label}</div>
          <div style={{fontSize:22,color:G.color,fontWeight:700,marginBottom:4}}>{pct}% ({score}/{mx} pts)</div>
          <div style={{color:"#475569",fontSize:12,marginBottom:32}}>Assessed on {date}</div>
          <div style={{borderTop:"1px solid #1E3050",paddingTop:18,display:"flex",justifyContent:"space-between",fontSize:11,color:"#475569"}}>
            <span>{BRAND.url}</span><span>{BRAND.email}</span><span>{BRAND.city}</span>
          </div>
        </div>
      </div>

      <div id="pdf-report" style={{display:"none",position:"fixed",top:0,left:0,width:"794px",zIndex:-999,background:"#fff",padding:"40px 30px"}}>
        <div style={{background:"#0C1B2E",color:"#fff",padding:"24px",borderRadius:12,marginBottom:20}}>
          <div style={{fontSize:10,letterSpacing:".1em",color:"#38BDF8",textTransform:"uppercase",marginBottom:6}}>Hackers InfoTech — Confidential Report</div>
          <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>Cyber Hygiene Assessment Report</div>
          <div style={{fontSize:13,color:"#94A3B8"}}>Prepared for: <b style={{color:"#fff"}}>{lead.name}</b>{lead.company?` · ${lead.company}`:""} · {date}</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:4}}>📧 {lead.email} · 📞 {lead.phone}</div>
        </div>
        <div style={{background:"#F8FAFC",border:`2px solid ${G.color}44`,borderRadius:12,padding:"20px",textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:60,fontWeight:700,color:G.color,lineHeight:1}}>{G.grade}</div>
          <div style={{fontSize:16,fontWeight:600}}>{G.label}</div>
          <div style={{fontSize:18,fontWeight:700,color:G.color}}>{pct}% · {score}/{mx} pts</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:6}}>{G.desc}</div>
        </div>
        <h3 style={{fontSize:14,marginBottom:10}}>Category Breakdown</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:20,border:"1px solid #E2E8F0"}}>
          <thead><tr style={{background:"#F1F5F9"}}>
            <th style={{padding:"8px 10px",textAlign:"left"}}>Category</th>
            <th style={{padding:"8px 10px",textAlign:"center"}}>Score %</th>
            <th style={{padding:"8px 10px",textAlign:"center"}}>Points</th>
          </tr></thead>
          <tbody>{sections.map(s=>{
            const sm=s.questions.reduce((a,q)=>a+q.w,0);
            const ss=s.questions.reduce((a,q)=>a+(ans[q.id]==="yes"?q.w:0),0);
            const sp=Math.round((ss/sm)*100);
            return <tr key={s.id}><td style={{padding:"7px 10px",borderBottom:"1px solid #E2E8F0"}}>{s.icon} {s.title}</td>
              <td style={{padding:"7px 10px",borderBottom:"1px solid #E2E8F0",textAlign:"center",fontWeight:600,color:sp>=80?"#059669":sp>=60?"#D97706":"#DC2626"}}>{sp}%</td>
              <td style={{padding:"7px 10px",borderBottom:"1px solid #E2E8F0",textAlign:"center"}}>{ss}/{sm}</td></tr>;
          })}</tbody>
        </table>
        {failed.length>0&&<><h3 style={{fontSize:14,marginBottom:10}}>Action Plan ({failed.length} items)</h3>
        {failed.map((q,i)=>(
          <div key={q.id} style={{marginBottom:12,paddingLeft:10,borderLeft:"3px solid #EF4444"}}>
            <div style={{fontWeight:600,fontSize:12,marginBottom:2}}>{i+1}. {q.text}</div>
            <div style={{fontSize:11,color:"#64748B"}}><b style={{color:"#0EA5E9"}}>Fix: </b>{q.tip}</div>
          </div>
        ))}</>}
        <div style={{background:"#0C1B2E",color:"#fff",borderRadius:10,padding:"14px",marginTop:20,fontSize:11,textAlign:"center"}}>
          <b>{BRAND.name}</b> · {BRAND.url} · {BRAND.email} · {BRAND.phone} · {BRAND.city}
        </div>
      </div>

      {/* NAV */}
      <nav style={{background:"#0C1B2E",borderBottom:"1px solid #1E3050",padding:"0 20px"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
            onClick={()=>{setAns({});setSec(0);setType(null);setMailSt("idle");go("home");}}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#38BDF8" opacity=".15"/>
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="#38BDF8" strokeWidth="1.5"/>
              <path d="M9 12l2 2 4-4" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{fontWeight:600,fontSize:15,color:"#F0F9FF"}}>{BRAND.name}</span>
          </div>
          <span style={{fontSize:12,color:"#64748B"}}>{BRAND.city}</span>
        </div>
      </nav>

      <div style={{maxWidth:800,margin:"0 auto",padding:"0 16px 80px"}}>

        {/* HOME */}
        {screen==="home"&&(
          <div>
            <div style={{textAlign:"center",padding:"56px 0 40px"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#1D4ED8",fontWeight:500,marginBottom:24}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#3B82F6",display:"inline-block"}}/>Free Cyber Hygiene Assessment
              </div>
              <h1 style={{fontSize:40,fontWeight:600,color:"#0F172A",lineHeight:1.15,margin:"0 0 16px",letterSpacing:"-.8px"}}>How safe are you<br/><span style={{color:"#0EA5E9"}}>online?</span></h1>
              <p style={{fontSize:15,color:"#64748B",maxWidth:480,margin:"0 auto 32px",lineHeight:1.7}}>Answer 28–31 questions. Get your cyber safety grade, PDF certificate, full report — emailed instantly.</p>
              {btn("Start Free Assessment →", ()=>go("type"), "#0EA5E9", "#fff", false, {fontSize:16,padding:"14px 32px"})}
              <div style={{marginTop:14,fontSize:13,color:"#94A3B8"}}>5 minutes · 100% free · Certificate + PDF report included</div>
            </div>
            <div style={{background:"#FFFBEB",border:"1px solid #FCD34D",borderRadius:12,padding:"16px 20px",display:"flex",gap:12,alignItems:"flex-start"}}>
              <Warn s={18}/><div>
                <div style={{fontWeight:600,fontSize:13,color:"#92400E",marginBottom:3}}>DPDP Act 2023 — Are you compliant?</div>
                <div style={{fontSize:12,color:"#78350F",lineHeight:1.6}}>Every business storing customer data in India is legally required to comply with the Digital Personal Data Protection Act 2023. This assessment helps identify your compliance gaps.</div>
              </div>
            </div>
          </div>
        )}

        {/* TYPE */}
        {screen==="type"&&(
          <div style={{paddingTop:48}}>
            <h2 style={{fontSize:26,fontWeight:600,color:"#0F172A",marginBottom:8,textAlign:"center"}}>Who is this for?</h2>
            <p style={{textAlign:"center",color:"#64748B",marginBottom:36,fontSize:15}}>Choose the profile that best matches you</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:600,margin:"0 auto 32px"}}>
              {[
                {t:"general",icon:"👤",title:"General Public",  sub:"Phone · Laptop · Internet User",      c:"#7C3AED",bg:"#F5F3FF",b:"#DDD6FE",pts:["No technical knowledge needed","Mobile, passwords, banking","Scam & fraud awareness","28 questions · ~4 min"]},
                {t:"it",     icon:"💻",title:"IT & Tech Users", sub:"Developers · IT Staff · Freelancers", c:"#0EA5E9",bg:"#F0F9FF",b:"#BAE6FD",pts:["Advanced security practices","DevOps, cloud, network","Threat detection & tools","31 questions · ~6 min"]},
              ].map(p=>(
                <div key={p.t} onClick={()=>{setType(p.t);setAns({});setSec(0);go("quiz");}}
                  style={{background:"#fff",border:`2px solid ${p.b}`,borderRadius:16,padding:"24px 20px",cursor:"pointer"}}>
                  <div style={{fontSize:36,marginBottom:10}}>{p.icon}</div>
                  <div style={{fontWeight:600,fontSize:16,color:"#0F172A",marginBottom:3}}>{p.title}</div>
                  <div style={{fontSize:12,color:"#64748B",marginBottom:14}}>{p.sub}</div>
                  {p.pts.map(b=><div key={b} style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:p.c}}/><span style={{fontSize:12,color:"#374151"}}>{b}</span></div>)}
                  <div style={{marginTop:16,background:p.bg,borderRadius:8,padding:"9px",textAlign:"center",fontWeight:600,fontSize:13,color:p.c}}>Start →</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center"}}>
              <button onClick={()=>go("home")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:13}}>← Back</button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {screen==="quiz"&&sections.length>0&&(
          <div style={{paddingTop:32}}>
            <div style={{marginBottom:22}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:13,color:"#64748B",fontWeight:500}}>Section {sec+1} of {sections.length}</span>
                <span style={{fontSize:13,color:"#64748B"}}>{progPct}% complete</span>
              </div>
              <div style={{background:"#E2E8F0",borderRadius:99,height:6}}>
                <div style={{background:"#0EA5E9",height:6,borderRadius:99,width:`${progPct}%`,transition:"width .4s"}}/>
              </div>
              <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
                {sections.map((s,i)=>(
                  <div key={s.id} onClick={()=>setSec(i)} style={{padding:"4px 12px",borderRadius:99,fontSize:12,fontWeight:500,cursor:"pointer",
                    background:i===sec?"#0EA5E9":done(s)?"#ECFDF5":"#F1F5F9",
                    color:i===sec?"#fff":done(s)?"#059669":"#64748B",
                    border:`1px solid ${i===sec?"#0EA5E9":done(s)?"#A7F3D0":"#E2E8F0"}`}}>
                    {s.icon} {s.title}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:"18px 20px",marginBottom:14}}>
              <div style={{fontSize:22}}>{curSec.icon}</div>
              <h3 style={{fontSize:18,fontWeight:600,color:"#0F172A",margin:"6px 0 4px"}}>{curSec.title}</h3>
              <div style={{fontSize:13,color:"#64748B"}}>{curSec.questions.length} questions</div>
            </div>
            {curSec.questions.map((q,qi)=>{
              const a=ans[q.id];
              return (
                <div key={q.id} style={{background:"#fff",border:`1px solid ${a==="no"?"#FCA5A5":a==="yes"?"#A7F3D0":"#E2E8F0"}`,borderRadius:14,padding:"18px 20px",marginBottom:10}}>
                  <div style={{display:"flex",gap:12}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:12,color:"#64748B",flexShrink:0}}>{qi+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:500,color:"#0F172A",lineHeight:1.6,marginBottom:12}}>{q.text}</div>
                      <div style={{display:"flex",gap:10,marginBottom:a==="no"?12:0}}>
                        {["yes","no"].map(v=>(
                          <button key={v} onClick={()=>setAns(p=>({...p,[q.id]:v}))} style={{
                            padding:"8px 22px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",
                            border:`1.5px solid ${a===v?(v==="yes"?"#059669":"#DC2626"):"#E2E8F0"}`,
                            background:a===v?(v==="yes"?"#ECFDF5":"#FEF2F2"):"#F8FAFC",
                            color:a===v?(v==="yes"?"#059669":"#DC2626"):"#64748B"}}>
                            {v==="yes"?"✓ Yes":"✗ No"}
                          </button>
                        ))}
                      </div>
                      {a==="no"&&<div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:9,padding:"10px 14px",fontSize:12,color:"#7C2D12",lineHeight:1.6,display:"flex",gap:8}}><Warn s={14}/><span>{q.tip}</span></div>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
              <button onClick={()=>{if(sec>0){setSec(c=>c-1);top.current?.scrollIntoView({behavior:"smooth"});}}}
                disabled={sec===0} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:9,padding:"11px 22px",fontSize:14,fontWeight:500,color:sec===0?"#CBD5E1":"#374151",cursor:sec===0?"not-allowed":"pointer"}}>← Previous</button>
              <button onClick={()=>{if(sec<sections.length-1){setSec(c=>c+1);top.current?.scrollIntoView({behavior:"smooth"});}else go("lead");}}
                style={{background:"#0EA5E9",border:"none",borderRadius:9,padding:"11px 28px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer"}}>
                {sec===sections.length-1?"See My Score →":"Next Section →"}
              </button>
            </div>
          </div>
        )}

        {/* LEAD */}
        {screen==="lead"&&(
          <div style={{paddingTop:48,maxWidth:480,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontSize:40,marginBottom:10}}>🎯</div>
              <h2 style={{fontSize:24,fontWeight:600,color:"#0F172A",marginBottom:8}}>Your results are ready!</h2>
              <p style={{fontSize:14,color:"#64748B",lineHeight:1.7}}>Enter your details to get your grade, PDF certificate, full report, and personalised action plan — sent to your email instantly.</p>
            </div>
            <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"28px 24px"}}>
              {[
                {k:"name",   l:"Full Name *",                  p:"Your full name"},
                {k:"email",  l:"Email Address *",              p:"you@email.com"},
                {k:"phone",  l:"Phone Number *",               p:"+91 XXXXX XXXXX"},
                {k:"company",l:"Company / College (optional)", p:"Where you work or study"},
              ].map(f=>(
                <div key={f.k} style={{marginBottom:16}}>
                  <label style={{display:"block",fontSize:13,fontWeight:500,color:"#374151",marginBottom:6}}>{f.l}</label>
                  <input type={f.k==="email"?"email":"text"} placeholder={f.p} value={lead[f.k]}
                    onChange={e=>setLead(p=>({...p,[f.k]:e.target.value}))}
                    style={{width:"100%",padding:"10px 14px",fontSize:14,border:"1px solid #E2E8F0",borderRadius:9,outline:"none",boxSizing:"border-box",fontFamily:"inherit",color:"#0F172A"}}/>
                </div>
              ))}
              <button onClick={()=>{if(lead.name&&lead.email&&lead.phone)go("results");}}
                disabled={!lead.name||!lead.email||!lead.phone}
                style={{width:"100%",background:!lead.name||!lead.email||!lead.phone?"#CBD5E1":"#0EA5E9",border:"none",borderRadius:10,padding:"13px",fontSize:15,fontWeight:600,color:"#fff",cursor:!lead.name||!lead.email||!lead.phone?"not-allowed":"pointer",marginTop:4}}>
                Show My Cyber Safety Score →
              </button>
              <p style={{textAlign:"center",fontSize:11,color:"#94A3B8",marginTop:10,lineHeight:1.5}}>Your information is kept confidential and used only for sending your results and cybersecurity updates from Hackers InfoTech.</p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {screen==="results"&&(
          <div style={{paddingTop:36}}>
            <div style={{background:G.bg,border:`2px solid ${G.color}33`,borderRadius:20,padding:"32px 28px",textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:G.color,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Cyber Safety Grade · {date}</div>
              <div style={{fontSize:88,fontWeight:700,color:G.color,lineHeight:1,fontFamily:"'DM Mono',monospace"}}>{G.grade}</div>
              <div style={{fontSize:20,fontWeight:600,color:"#0F172A",marginTop:6}}>{G.label}</div>
              <div style={{fontSize:28,fontWeight:700,color:G.color,marginTop:4}}>{pct}%</div>
              <div style={{fontSize:14,color:"#64748B",marginBottom:10}}>{score} / {mx} points</div>
              <div style={{fontSize:14,color:"#374151",lineHeight:1.7,maxWidth:420,margin:"0 auto"}}>{G.desc}</div>
            </div>

            {/* Downloads + Email */}
            <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:"20px 22px",marginBottom:20}}>
              <h3 style={{fontSize:15,fontWeight:600,color:"#0F172A",margin:"0 0 16px"}}>📄 Your Certificate & Report</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <button onClick={()=>dlPDF("cert")} disabled={pdfSt==="loading"}
                  style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:10,padding:"12px",fontSize:13,fontWeight:600,color:"#7C3AED",cursor:"pointer"}}>
                  {pdfSt==="loading"?"⏳ Generating...":"🏅 Download Certificate"}
                </button>
                <button onClick={()=>dlPDF("report")} disabled={pdfSt==="loading"}
                  style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:10,padding:"12px",fontSize:13,fontWeight:600,color:"#1D4ED8",cursor:"pointer"}}>
                  {pdfSt==="loading"?"⏳ Generating...":"📋 Download Full Report"}
                </button>
              </div>
              <button onClick={sendEmail} disabled={mailSt==="sending"||mailSt==="sent"}
                style={{width:"100%",background:mailSt==="sent"?"#ECFDF5":mailSt==="error"?"#FEF2F2":"#0EA5E9",
                  border:`1px solid ${mailSt==="sent"?"#A7F3D0":mailSt==="error"?"#FCA5A5":"#0EA5E9"}`,
                  borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,
                  color:mailSt==="sent"?"#059669":mailSt==="error"?"#DC2626":"#fff",
                  cursor:mailSt==="sent"||mailSt==="sending"?"not-allowed":"pointer"}}>
                {mailSt==="idle"&&`📧 Email Report to ${lead.email}`}
                {mailSt==="sending"&&"⏳ Sending..."}
                {mailSt==="sent"&&`✅ ${mailMsg}`}
                {mailSt==="error"&&`❌ ${mailMsg}`}
              </button>
            </div>

            {/* Breakdown */}
            <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:"20px 22px",marginBottom:20}}>
              <h3 style={{fontSize:15,fontWeight:600,color:"#0F172A",margin:"0 0 16px"}}>Category Breakdown</h3>
              {sections.map(s=>{
                const sm=s.questions.reduce((a,q)=>a+q.w,0);
                const ss=s.questions.reduce((a,q)=>a+(ans[q.id]==="yes"?q.w:0),0);
                const sp=Math.round((ss/sm)*100);
                return <div key={s.id} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,color:"#374151",fontWeight:500}}>{s.icon} {s.title}</span>
                    <span style={{fontSize:13,fontWeight:600,color:sp>=80?"#059669":sp>=60?"#D97706":"#DC2626"}}>{sp}%</span>
                  </div>
                  <div style={{background:"#F1F5F9",borderRadius:99,height:7}}>
                    <div style={{background:sp>=80?"#059669":sp>=60?"#F59E0B":"#EF4444",height:7,borderRadius:99,width:`${sp}%`,transition:"width .6s"}}/>
                  </div>
                </div>;
              })}
            </div>

            {/* Action plan */}
            {failed.length>0&&(
              <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:"20px 22px",marginBottom:20}}>
                <h3 style={{fontSize:15,fontWeight:600,color:"#0F172A",margin:"0 0 4px"}}>Your Action Plan</h3>
                <p style={{fontSize:13,color:"#64748B",margin:"0 0 18px"}}>Fix these {failed.length} items to improve your score</p>
                {failed.map((q,i)=>(
                  <div key={q.id} style={{borderLeft:"3px solid #EF4444",paddingLeft:14,marginBottom:16}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#0F172A",marginBottom:4,lineHeight:1.5}}>{q.text}</div>
                    <div style={{fontSize:12,color:"#64748B",lineHeight:1.7}}><span style={{fontWeight:600,color:"#0EA5E9"}}>Fix: </span>{q.tip}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{background:"#0C1B2E",borderRadius:16,padding:"28px 24px",textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:600,color:"#F0F9FF",marginBottom:8}}>Want Hackers InfoTech to fix this for you?</div>
              <div style={{fontSize:13,color:"#94A3B8",marginBottom:22,lineHeight:1.7}}>Book a free 30-minute consultation. We will walk through your results and create a personalised cyber security plan.</div>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <a href={BRAND.bookingUrl} target="_blank" rel="noopener noreferrer"
                  style={{background:"#0EA5E9",color:"#fff",borderRadius:9,padding:"12px 24px",fontSize:14,fontWeight:600,textDecoration:"none"}}>
                  📅 Book Free 30-Min Call
                </a>
                <button onClick={()=>{setAns({});setSec(0);setMailSt("idle");go("type");}}
                  style={{background:"transparent",border:"1px solid #1E3050",color:"#94A3B8",borderRadius:9,padding:"12px 24px",fontSize:14,cursor:"pointer"}}>
                  Retake Assessment
                </button>
              </div>
              <div style={{marginTop:20,paddingTop:20,borderTop:"1px solid #1E3050",display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#64748B"}}>🌐 {BRAND.url}</span>
                <span style={{fontSize:12,color:"#64748B"}}>📞 {BRAND.phone}</span>
                <span style={{fontSize:12,color:"#64748B"}}>✉️ {BRAND.email}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
