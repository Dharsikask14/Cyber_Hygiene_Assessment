# Cyber Hygiene Assessment System

A professional, high-performance web application designed to evaluate and improve personal and professional cybersecurity posture. Built with a focus on modern aesthetics and data privacy, this tool helps users identify security gaps and provides actionable advice to mitigate risks.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?logo=vite)
![Compliance](https://img.shields.io/badge/Compliance-DPDP_Act_2023-green.svg)

---

##  Key Features

###  Smart Assessments
- **Dual Profiles**: Tailored questions for the **General Public** (mobile, banking, scams) and **IT & Tech Users** (IAM, Cloud, DevOps, Hardening).
- **Comprehensive Coverage**: 50+ weighted questions across 13 critical security domains.
- **Dynamic Grading**: Instant scoring system with grades from **A+ (Champion)** to **C (High Risk)**.

###  Professional Certification
- **Instant Certificate**: Automatically generates a high-quality PDF certificate upon completion.
- **Personalized Reports**: Detailed PDF reports with category-wise breakdowns and a custom **Action Plan**.
- **QR Code Verification**: Every certificate includes a unique QR code for instant authenticity verification.

###  Verification Suite
- **ID-Based Lookup**: Verify any certificate by its unique ID.
- **Camera Scanner**: Integrated QR scanner for quick mobile verification.
- **Secure Hashing**: Uses SHA-256 hashing to ensure certificate integrity.


##  Technology Stack

- **Frontend**: React.js (v19)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Premium design with glassmorphism and animations)
- **PDF Generation**: `jsPDF` & `html2canvas`
- **QR Codes**: `qrcode` & `jsQR`
- **Persistence**: `localStorage` (Privacy-first, client-side storage)
- **Email Integration**: EmailJS (Optional)

---

##  Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Cyber Hygiene Assessment"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
├── src/
│   ├── App.jsx            # Main application logic & routing
│   ├── components.jsx      # Reusable UI components (Nav, Page, etc.)
│   ├── data.js            # Assessment questions, grading logic & constants
│   ├── utils.js           # Helper functions (Hashing, URL building, etc.)
│   └── styles.css         # Global design system & animations
├── images/                # Brand assets and logos
├── html/                  # Legacy/Static assets (Internal redirects)
├── index.html             # Entry point
└── package.json           # Dependencies & scripts
```

---

## 🔒 Security & Privacy

- **No Backend Required**: The assessment logic and certificate generation happen entirely in the user's browser.
- **Client-Side Storage**: User data is stored in `localStorage` and never sent to a server unless explicit backend verification is configured.
- **Data Protection**: Designed to educate users on the Digital Personal Data Protection (DPDP) Act 2023.

