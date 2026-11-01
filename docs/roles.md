# 👥 Team Roles & Responsibilities

This document defines the organizational structure, functional specializations, component ownership, and responsibility assignment matrix (RACI) for the **iMovies** movie ticket booking platform development lifecycle.

---

## 1. Team Role & Contribution Breakdown

| Role Title | Core Specialization | Primary Responsibilities | Key Modules Owned | Tech Stack & Tools | Deliverables |
|---|---|---|---|---|---|
| **Principal Full-Stack Architect** | System Architecture & Core Engineering | • Overall platform architectural design<br>• Decoupled MVC design pattern implementation<br>• End-to-end integration across Client, Server, and Database | • `server/server.js`<br>• `client/src/App.jsx`<br>• Project configuration & environment setups | Node.js, Express, React 18, Vite, REST APIs | Complete architectural blueprint, core framework integration, performance optimizations |
| **Lead Frontend Engineer & UI/UX Architect** | Presentation Layer & Interaction Design | • Amazon Prime Video dark aesthetic implementation (`#0f171e`, `#1a242f`, `#00a8e1`)<br>• Responsive layout & horizontal carousels<br>• Interactive tier-based seat selection maps<br>• Digital cinema boarding pass UI with QR/barcode | • `client/src/components/`<br>• `client/src/pages/`<br>• `client/src/index.css`<br>• `client/src/components/SeatMap.jsx`<br>• `client/src/components/DigitalTicketPass.jsx` | React 18, Tailwind CSS, Lucide Icons, Vite, HTML5 Canvas / QR | 16+ responsive views, animated hero billboards, print media stylesheets, cinema pass |
| **Backend & REST API Architect** | Server Logic & Business Workflows | • Express.js REST API controller development<br>• 10-minute TTL seat locking engine<br>• Real-time showtime expiry validation filters<br>• Dynamic 7-day venue matrix auto-provisioning | • `server/controllers/`<br>• `server/routes/`<br>• `server/utils/timeUtils.js`<br>• `server/controllers/bookingController.js`<br>• `server/controllers/showController.js` | Node.js, Express.js, JavaScript (ES6+), UUID, Mongoose ODM | REST endpoints, seat locking mechanism, show auto-scheduler, expiry validator |
| **Database & Data Modeling Engineer** | Schema Design & Data Integrity | • MongoDB data modeling using Mongoose ODM<br>• Schema design for Users, Admins, Movies, Shows, Theatres, Bookings, Reviews, Favorites<br>• Indexing strategies & polymorphic TMDB references | • `server/models/`<br>• `server/seed.js`<br>• `docs/diagrams/er-diagram.md` | MongoDB, Mongoose, MongoDB Compass, BSON | 8 Mongoose schemas, compound unique indexes, seed dataset, ER documentation |
| **Security & Payment Gateway Engineer** | Authentication & Financial Transactions | • Dual role authentication (User & Admin JWT)<br>• Bcrypt password encryption & salt generation<br>• Official Razorpay v1 Payment Gateway integration<br>• HMAC SHA-256 cryptographic signature verification | • `server/middleware/`<br>• `server/controllers/paymentController.js`<br>• `client/src/utils/loadRazorpay.js`<br>• `client/src/context/AuthContext.jsx` | Razorpay API, Crypto (Node.js), JWT, Bcrypt.js, Axios Interceptors | Payment order generation, signature validation, protected routes, security guards |
| **Communications & Integration Specialist** | Third-Party Integrations & Messaging | • Brevo (Sendinblue) transactional email setup<br>• 6-digit registration OTP & activation links<br>• Password recovery email workflows<br>• Automated HTML digital ticket receipt dispatch<br>• Official TMDB v3 cinema streaming integration | • `server/services/emailService.js`<br>• `server/config/emailConfig.js`<br>• `client/src/api/tmdb.js`<br>• `client/src/components/TrailerModal.jsx` | `@getbrevo/brevo`, TMDB API (v3), Axios, YouTube IFrame API | Transactional email templates, OTP gate, TMDB cinema feed, trailer player |
| **QA, Testing & DevOps Engineer** | Quality Assurance, Testing & Deployment | • End-to-end integration testing and automated verification scripts<br>• GitHub repository setup, branching, and secret sanitation<br>• Vite production build verification and cross-browser testing | • `server/test-features.js`<br>• `server/test-show-flow.js`<br>• `server/test-email.js`<br>• `.gitignore`<br>• GitHub Actions / CI Configuration | Git, GitHub, Node test runners, Vite compiler, PowerShell | Automated test suites, clean build artifacts, synchronized GitHub repository |

---

## 2. RACI Responsibility Assignment Matrix

The RACI matrix below defines the participation role of each discipline for core functional milestones:
- **R (Responsible)**: The team member who performs the activity to achieve the deliverable.
- **A (Accountable)**: The sole decision-maker who approves the final deliverable.
- **C (Consulted)**: Subject matter experts providing critical inputs and feedback.
- **I (Informed)**: Team members kept updated on progress and completions.

| Feature / Milestone | Full-Stack Architect | Frontend Engineer | Backend Architect | Database Engineer | Security & Payment | Integration Specialist | QA & DevOps |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Official TMDB v3 API Integration** | A | R | C | C | I | R | I |
| **Amazon Prime Video Dark Aesthetic & Carousels** | A | R | I | I | I | I | C |
| **Real-Time Seat Map (Lower to Balcony Hierarchy)** | A | R | C | C | I | I | C |
| **10-Minute Seat Locking TTL Mechanism** | A | C | R | R | C | I | R |
| **Real-Time Past Showtime Expiry Validation** | A | R | R | C | I | I | R |
| **Razorpay Payment Gateway & HMAC Validation** | A | C | C | C | R | I | R |
| **Brevo Transactional Email Service (OTP & Receipts)** | A | C | C | I | C | R | R |
| **Digital Cinema Boarding Pass (QR & PDF Print)** | A | R | C | I | C | C | R |
| **Admin Dashboard & Analytics Engine** | A | R | R | C | C | I | I |
| **Database Modeling & Compound Indexing** | A | I | C | R | C | I | C |
| **System Architecture & Repository Documentation** | R | C | C | C | C | C | A |
| **GitHub Deployment & Secret Hygiene** | A | I | I | I | C | I | R |

---

## 3. Communication & Governance Standards

1. **Version Control Protocol**:
   - Feature branches follow semantic naming: `feature/<module-name>`, `fix/<issue-name>`, and `docs/<topic>`.
   - All commits adhere to Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
2. **Environment & Secret Hygiene**:
   - Zero hardcoded credentials in tracked files.
   - `.env.example` templates maintained in both `client/` and `server/` with descriptive placeholders.
   - `.gitignore` enforces exclusion of local keys, builds (`dist/`), and dependencies (`node_modules/`).
3. **API Contract Alignment**:
   - All REST controllers follow the standardized success/error JSON response contracts documented in `docs/architecture.md`.
4. **Code Quality & Build Gates**:
   - Every release candidate must pass `vite build` without errors or bundle warnings.
   - Core regression suites (`test-features.js`, `test-show-flow.js`, `test-email.js`) must exit with code `0`.
