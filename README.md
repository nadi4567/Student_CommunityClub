# Student Community Club

Campus club portal with **React + Vite + Tailwind** (`Frontend/`) and **Laravel + MySQL** (`backend/`).

## Roles

| Role | What they do |
| --- | --- |
| **Student** | Register/login, profile, browse clubs/events, join requests, event registration, announcements, notifications, history, apply to be a leader |
| **Club leader** | Manage **own** club only: members, join requests, events, registrations, attendance, announcements, club reports |
| **Admin** | Users, clubs, leader applications, all events, platform announcements, reports, analytics |

## 1. Import database (phpMyAdmin)

1. Start **XAMPP** → start **MySQL** (and Apache if you use phpMyAdmin).
2. Open phpMyAdmin → **Import**.
3. Choose the file at the project root: `database.sql`
4. Click **Go**.

Or from terminal:

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database.sql
```

Demo accounts (passwords are bcrypt-hashed in MySQL; use these plain passwords to log in):

| Role | Email | Password |
| --- | --- | --- |
| Student | alex@example.com | student123 |
| Club leader | sarah@example.com | leader123 |
| Admin | admin@example.com | admin123 |

## 2. Run Laravel API

```bash
cd backend
composer install
cp .env.example .env   # if needed
# Ensure .env has:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=student_community_club
# DB_USERNAME=root
# DB_PASSWORD=
# DB_SOCKET=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock   # macOS XAMPP
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

API: `http://127.0.0.1:8000/api/...`

## 3. Run React frontend

```bash
cd Frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).  
Optional: set `VITE_API_URL=http://127.0.0.1:8000` in `Frontend/.env`.

## Project layout

```text
StudentCommunity_Club/
├── database.sql          # Full MySQL schema + seed for phpMyAdmin
├── Frontend/             # React UI
└── backend/              # Laravel API
```

## Student checklist

- Register / login / logout  
- View & update profile  
- Browse clubs & club details  
- Request join / cancel pending request / view joined clubs  
- Browse events, register / cancel, view event details  
- View club announcements & notifications  
- Participation history  
- Apply for club leader & track status  

## Club leader checklist (own club only)

- Edit club info / logo / cover  
- Members, join requests (approve/reject), remove members  
- Create / edit / delete events, capacity, registrations, attendance  
- Announcements (create / edit / delete) + member notifications  
- Dashboard stats & club reports  

## Admin checklist

- Users: list, ban/unban, roles  
- Clubs: list, create, edit, delete, assign leaders  
- Leader applications: approve / reject  
- All events monitor / delete  
- Platform announcements  
- Reports & analytics  

If login works but phpMyAdmin shows no new users, Laravel is not using MySQL — fix `backend/.env` `DB_*` and restart `php artisan serve`.
