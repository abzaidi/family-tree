# Bilingual Family Tree Web Application

An interactive, responsive, and bilingual (English/Urdu) Family Tree explorer web application built using **Next.js 16 (App Router)**, **React Flow (XYFlow)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

## Key Features
- **Infinite Canvas Navigation**: Pan, zoom, and auto-fit family structures.
- **Relational Tree Layout**: Custom layout engine supporting multiple spouses, child unions, and dynamic expansion/collapse.
- **Bilingual Interface**: Seamless switch between English and Urdu with automatic RTL/LTR directionality changes and Noto Nastaliq Urdu typeface.
- **Secure Architecture**: RLS policies for read/write roles (viewer, editor, admin) paired with audit logs on all write database actions.

---

## Getting Started

### 1. Database Setup
1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new project.
3. Open the **SQL Editor** in the dashboard and run the entire contents of the `migrations/supabase-schema.sql` file provided in this repository. 
   - This sets up the schema tables: `persons`, `unions`, `union_children`, `user_roles`, `audit_log`, and `app_config`, along with indices, audit log triggers, and helper permissions.
4. Execute the following command for your admin user UUID to grant edit permissions:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('YOUR_USER_UUID_HERE', 'admin');
   ```
5. If you already ran an older schema before admin user management existed, also run
   `migrations/supabase-admin-users.sql` once in the SQL Editor. Fresh installs that
   used the current `supabase-schema.sql` already include these functions and triggers.
6. Existing projects should run `migrations/supabase-user-names.sql` once to add names
   to the admin user list and backfill the initial account. New signups store their
   full name in Supabase Auth metadata automatically.
7. Existing projects should also run `migrations/supabase-fix-audit-update.sql` once,
   which fixes the audit trigger so updates to unions (e.g. linking a spouse to
   existing children) don't fail.
8. Existing projects should also run `migrations/supabase-fix-soft-delete.sql` once,
   which fixes the persons SELECT policy so editors can soft-delete nodes.

### 2. Environment Configuration
1. Rename/copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Populate the parameters in `.env.local` using the keys from your Supabase Project Settings API page:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Installation & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure
- `src/app/` — Pages and layout routers, including `/`, `/login`, `/signup`, and `/admin/users`.
- `src/components/` — UI modular components:
  - `admin/` — Admin-only user management UI.
  - `nav/` — Search interface, Language Toggle, and User Menus.
  - `panels/` — Details drawer, add/edit/delete modals.
  - `tree/` — React Flow Canvas and Custom Node layers (`PersonNode`, `UnionNode`).
- `src/hooks/` — Data client hooks (`useAuth`, `usePersons`, `useUnions`).
- `src/lib/` — Shared libraries, i18n configurations, and the `tree/` layout routing engine.
- `src/store/` — Zustand global tree rendering states.
- `src/types/` — Global TypeScript definitions.
- `migrations/` — PostgreSQL schema, RLS updates, admin user RPCs, and test seed/cleanup scripts.
