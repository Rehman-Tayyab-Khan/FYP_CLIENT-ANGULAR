# Smart HMS

Smart HMS is a patient-management system composed of an Angular web client, an Express API, and a Laravel API. The services share a MySQL database; Laravel owns database migrations while Express connects through Sequelize.

## Project structure

```text
Patient-Management-System-main/
├── client/           Angular 19 web application
├── express-service/  Express 5 / TypeScript API (port 4001)
└── laravel-service/  Laravel 12 API and database migrations (port 8000)
```

## Prerequisites

- Node.js and npm
- PHP 8.2 or newer
- Composer
- MySQL 8 or compatible MySQL server

## Configuration

Environment files are intentionally not committed. Create local copies from the templates:

```powershell
Copy-Item Patient-Management-System-main\express-service\.env.example Patient-Management-System-main\express-service\.env
Copy-Item Patient-Management-System-main\laravel-service\.env.example Patient-Management-System-main\laravel-service\.env
```

Update both files with your local database settings. The default database name is `patient_management`. Set strong, unique values for `JWT_SECRET` and `SSN_ENCRYPTION_KEY`; do not reuse the example placeholders. Configure `GEMINI_API_KEY` only if the Gemini-backed functionality is required.

The Angular development build is preconfigured to use:

- Express API: `http://localhost:4001/api`
- Laravel API: `http://localhost:8000/api`

To use different URLs, update `client/src/environments/environment.development.ts`.

## Install and run

Open three PowerShell windows from the repository root.

### 1. Laravel API and migrations

```powershell
cd Patient-Management-System-main\laravel-service
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The Laravel API runs at `http://localhost:8000`.

### 2. Express API

```powershell
cd Patient-Management-System-main\express-service
npm install
npm run dev
```

The Express API runs at `http://localhost:4001` and connects to the MySQL database configured in its `.env` file.

### 3. Angular client

```powershell
cd Patient-Management-System-main\client
npm install
npm start
```

Open `http://localhost:4200` in a browser.

## Build and test

```powershell
# Angular production build
cd Patient-Management-System-main\client
npm run build

# Express production build and start
cd ..\express-service
npm run build
npm start

# Laravel tests
cd ..\laravel-service
php artisan test
```

## Security and Git hygiene

The root `.gitignore` excludes local `.env` files, dependencies, generated build output, logs, and common IDE files. The repository includes `.env.example` templates only; they contain placeholders and no usable credentials.

Before pushing changes, verify that no local environment files are staged:

```powershell
git status --ignored
git ls-tree -r --name-only HEAD | Select-String '(^|/)\.env$'
```

If a secret is ever committed, rotate it immediately. Removing it from a later commit does not remove it from Git history.
