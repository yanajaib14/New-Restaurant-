# 🍽️ New Restaurant Launch Dashboard

A shared launch-planning workspace for restaurant owners preparing a restaurant to open. It organizes the work leading up to opening day; it is not a day-to-day restaurant operations system.

## 🚀 Overview

This application serves as a central workspace for launch tasks, menu planning, vendors and inventory, hiring, and opening preparation.

### Key Features

-   **Dashboard & AI Assistant**: Review launch progress and use the AI assistant for task and menu analysis when configured.
-   **Task Board**: Categorized project management with critical path tracking and subtask checklists.
-   **Menu Planner & Cost Calculator**: Design your menu and analyze plate costs with real-time food cost percentage tracking.
-   **QuickBooks Placeholder**: Bookkeeping, receipts, and invoices belong in QuickBooks; the app currently reserves an empty placeholder. Menu costing remains a launch-planning tool.
-   **Operations Portal**: Manage vendors, inventory par levels, permits, and utilities in one place.
-   **Marketing & Training**: Plan your opening campaign and manage staff training modules with progress tracking.
-   **Talent & Hiring**: Manage roles, candidates, and trial shifts. The browser PIN is a convenience lock, not server authorization; sensitive hiring data is not protected by individual accounts yet.
-   **Cloud Integration**: Export your consolidated shopping lists and data directly to Google Drive.

## 🛠️ Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Icons**: Lucide React
-   **Backend**: Node.js, Express, Vercel API handlers
-   **Database**: Neon Postgres accessed through server-side `pg` routes; the browser does not receive database credentials
-   **Optional integrations**: Google Gemini and Google Drive

## 🗄️ Database setup

The target Neon project and branch are recorded in the ignored `.neon` file. The current setup is not connected to Neon yet: human Neon sign-in and environment network access are blocked, so no Neon connection strings are available and no migrations have been applied there.

See [docs/neon-setup.md](docs/neon-setup.md) for the exact recovery steps, environment variable handling, migrations, readiness checks, and observed setup errors. In brief, use the pooled `DATABASE_URL` for app requests and the direct `DATABASE_URL_UNPOOLED` only for migrations. Keep both server-side and out of `VITE_*` variables. Do not run `schema.sql`; use `npm run db:migrate` after Neon access is ready.

Neon database setup does not establish sign-in or secure partner permissions. The app currently uses a guest Owner identity and a client-side PIN gate.

## 📦 Getting Started

### Prerequisites

-   Node.js (v18+)
-   npm or yarn

### Installation

1.  Clone the repository
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Follow [Neon setup](docs/neon-setup.md) to sign in, deploy the declared database service, and pull its variables into ignored `.env.local`. Then run `npm run db:migrate` and `npm run db:check`. Do not copy placeholder connection values into a live environment.
4.  Launch the development server:
    ```bash
    npm run dev
    ```

## 🔒 Security

-   **Device PIN**: A browser-local convenience lock that hides views. It does not authorize database access; individual sign-in and backend workspace permissions are not configured yet.
-   **Lock Views**: The header action hides sensitive views on that browser; it does not revoke server access.

## 📂 Project Structure

-   `/src/App.tsx`: Main application logic and routing.
-   `/src/components/`: Modular UI components for each feature area.
-   `/src/services/`: Integration services for Gemini AI and Google Drive.
-   `/server.ts`: Express server configuration.

---

*Build with ❤️ to streamline the chaos of restaurant openings.*
