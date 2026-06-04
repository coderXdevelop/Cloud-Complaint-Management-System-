# Project Report: Cloud-Based Campus Complaint Management System (CMS)

A modern, real-time web application designed to streamline, track, and automate student complaint resolution on university campuses.

---

## 1. Project Title
**Cloud-Based Campus Complaint Management System (CMS)**

---

## 2. Problems Solved
Traditional campus complaint handling suffers from lack of transparency, slow resolution speeds, manual routing bottlenecks, and lack of accountability. This project addresses these challenges through the following solutions:

* **SLA & Automated Escalations**: Solves the issue of complaints lying unattended. The system maps specific Service Level Agreement (SLA) hours to complaint categories (e.g., IT/Network: 24h, Hostel: 12h, Academics: 72h). Overdue tickets are automatically flagged as **Escalated** via real-time dashboard indicators.
* **Department-Based Queue Routing**: Eliminates manual delegation overhead. Admins are bound to specific departments (e.g. IT, Hostel, Academics) and only see complaints relating to their scope, while Super Admins retain global visibility.
* **Audit Transparency (Visual Timeline)**: Resolves student anxiety regarding status updates. A chronological, visual timeline documents every action—from initial submission and notes added by admins, to final resolution and student feedback.
* **Performance Accountability (Leaderboard)**: Computes administrator metrics (average resolution times, total tickets resolved, and satisfaction scores) into a live leaderboard to incentivize faster resolution.
* **Cloud Storage Reliability**: Fixes the issue of ephemeral cloud file loss. Uploaded evidence images are stored on a persistent cloud CDN rather than the server's local storage.
* **Self-Healing Deployment**: Automates database provisioning. On deployment, the server checks the database, compiles the missing tables, runs schema migrations, and seeds default administrators with zero setup required.

---

## 3. Tech Stack & Cloud Services Used

### Core Development Stack
* **Frontend**: React (Vite SPA framework), Tailwind CSS (Modern, responsive, dark-mode adaptive UI), Axios (API integration), Lucide React (Iconography).
* **Backend**: Node.js with Express.js, Socket.io (Real-time dashboard updates & notifications), JWT (Stateless authentication), Bcryptjs (Secure password hashing).
* **Database**: MySQL (Relational schema enforcing strict foreign-key constraints).

### 100% Free-Tier Cloud Ecosystem
* **Aiven.io (Managed MySQL)**: Hosts the relational database on a secure, managed cloud cluster utilizing SSL encryption.
* **Cloudinary (Object Storage)**: Serves as the Content Delivery Network (CDN) to store and retrieve complaint attachment images.
* **Brevo (Transactional Email)**: Delivers instant registration OTPs, password reset links, and complaint status updates to user mailboxes.
* **Render (Backend Hosting)**: Hosts the Node.js API server, deploying automatically from Git pushes.
* **Vercel (Frontend Hosting)**: Configures global CDN hosting for the Vite React frontend with instant Git build pipelines.

---

## 4. Conclusion
The **Cloud-Based Campus Complaint Management System** bridges the communication gap between university students and administrations. By shifting from a local, file-bound server to a 100% free cloud-native architecture (Vercel, Render, Aiven, Cloudinary, and Brevo), the application achieves high availability, secure data routing, and instant feedback loops at zero subscription cost.

It serves as a scalable template for modern campus governance, ensuring every student concern is routed to the correct resolver, tracked under strict deadlines, and audited transparently.
