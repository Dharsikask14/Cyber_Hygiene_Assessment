export const BRAND = {
  name: 'Hackers InfoTech',
  url: 'hackersinfotech.com',
  city: 'Coimbatore, India',
  phone: '+91 XXXXX XXXXX',
  email: 'thehackersinfotech@gmail.com',
  bookingUrl: 'https://calendly.com/hackersinfotech',
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  },
};

export const GENERAL_SECTIONS = [
  { id: 'mobile', icon: '📱', title: 'Mobile Phone Safety', questions: [
    { id: 'g1', w: 3, text: 'Do you have a screen lock (PIN / fingerprint / face lock) on your phone?', tip: 'Anyone can open your phone and access your photos, WhatsApp, and banking apps without a lock.' },
    { id: 'g2', w: 3, text: "Do you update your phone's software whenever updates are available?", tip: 'Old software has security holes hackers exploit silently. Enable auto-update in Settings.' },
    { id: 'g3', w: 3, text: 'Do you download apps ONLY from Google Play Store or Apple App Store?', tip: 'Apps from other websites can steal your contacts, photos, and banking details. No APK files from WhatsApp links.' },
    { id: 'g4', w: 2, text: 'Do you check app permissions before installing (e.g., a torch app asking for your contacts)?', tip: 'Apps can secretly read your messages, camera, and location. Ask: does this app really need this permission?' },
    { id: 'g5', w: 3, text: 'Do you avoid installing apps sent via WhatsApp links or unknown websites?', tip: 'This is the #1 way phones get hacked in India. Only use Play Store / App Store - always.' },
  ] },
  { id: 'passwords', icon: '🔑', title: 'Passwords & Account Security', questions: [
    { id: 'g6', w: 3, text: 'Do you use different passwords for WhatsApp, email, Facebook, and banking apps?', tip: 'If one password is stolen, ALL your accounts get hacked. Use Google Password Manager (free).' },
    { id: 'g7', w: 2, text: 'Is your password longer than 8 characters with numbers and symbols?', tip: 'Short/simple passwords are cracked in seconds. Example: Sun@2024#Kovai' },
    { id: 'g8', w: 3, text: 'Do you use Two-Step Verification / OTP login on WhatsApp, Gmail, and Facebook?', tip: 'Even if someone steals your password, 2-Step Verification stops them. Enable it NOW - free, 2 minutes.' },
    { id: 'g9', w: 3, text: 'Do you NEVER share your OTP with anyone - even if they claim to be from your bank?', tip: 'Banks NEVER ask for OTP by phone. Anyone asking for your OTP is a SCAMMER. Hang up immediately.' },
    { id: 'g10', w: 2, text: 'Do you avoid saving passwords on shared or public computers?', tip: 'Anyone using that computer can see your saved passwords. Always log out on shared devices.' },
  ] },
  { id: 'laptop', icon: '💻', title: 'Laptop & Computer Safety', questions: [
    { id: 'g11', w: 3, text: 'Are you using genuine/original Windows or macOS - NOT a cracked or pirated version?', tip: 'Pirated OS gets NO security updates. 80-90% of malware attacks target unpatched systems.' },
    { id: 'g12', w: 3, text: 'Do you have antivirus software installed and updated on your laptop?', tip: 'Windows Defender is free and built-in - make sure it is ON in Windows Security settings.' },
    { id: 'g13', w: 3, text: 'Do you download software ONLY from official websites?', tip: 'Fake download sites bundle malware with software. Always check the URL carefully.' },
    { id: 'g14', w: 3, text: 'Do you avoid using cracked or pirated software (Photoshop, Office, games)?', tip: 'Cracked software is the #1 source of ransomware in India. Use free alternatives: LibreOffice, GIMP.' },
    { id: 'g15', w: 2, text: 'Do you take backups of important files to an external drive or cloud (Google Drive)?', tip: 'Ransomware can delete ALL your files. Back up to Google Drive (free 15GB) or USB monthly.' },
  ] },
  { id: 'internet', icon: '🌐', title: 'Internet & Browsing Safety', questions: [
    { id: 'g16', w: 3, text: "Do you check if a website starts with 'https://' before entering your password or card details?", tip: "'http://' sites are not secure. NEVER enter passwords or card details on http:// sites." },
    { id: 'g17', w: 3, text: 'Do you avoid clicking links in SMS, WhatsApp, or email without verifying the sender?', tip: 'This is Phishing. If unsure, type the website address manually - never click the link.' },
    { id: 'g18', w: 3, text: 'Do you avoid connecting to unknown public Wi-Fi for banking or shopping?', tip: 'Public Wi-Fi is like shouting your password in a crowd. Use mobile data (4G/5G) for banking.' },
    { id: 'g19', w: 2, text: "Do you ignore pop-ups saying 'Your phone has a virus! Click here to clean it!'?", tip: 'These are FAKE pop-ups. Close the browser tab immediately. Never call any number shown.' },
    { id: 'g20', w: 3, text: "Do you check the full URL before clicking? (e.g., 'sbi-login.net' is FAKE - real is 'onlinesbi.sbi')", tip: 'Scammers create websites identical to real bank sites. Bookmark your bank and use only that.' },
  ] },
  { id: 'banking', icon: '💳', title: 'Online Payments & Banking', questions: [
    { id: 'g21', w: 3, text: 'Do you use only official bank apps from Play Store / App Store for UPI and net banking?', tip: 'Fake banking apps steal your credentials. Check the developer name carefully before installing.' },
    { id: 'g22', w: 3, text: "Do you verify UPI payment requests before approving - especially 'Collect Money' requests?", tip: "'Collect Money' means YOU are paying THEM. NEVER approve unexpected collect requests." },
    { id: 'g23', w: 3, text: 'Do you avoid screen-sharing while doing banking transactions?', tip: 'Any app with screen access can see your OTP and card numbers. Real banks NEVER ask for screen access.' },
    { id: 'g24', w: 2, text: 'Do you have transaction SMS alerts enabled for all your bank accounts?', tip: 'Enable alerts so you know instantly if any transaction happens. Report unknowns within 24 hours.' },
  ] },
  { id: 'scams', icon: '⚠️', title: 'Scam & Fraud Awareness', questions: [
    { id: 'g25', w: 3, text: 'Do you know that NO bank, government, or police will EVER ask for your OTP or PIN on a call?', tip: 'ANY call asking for OTP/PIN is a SCAM - 100% of the time. Hang up and block the number.' },
    { id: 'g26', w: 3, text: "Do you avoid 'KYC expiry', 'FASTag blocked', 'TRAI disconnecting your number' scam calls?", tip: 'Government/TRAI/bank NEVER calls for KYC over phone. Hang up. Block. Report on Sanchar Saathi.' },
    { id: 'g27', w: 2, text: "Do you avoid lottery/prize scams - 'You won Rs.50 lakh, send Rs.500 to claim'?", tip: 'No real prize ever asks you to pay first. Always a scam. Delete and block.' },
    { id: 'g28', w: 2, text: 'Can you identify a fake email? (wrong sender address, urgent language, suspicious link)', tip: "Check sender email carefully. Look for spelling errors and 'Verify NOW' urgency. Never click." },
  ] },
];

export const IT_SECTIONS = [
  { id: 'iam', icon: '🔐', title: 'Identity & Access Management', questions: [
    { id: 't1', w: 3, text: 'Do you use a password manager (Bitwarden, 1Password, KeePass) for all credentials?', tip: 'Reusing passwords is the #1 cause of account takeovers. Bitwarden is free & open-source.' },
    { id: 't2', w: 3, text: 'Is TOTP-based MFA (not just SMS) enabled on email, GitHub, cloud, and VPN accounts?', tip: 'SMS OTP can be SIM-swapped in India in under 2 hours. Use Google Authenticator or Authy.' },
    { id: 't3', w: 2, text: 'Do you use a separate non-admin account for daily browsing and work?', tip: 'Using an admin account daily means any malware runs with full system privileges.' },
    { id: 't4', w: 2, text: 'Do you audit and revoke unused OAuth/third-party app permissions regularly?', tip: 'Check myaccount.google.com/permissions - revoke all apps you no longer use.' },
    { id: 't5', w: 2, text: 'Do you use unique randomly-generated passwords (20+ characters) per service?', tip: 'Short/reused passwords are cracked via credential stuffing within hours of a breach.' },
  ] },
  { id: 'device', icon: '🖥️', title: 'Device & OS Hardening', questions: [
    { id: 't6', w: 3, text: 'Is your OS fully updated with the latest security patches applied within 30 days?', tip: 'Unpatched OS is the #1 attack vector. Enable Windows Update or macOS auto-update.' },
    { id: 't7', w: 3, text: 'Is full-disk encryption (BitLocker / FileVault / LUKS) enabled on your laptop?', tip: 'Physical theft = all data exposed without FDE. BitLocker is free on Windows Pro/Enterprise.' },
    { id: 't8', w: 2, text: 'Is Secure Boot enabled and BIOS protected with a password?', tip: 'Without Secure Boot, bootkits and rootkits can persist undetected across reinstalls.' },
    { id: 't9', w: 2, text: 'Do you disable unused services - Bluetooth off when not needed, SMBv1 disabled, RDP closed?', tip: 'Every open service is an attack surface. Close RDP port 3389 if you do not use remote desktop.' },
    { id: 't10', w: 2, text: 'Do you verify SHA256 file hashes when downloading tools/software from the internet?', tip: 'Compromised download mirrors serve malware-laced files. Always verify hash from official source.' },
  ] },
  { id: 'network', icon: '🌐', title: 'Network & Browser Security', questions: [
    { id: 't11', w: 3, text: 'Do you use a reputable VPN (ProtonVPN, Mullvad) on public or untrusted networks?', tip: "Public Wi-Fi enables trivial MITM attacks. Always use a paid, no-log VPN on networks you don't control." },
    { id: 't12', w: 3, text: "Have you changed your home router's default admin credentials and disabled WPS?", tip: 'Default credentials are public knowledge. Disable WPS - it has a known brute-force vulnerability.' },
    { id: 't13', w: 2, text: 'Do you use DNS-over-HTTPS (DoH) or a private encrypted DNS (1.1.1.1, 9.9.9.9)?', tip: 'Plain DNS leaks your browsing history and can be hijacked. Use NextDNS for system-wide encrypted DNS.' },
    { id: 't14', w: 2, text: 'Do you use browser security extensions like uBlock Origin and Privacy Badger?', tip: 'uBlock Origin (free) blocks 99% of malicious ads and scripts. Essential for any professional.' },
    { id: 't15', w: 2, text: 'Is your home/office Wi-Fi using WPA3 or at minimum WPA2-AES encryption?', tip: 'WEP and WPA (TKIP) are cracked in minutes. Check router settings - upgrade to WPA2-AES minimum.' },
  ] },
  { id: 'phishing', icon: '📧', title: 'Phishing & Social Engineering', questions: [
    { id: 't16', w: 3, text: 'Can you identify spear phishing emails that use your name, company, or role?', tip: 'Verify any unexpected request involving money, credentials, or access by calling the sender directly.' },
    { id: 't17', w: 2, text: 'Do you hover over links to verify the actual destination URL before clicking?', tip: "Displayed text can say 'paypal.com' while the actual link goes to 'paypa1.ru'. Always hover to check." },
    { id: 't18', w: 3, text: 'Do you avoid plugging in unknown USB drives received as gifts or found in public?', tip: 'A malicious USB can execute payloads within seconds of connection. Never plug in an unknown USB.' },
    { id: 't19', w: 2, text: "Have you verified your domain's DMARC, DKIM, and SPF records if you run a business email?", tip: 'Without DMARC, attackers can spoof your email domain to phish your clients.' },
  ] },
  { id: 'data', icon: '💾', title: 'Data Protection & Backup', questions: [
    { id: 't20', w: 3, text: 'Do you follow the 3-2-1 backup rule (3 copies, 2 media types, 1 offsite)?', tip: 'Ransomware encrypts local and network drives simultaneously. Only an offsite backup guarantees recovery.' },
    { id: 't21', w: 3, text: 'Is sensitive data encrypted before uploading to cloud?', tip: 'Encrypt sensitive files with Veracrypt (free) or 7-Zip AES-256 before uploading.' },
    { id: 't22', w: 2, text: 'Do you use secure deletion tools (Eraser / shred) instead of regular delete for sensitive files?', tip: 'Regular delete leaves data fully recoverable with free tools. Use Eraser (Windows) or shred (Linux).' },
    { id: 't23', w: 2, text: "Are your cloud storage sharing links set to 'Restricted' - not 'Anyone with the link'?", tip: 'Public Google Drive links get indexed by search engines and accessed by bots within hours.' },
  ] },
  { id: 'tools', icon: '🛡️', title: 'Security Tools & Monitoring', questions: [
    { id: 't24', w: 2, text: 'Do you monitor Have I Been Pwned for your email address in data breaches?', tip: 'Free at haveibeenpwned.com - enable breach alerts. You may already be compromised without knowing.' },
    { id: 't25', w: 2, text: 'Do you use VirusTotal to scan suspicious files and URLs before opening them?', tip: 'Free at virustotal.com - check against 70+ antivirus engines. Takes 10 seconds.' },
    { id: 't26', w: 2, text: 'Do you review installed browser extensions periodically and remove unknown ones?', tip: 'Malicious extensions read all your web traffic and passwords in real time.' },
    { id: 't27', w: 2, text: 'Are ALL installed applications (not just OS) kept up to date with auto-updates enabled?', tip: 'Use Patch My PC (Windows, free) to keep all applications updated automatically.' },
  ] },
  { id: 'cloud', icon: '☁️', title: 'Cloud & DevOps Security', questions: [
    { id: 't28', w: 3, text: 'Are your cloud accounts (AWS/GCP/Azure/personal) using MFA - not just passwords?', tip: 'Cloud account takeover leads to data theft plus unexpected billing. Enable MFA on root/admin accounts.' },
    { id: 't29', w: 3, text: 'Do you store API keys, tokens, and secrets in a secrets manager - NOT hardcoded in code?', tip: 'Hardcoded secrets in GitHub repos are found by bots within minutes of a push.' },
    { id: 't30', w: 2, text: 'Do you scan your public GitHub/GitLab repos for accidentally committed secrets?', tip: 'Use GitGuardian (free tier) or git-secrets to scan your repos.' },
    { id: 't31', w: 2, text: 'Do you review connected app sessions periodically on Google, Apple, and Microsoft accounts?', tip: 'Go to myaccount.google.com -> Security -> Your Devices. Revoke old sessions quarterly.' },
  ] },
];

export const ALL = {
  general: GENERAL_SECTIONS,
  it: IT_SECTIONS,
};

export function maxScore(type) {
  if (!ALL[type]) return 0;
  return ALL[type].reduce((sum, section) => sum + section.questions.reduce((acc, question) => acc + question.w, 0), 0);
}

export function getGrade(percent) {
  if (percent >= 95) return { grade: 'A+', label: 'Cyber Safe Champion', color: 'var(--grade-ap)', bg: 'var(--grade-ap-bg)', desc: 'Excellent! You follow best security practices. You are well protected.' };
  if (percent >= 85) return { grade: 'A', label: 'Very Good', color: 'var(--grade-a)', bg: 'var(--grade-a-bg)', desc: 'Strong security habits with only minor gaps to address.' };
  if (percent >= 75) return { grade: 'B+', label: 'Above Average', color: 'var(--grade-bp)', bg: 'var(--grade-bp-bg)', desc: 'Good effort, but a few risky habits remain that need attention.' };
  if (percent >= 65) return { grade: 'B', label: 'Average', color: 'var(--grade-b)', bg: 'var(--grade-b-bg)', desc: 'Moderate risk. You are vulnerable to common cyber attacks.' };
  if (percent >= 50) return { grade: 'C+', label: 'Below Average', color: 'var(--grade-cp)', bg: 'var(--grade-cp-bg)', desc: 'Several bad habits. You are an easy target for scammers and hackers.' };
  return { grade: 'C', label: 'High Risk', color: 'var(--grade-c)', bg: 'var(--grade-c-bg)', desc: 'Critical! Your accounts and data are in serious danger right now.' };
}
