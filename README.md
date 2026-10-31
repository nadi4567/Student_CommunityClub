# Student Community Club

A campus club portal built with **React**, **Vite**, **Tailwind CSS**, and **React Router** (not Next.js). It ships with a **Laravel 8 (PHP) backend** (MySQL/XAMPP) so registrations and app state are persisted to MySQL instead of only `localStorage`.

## Run the database (XAMPP)
1. Start MySQL in XAMPP.
2. Create the database and import the schema + seed data:
   ```bash
   /Applications/XAMPP/xamppfiles/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS student_community_club;"
   /Applications/XAMPP/xamppfiles/bin/mysql -u root student_community_club < database.sql
   ```

## Run the backend (Laravel)
```bash
cd backend
/Applications/XAMPP/xamppfiles/bin/php artisan serve --host=127.0.0.1 --port=8000
```
The API is available at `http://127.0.0.1:8000/api/...` (`register`, `login`, `state`).  
Configure DB in `backend/.env` (defaults: `student_community_club`, user `root`, empty password).  
Frontend uses `VITE_API_URL` (defaults to `http://localhost:8000`).

> A lightweight `backend-php/` (PDO) implementation is kept as a fallback if Laravel cannot be run.

## Run the frontend
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | alex@example.com | student123 |
| Club leader | sarah@example.com | leader123 |
| Admin | admin@example.com | admin123 |

## What you can do
**Student** — register/login, browse and join clubs, register for events, submit a club-leader request, check request status, and receive approval/rejection notifications.

**Club leader** — create and edit their club, approve or reject membership requests, manage members, create and manage events, publish announcements.

**Admin** — review pending leader requests (applicant + proposed club), approve or reject, manage users and clubs, monitor reported content.
