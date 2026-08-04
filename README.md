# Jacob (JACO) - On-Demand Service & Gig Marketplace Ecosystem

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%2B-black.svg)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_54-blue.svg)](https://reactnative.dev/)
[![Express.js](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**Jacob (JACO)** is a comprehensive, production-grade on-demand service and gig marketplace ecosystem. Designed for seamless interaction between **Clients** searching for local/remote services and **Providers** managing their freelance services, Jacob features a cross-platform mobile application, a Next.js web application, and a real-time Express & Socket.io backend API.

---

## 📱 Mobile App Previews & Screenshots

Here is a preview of the Jacob Mobile application interface:

<p align="center">
  <img src="app/screenshots/1.png" width="19%" alt="Onboarding & Authentication" />
  <img src="app/screenshots/2.png" width="19%" alt="Home Dashboard & Service Browsing" />
  <img src="app/screenshots/3.png" width="19%" alt="Service Details & Booking" />
  <img src="app/screenshots/4.png" width="19%" alt="Real-time Chat & WebRTC Calling" />
  <img src="app/screenshots/5.png" width="19%" alt="Settings & Profile Management" />
</p>

---

## 🏗️ Architecture & Monorepo Structure

The repository is structured into three primary sub-applications:

```text
jacob-app/
├── 📱 app/                  # Cross-platform Mobile Application (React Native & Expo)
├── 🌐 jacob-frontend-web/  # Modern Web Portal & Landing Application (Next.js 16 App Router)
└── ⚡ backend/             # Real-time REST & WebSocket Server (Node.js, Express, MongoDB, Socket.io)
```

### 📱 1. Mobile Application (`/app`)
* **Framework:** React Native + Expo (SDK 54) with Expo Router (File-based navigation)
* **Styling:** NativeWind (Tailwind CSS)
* **Real-time & Media:** Socket.io client, WebRTC Audio/Video calls (`react-native-webrtc`), Mapbox (`expo-location`)
* **State Management:** Redux Toolkit & RTK Query
* **Features:** Dual mode (Client & Provider), location-based service browsing, instant messaging, P2P video/voice calling, order management, profile customization.

### 🌐 2. Frontend Web Application (`/jacob-frontend-web`)
* **Framework:** Next.js 16 (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS v4, Radix UI / Shadcn UI components, Framer Motion
* **Real-time & Visuals:** Socket.io client, Recharts, Lucide React, Mapbox GL
* **Features:** Interactive home landing, gig discovery & search filters, multi-step booking process, provider onboarding flow, client dashboard, custom service request posting, real-time messaging, support resolution center.

### ⚡ 3. Backend REST & Real-Time Server (`/backend`)
* **Runtime & Database:** Node.js, Express 5, MongoDB (Mongoose ORM)
* **Real-time Engine:** Socket.io for instant chat and WebRTC audio/video signaling
* **Authentication & Security:** JWT (Access & Refresh tokens), bcryptjs, OTP Email Verification via Nodemailer, Google OAuth verification
* **Integrations:** Stripe Payment & Webhook processing, Cloudinary media storage, Multer file uploads, node-cron background jobs (Order reminders, auto-completion).

---

## ✨ Key Features Across the Ecosystem

* 👥 **Dual User Roles (Client & Provider):** Seamless switching between buying services and listing professional gigs.
* 💬 **Real-time Communication:** Instant socket messaging and integrated P2P WebRTC voice/video calling.
* 🗺️ **Geolocation & Mapping:** Interactive Mapbox integration to discover providers and local services nearby.
* 🔐 **Secure Authentication:** Email signup with 4-digit OTP verification, password reset, and dynamic Google OAuth sign-in.
* 📦 **Gig & Service Catalog:** Multi-category browsing, search filters, price tiers, and package management.
* 💳 **Payment & Escrow System:** Stripe integration for secure client checkouts and provider withdrawals.
* 📑 **Custom Service Requests:** Clients can post custom job requests and providers can send custom proposals.
* 🛡️ **Resolution Center:** Built-in dispute handling and support ticket system.

---

## ⚙️ Prerequisites & Environment Setup

Ensure you have the following installed on your development system:
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher) or **yarn** / **pnpm**
* **MongoDB** (Local instance or MongoDB Atlas connection URI)
* **Expo Go** app or Android/iOS Emulator (for mobile app testing)

---

## 🚀 Quick Start Guide

Follow these steps to run the complete Jacob ecosystem locally.

### Step 1: Start the Backend Server

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create a .env file (Copy from .env.example)
cp .env.example .env

# 4. Start the backend development server (Default PORT: 5001)
npm run dev
```

*The backend API will be available at `http://localhost:5001` with Socket.io running on the same port.*

---

### Step 2: Start the Web Frontend

```bash
# 1. Open a new terminal and navigate to the web directory
cd jacob-frontend-web

# 2. Install dependencies
npm install

# 3. Create a .env.local file (Copy from .env.example)
cp .env.example .env.local

# 4. Run the Next.js development server
npm run dev
```

* Open [http://localhost:3000](http://localhost:3000) in your browser to view the web application.*

---

### Step 3: Start the Mobile Application

```bash
# 1. Open a new terminal and navigate to the mobile app directory
cd app

# 2. Install dependencies
npm install

# 3. Create a .env file (Copy from .env.example)
cp .env.example .env

# 4. Start the Expo development server
npm run start
```

* **Android:** Press `a` in the terminal to launch on an Android emulator or device.
* **iOS:** Press `i` to launch on the iOS simulator.
* **Expo Go:** Scan the QR code in the terminal using the Expo Go mobile app.

---

## 📡 Core API & Socket Overview

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Health Check** | `GET /api/health` | Check API server status |
| **Auth & OTP** | `/api/auth/*` | Signup, OTP verify, Login, Refresh token, Password reset |
| **Gigs & Services** | `/api/gigs/*` | Fetch, create, update, search gigs |
| **Orders** | `/api/orders/*` | Create orders, manage status, submit deliverables |
| **Chats & WebRTC** | `/api/chats/*` | Fetch conversations, message logs, file attachments |
| **Service Requests**| `/api/service-requests/*` | Post custom client requests & provider proposals |
| **Withdrawals** | `/api/withdrawals/*` | Provider payout requests |
| **Support** | `/api/support/*` | Create support & resolution tickets |

---

## 📄 Sub-System Documentation

For detailed information on individual modules, refer to their dedicated README files:
* 📱 **[Mobile App README](file:///C:/Users/mdnab/Desktop/jacob-app/app/README.md)**
* 🌐 **[Web Frontend README](file:///C:/Users/mdnab/Desktop/jacob-app/jacob-frontend-web/README.md)**
* ⚡ **[Backend API README](file:///C:/Users/mdnab/Desktop/jacob-app/backend/README.md)**

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
