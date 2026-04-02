# Applicant Manager — Quick Start

1. Start Apache & MySQL in XAMPP.
2. Copy the `applicant-manager` folder into `htdocs`.
3. Import database:
   - Open phpMyAdmin → create DB `school_db`.
   - Run `migrations/init.sql`.
4. Configure DB credentials in `config/db.php` if needed.
5. Seed users:
   - Visit `http://localhost/applicant-manager/public/install_seed.php` once → you should see a success message.
   - Delete `install_seed.php` for security.
6. Open `http://localhost/applicant-manager/public/` → login with:
   - Admin: `admin` / `password`
   - Manager: `user` / `password`
