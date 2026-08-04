# Jacob (LocallyServe) - Web Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16%2B-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux-Toolkit-764abc.svg)](https://redux-toolkit.js.org/)

The **Jacob Web Frontend** (also known as *LocallyServe*) is a modern, responsive web application for the Jacob On-Demand Service & Gig Marketplace platform. Built with **Next.js 16 App Router**, **React 19**, and **Tailwind CSS v4**, this application delivers a fast, interactive experience for browsing services, booking gigs, managing provider storefronts, chatting in real-time, and handling orders.

---

## 📱 Ecosystem Screenshots & Visual Previews

The Jacob Web Portal integrates seamlessly with the Jacob mobile ecosystem:

<p align="center">
  <img src="../app/screenshots/1.png" width="19%" alt="Onboarding & Authentication" />
  <img src="../app/screenshots/2.png" width="19%" alt="Home Dashboard & Service Browsing" />
  <img src="../app/screenshots/3.png" width="19%" alt="Service Details & Booking" />
  <img src="../app/screenshots/4.png" width="19%" alt="Real-time Chat & WebRTC Calling" />
  <img src="../app/screenshots/5.png" width="19%" alt="Settings & Profile Management" />
</p>

---

## ✨ Key Features & Pages

### 🌐 Public & Landing Pages
* **Hero Showcase & Category Browsing (`/`):** Search bar, top-rated service providers, bundle offers, and interactive category shortcuts.
* **Category Catalog (`/categories`):** Explore all service categories and sub-categories with filtering options.
* **Gig Search & Details (`/services`, `/services/[id]`):** Search service listings with sorting, filters, package comparison tables, and pricing details.
* **Static & Institutional Pages:** `/about`, `/contact`, `/privacy`, `/terms`, `/affiliate`, `/success-stories`, and `/provider-help`.

### 🛒 Client Portal & Workflows
* **Multi-Step Service Booking (`/book`):** Book services with custom requirements, delivery date selection, and checkout flow.
* **Client Dashboard (`/client`):** Track ongoing and completed orders, view spending, and manage active service requests.
* **Post Custom Request (`/post-request`):** Clients can broadcast custom job descriptions to qualified service providers.

### 💼 Provider Portal & Onboarding
* **Provider Setup & Registration (`/join-provider`):** Multi-step onboarding form for freelancers and service professionals to set up storefronts.
* **Provider Dashboard (`/provider`):** Track earnings, active jobs, client requests, gig creation, and order deliverables.

### 💬 Real-Time Messaging & Notifications
* **Live Chat (`/messages`):** Real-time text messaging powered by Socket.io, with attachment support and conversation management.
* **Notification Center (`/notifications`):** In-app notification bell and activity feed for updates on orders and messages.
* **Resolution Center (`/resolution-center`):** Manage disputes and support tickets.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
* **Library:** [React 19](https://react.dev/)
* **Language:** TypeScript 5
* **Styling & Components:** Tailwind CSS v4, Radix UI primitives, `@base-ui/react`, Shadcn UI pattern components
* **Animations:** Framer Motion & `tw-animate-css`
* **Icons:** Lucide React & React Icons
* **State Management & Querying:** Redux Toolkit (`@reduxjs/toolkit`), RTK Query, React Redux
* **Real-time Engine:** `socket.io-client`
* **Form Handling & Validation:** `react-hook-form`, `@hookform/resolvers`, Zod
* **Mapping & Analytics:** Mapbox GL (`mapbox-gl`), Recharts for dashboard analytics charts
* **Toast Notifications:** Sonner

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the `jacob-frontend-web` root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Key Environment Variables (`.env.local`):

```env
# Base URL for the backend REST API
NEXT_PUBLIC_API_URL=http://localhost:5001

# Socket server URL for real-time messaging
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# Site URL for SEO and canonical links
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Auth Configuration
AUTH_SECRET=your_jwt_secret_here

# Maps / Geolocation
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key_here
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18+ 
* npm or yarn

### Installation & Development

1. **Navigate to the web project directory:**
   ```bash
   cd jacob-frontend-web
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📦 Build & Production

To compile and verify the production bundle:

```bash
# Build the production application
npm run build

# Start the production server
npm start

# Run code linter
npm run lint
```

---

## 📂 Project Structure

```text
jacob-frontend-web/
├── public/                 # Static assets, hero images, icons, robots.txt, sitemap
├── src/
│   ├── app/                # Next.js App Router routes & pages
│   │   ├── (auth)/         # Login & Signup routes
│   │   ├── about/          # About page
│   │   ├── affiliate/      # Affiliate program page
│   │   ├── book/           # Service booking flow
│   │   ├── categories/     # Category listing page
│   │   ├── client/         # Client portal dashboard
│   │   ├── contact/        # Contact us page
│   │   ├── join-provider/  # Provider onboarding flow
│   │   ├── messages/       # Real-time chat page
│   │   ├── notifications/  # User notification feed
│   │   ├── post-request/   # Client request post creation
│   │   ├── provider/       # Provider dashboard & gig management
│   │   ├── resolution-center/ # Dispute & ticket management
│   │   ├── services/       # Service search & gig detail pages
│   │   ├── layout.tsx      # Root application layout
│   │   └── page.tsx        # Main homepage landing screen
│   ├── components/         # Reusable UI components (Headers, Footers, Modals, Cards)
│   ├── contexts/           # React context definitions (AuthContext, SocketContext)
│   ├── data/               # Static mock data & constants
│   ├── lib/                # API client configuration, utils, and helpers
│   ├── providers/          # Global provider wrappers (Redux, Toast, Query)
│   ├── services/           # Service layer helper functions
│   ├── store/              # Redux slices and RTK Query API endpoints
│   └── types/              # TypeScript type interfaces & definitions
├── components.json         # Shadcn UI configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies and script declarations
└── tsconfig.json           # TypeScript configuration
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
