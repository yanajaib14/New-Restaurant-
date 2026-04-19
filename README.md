# 🍽️ New Restaurant Launch Dashboard

A professional, full-stack operational dashboard designed for restaurant entrepreneurs and managers to track every aspect of a new restaurant opening.

## 🚀 Overview

This application serves as a central mission control for restaurant launches. It bridges the gap between high-level project management and granular operational checklists, financials, and team coordination.

### Key Features

-   **Dashboard & AI Assistant**: Get a high-level overview of completion status and use the Gemini-powered AI assistant for smart analysis of your tasks and menu.
-   **Task Board**: Categorized project management with critical path tracking and subtask checklists.
-   **Menu Planner & Cost Calculator**: Design your menu and analyze plate costs with real-time food cost percentage tracking.
-   **Financial Console**: Track startup (TI, Equipment, Inventory) and operating costs (Payroll, Rent) with progress tracking.
-   **Operations Portal**: Manage vendors, inventory par levels, permits, and utilities in one place.
-   **Marketing & Training**: Plan your opening campaign and manage staff training modules with progress tracking.
-   **Talent & Hiring**: A secure (PIN-protected) hiring portal to manage roles, candidates, and trial shifts.
-   **Cloud Integration**: Export your consolidated shopping lists and data directly to Google Drive.

## 🛠️ Tech Stack

-   **Frontend**: React 18, TypeScript, Tailwind CSS
-   **Icons**: Lucide React
-   **AI**: Google Gemini API (@google/genai)
-   **Backend**: Node.js (Express) with Vite integration
-   **Storage**: Google Drive API integration

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
3.  Set up your environment variables (see `.env.example`):
    ```bash
    cp .env.example .env
    ```
4.  Launch the development server:
    ```bash
    npm run dev
    ```

## 🔒 Security

-   **PIN Protection**: Sensitive areas like Hiring and Financials are protected by a configurable security PIN.
-   **Lockdown Mode**: Quick manual lockdown button in the header to secure sensitive data immediately.

## 📂 Project Structure

-   `/src/App.tsx`: Main application logic and routing.
-   `/src/components/`: Modular UI components for each feature area.
-   `/src/services/`: Integration services for Gemini AI and Google Drive.
-   `/server.ts`: Express server configuration.

---

*Build with ❤️ to streamline the chaos of restaurant openings.*
