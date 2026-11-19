# Project Knowledge

## Overview

Student Community Club is a campus-club portal with a React single-page frontend and a Laravel JSON API. The frontend is in `Frontend/`; the Laravel application is in `backend/`. The intended database is MySQL, configured through Laravel's `.env`.

The application supports three roles:

- **Student:** browse clubs and events, request club membership, register for events, apply to lead a club, and view notifications/profile.
- **Club leader:** manage clubs, membership requests, events, and announcements.
- **Admin:** review leader requests and manage users, clubs, and reports.

## Repository map

```text
.
├── Frontend/
│   ├── src/
│   │   ├── components/       # Shared layout, navigation, cards, and UI
│   │   ├── lib/              # Types, demo seed, formatting, and shared store
│   │   ├── pages/            # Public, student, leader, and admin screens
│   │   ├── App.tsx           # Routes and client-side role guards
│   │   └── main.tsx          # React, router, and store bootstrap
│   ├── package.json
│   └── vite.config.ts
└── backend/
    ├── app/Http/Controllers/Api/ # JSON API handlers
    ├── app/Models/               # Eloquent models
    ├── database/migrations/      # Database schema
    ├── database/seeders/         # Demo users
    ├── routes/api.php            # API route declarations
    └── composer.json
```

## Frontend

- **Stack:** React 19, TypeScript, Vite, React Router 7, Tailwind CSS 4, and Lucide icons.
- `src/main.tsx` mounts the app under `BrowserRouter` and `StoreProvider`.
- `src/App.tsx` declares public routes (`/`, `/login`, `/register`) and application routes under `/app`. `GuestOnly` and `RequireRole` are client-side navigation guards.
- `src/pages/` contains the screens; `leader/` and `admin/` separate role-specific areas.
- `src/lib/types.ts` defines the frontend domain types and the aggregate `AppState`.
- `src/lib/seed.ts` supplies initial demo data and accounts. `src/lib/store.tsx` provides `useStore()`, state mutations, and API calls.
- The Vite alias `@` maps to `src/`; the dev server uses port `5173`.

The store initializes from browser `localStorage` (`scc-app-state-v4`) and tries to hydrate from `GET /api/state`. Its `persist` function writes local state and attempts `POST /api/state`. Login and registration call the backend; other features mix direct API calls with local store updates. The frontend API base URL is `VITE_API_URL`, defaulting to `http://localhost:8000`.

## Backend

- **Stack:** PHP 8.2+, Laravel 12, Eloquent, Laravel Sanctum dependency, and PHPUnit 11.
- `routes/api.php` maps endpoints to controllers in `app/Http/Controllers/Api/`.
- Controllers are grouped by concern: authentication, state, clubs, events, memberships, leader requests/actions, administration, notifications, and profiles.
- `app/Models/` contains models for users, clubs, club activities/members, events/registrations, membership and leader requests, announcements, notifications, and reports.
- `database/migrations/` creates the standard Laravel tables and the community-club schema. `DatabaseSeeder` inserts the five documented demo users.
- `bootstrap/app.php` registers API routing and CORS handling.
- `backend/.env.example` defaults to MySQL database `student_community_club` on `127.0.0.1:3306`, user `root`, with an empty password; adjust this for the local environment.

The schema is relational, while the frontend models the full domain as one `AppState` object. `StateController::show()` builds that aggregate from database records. Other endpoints read or mutate individual entities.

## Local development

1. Start MySQL and create the configured database.
2. In `backend/`, install dependencies, configure `.env`, generate the app key, run migrations, and seed demo accounts:

   ```bash
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve --host=127.0.0.1 --port=8000
   ```

3. In `Frontend/`, install dependencies and start Vite:

   ```bash
   npm install
   npm run dev
   ```

The API base URL can be overridden with `VITE_API_URL`. Demo credentials are listed in the root `README.md`.

## Build and tests

- Frontend production build: from `Frontend/`, run `npm run build`.
- Backend test suite: from `backend/`, run `composer test` (or `php artisan test`).
- The checked-in Laravel tests are the default example feature/unit tests; no dedicated frontend test script is defined in `Frontend/package.json`.

## Integration notes

The frontend/backend connection is currently hybrid and should be checked when changing persistence or workflows:

- `POST /api/state` is declared in `routes/api.php` and called by the frontend, but `StateController` currently implements `show()` only; there is no `update()` handler.
- The frontend submits leader applications to `/api/leader-requests/store`, while the route is `POST /api/leader-requests`.
- Frontend leader-request and leader-club fetch helpers omit the `user_id` parameter that their backend handlers require.
- Several frontend mutations update the local store and rely on the aggregate state POST rather than calling the corresponding entity-specific API endpoint.
- Most API routes do not use `auth:sanctum`; the `/api/user` route is the visible Sanctum-protected route. Some handlers use a client-supplied `user_id` for ownership checks, so client-side route guards should not be treated as backend authorization.

For database setup, use Laravel migrations and seeders. The root `README.md` also refers to importing `database.sql`, but no such file is present in the repository.
