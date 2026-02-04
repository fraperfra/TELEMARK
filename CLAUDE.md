# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ImmoCRM Telemarketing is a web-based real estate CRM for telemarketing teams. It provides lead scoring, call tracking, property management, and appointment scheduling for real estate sales agents.

**Stack:** React 19 + TypeScript + Vite + Supabase (PostgreSQL) + Tailwind CSS (CDN)

**Key Libraries:**
- **UI:** Radix UI primitives, Lucide icons, class-variance-authority
- **Forms:** react-hook-form + zod validation
- **Calendar:** FullCalendar (daygrid, timegrid, interaction)
- **Charts:** Recharts
- **Date:** date-fns
- **VoIP:** Twilio Voice SDK
- **AI:** OpenAI SDK
- **Payments:** Stripe

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Environment Setup

Create `.env.local` with (vedi `.env.example`):
```
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - per funzionalita avanzate
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_GEMINI_API_KEY=your_gemini_key
```

The app shows a setup screen if Supabase is not configured. Fallback credentials exist in `lib/supabase.ts` for demo purposes.

## Architecture

### Application Structure

- **SPA with client-side routing** - ViewState type in `types.ts` controls page switching
- **Centralized modal management** - App.tsx manages all modal state via ModalState interface
- **Props-based state flow** - Parent-child communication via callbacks (onOpenModal, onSelectOwner)

### Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Root component, routing logic, global modal state |
| `types.ts` | All TypeScript interfaces (Owner, Property, CallLog, Appointment) |
| `constants.tsx` | Mock data fallback and color palette |
| `lib/supabase.ts` | Supabase client configuration |
| `lib/utils.ts` | Utility functions (cn for Tailwind class merging) |
| `lib/openai.ts` | OpenAI client configuration |
| `lib/stripe.ts` | Stripe client configuration |
| `lib/twilio.ts` | Twilio Voice SDK setup |

### Pages (in `pages/`)

- `Dashboard.tsx` - KPI cards, call trends chart (recharts)
- `OwnersList.tsx` - Database-driven owner list with filtering; contains `INIT_DB_SQL` schema
- `OwnerDetail.tsx` - Owner profile with properties, calls, appointments tabs
- `CalendarPage.tsx` - Month/week/day appointment views
- `UploadPage.tsx` - CSV/XLSX import wizard with field mapping and validation
- `SettingsPage.tsx` - Profile, agency, team management

### Components (in `components/`)

- `Modals.tsx` - OwnerFormModal, CallModal, AppointmentModal (with timer)
- `Header.tsx` - Top navigation with search
- `Sidebar.tsx` - Left navigation menu

## Database Schema

Schema is defined in `OwnersList.tsx` (`INIT_DB_SQL` constant):

- `agents` - CRM user accounts
- `owners` - Property owners/leads (unique by taxCode)
- `properties` - Real estate linked to owners via owner_id
- `calls` - Call tracking with outcome enum
- `appointments` - Scheduled meetings (VISIT, CALL, VIDEO, SIGNING)

## Data Types

```typescript
LeadTemperature: 'HOT' | 'WARM' | 'COLD'
CallOutcome: 'INTERESTED' | 'CALL_BACK' | 'NOT_INTERESTED' | 'NO_ANSWER' | 'APPOINTMENT'
AppointmentType: 'VISIT' | 'CALL' | 'VIDEO' | 'SIGNING'
ViewState: 'DASHBOARD' | 'OWNERS_LIST' | 'OWNER_DETAIL' | 'CALENDAR' | 'UPLOAD' | 'SETTINGS'
ModalType: 'ADD_OWNER' | 'CALL_OWNER' | 'ADD_APPOINTMENT' | 'EDIT_OWNER' | 'BULK_CALL' | null
```

## Styling

- Tailwind CSS loaded via CDN in `index.html`
- Color palette in `constants.tsx`: primary (#3B82F6), success (#10B981), danger (#EF4444), warning (#F59E0B)
- Lead temperature colors: HOT (red), WARM (amber), COLD (blue)
- Responsive: sidebar collapses to icons on mobile (w-20 → md:w-64)

## Path Aliases

TypeScript path alias configured: `@/*` maps to project root (e.g., `import { Owner } from '@/types'`)
