
# Sweety - Blood Glucose Tracker

A full-stack blood glucose tracking application built using React, Node.js, Express and PostgreSQL.

## Live Application

- **Frontend:** https://sweety-frontend-jr14.onrender.com/
- **Backend API:** https://sweety-glucose-tracker-project.onrender.com/
- **GitHub:** https://github.com/Phaneendra-allam/sweety-glucose-tracker-project

## Features

### Patient Features
- Patient registration and login
- Secure password hashing using bcrypt
- JWT authentication
- Add, view, edit and delete glucose readings
- Four daily reading slots:
  - Morning
  - After breakfast
  - After lunch
  - After dinner
- Glucose value validation between 40 and 600 mg/dL
- Duplicate reading prevention
- Dashboard with highest, lowest and average readings
- Reading history and charts
- Daily, month-to-date and previous-month reports
- Patient chatbot with FAQ support and optional Gemini AI

### Doctor Features
- Doctor login
- Doctor dashboard
- View assigned patients
- View individual patient glucose readings
- Generate daily and monthly patient reports
- Automatic doctor assignment when a patient registers

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Axios
- React Router
- Recharts

### Backend
- Node.js
- Express.js
- PostgreSQL
- bcryptjs
- JSON Web Token
- Google Gemini API (optional)

## Project Structure

```text
sweety-glucose-tracker-project/
|
|-- client/
|   |-- public/
|   |-- src/
|   |-- package.json
|   |-- .env.example
|   |
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- database/
|   |   |-- schema.sql
|   |   |-- doctor_migration.sql
|   |   |-- seed.js
|   |   |-- setupDoctor.js
|   |-- middleware/
|   |-- routes/
|   |-- .env.example
|   |-- package.json
|   |-- server.js
|
|-- .gitignore
|-- README.md
```

## Requirements

Install the following before running the project:

- Node.js
- npm
- PostgreSQL
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Phaneendra-allam/sweety-glucose-tracker-project.git

cd sweety-glucose-tracker-project
```

### 2. Create the PostgreSQL database

Open PostgreSQL and create a database:

```sql
CREATE DATABASE sweety_db;
```

### 3. Create the database tables

From the project root, run:

```bash
psql -U postgres -d sweety_db -f server/database/schema.sql
```

Then run the Doctor migration:

```bash
psql -U postgres -d sweety_db -f server/database/doctor_migration.sql
```

The migration adds user roles and the doctor-patient assignment table.

### 4. Configure backend environment variables

Open the server folder:

```bash
cd server
```

Create a `.env` file using `.env.example`.

Configure the following variables:

```env
PORT=5000

PGHOST=localhost
PGPORT=5432
PGDATABASE=sweety_db
PGUSER=postgres
PGPASSWORD=your_postgres_password

JWT_SECRET=replace_with_a_long_random_secret

CLIENT_URL=http://localhost:5173
DEFAULT_DOCTOR_EMAIL=doctor@sweety.com

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
```

Replace the database password and JWT secret with your own values.

Gemini API configuration is optional. The chatbot FAQ functionality works without a Gemini API key.

### 5. Install backend dependencies

Inside the server directory:

```bash
npm install
```

### 6. Seed the demo patient

Run:

```bash
npm run seed
```

This creates a demo patient and four sample glucose readings.

Demo patient:

- Email: demo@sweety.com
- Password: Sweety12345

Note: Running the seed script again resets the demo patient's existing readings.

### 7. Create the demo doctor

Run:

```bash
node database/setupDoctor.js
```

This creates or updates the demo doctor and assigns the demo patient.

Demo doctor:

- Email: doctor@sweety.com
- Password: Doctor12345

The setup script resets the demo doctor's password to this development password. Change it before using the application beyond a local demo.

### 8. Start the backend server

From the server directory:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

### 9. Configure the frontend

Open another terminal and navigate to the client folder:

```bash
cd client
```

Create a `.env` file containing:

```env
VITE_API_URL=http://localhost:5000
```

### 10. Install frontend dependencies

```bash
npm install
```

### 11. Start the frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Testing

### Frontend checks

Open a terminal in the client directory.

Run the lint command:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

### Backend checks

Start the backend:

```bash
npm run dev
```

Open the following URL:

```text
http://localhost:5000/
```

Expected response:

```json
{
  "message": "Sweety Glucose Tracker API is running"
}
```

Test the database connection:

```text
http://localhost:5000/api/test-db
```

### Manual testing checklist

- Patient registration
- Patient login
- Doctor login
- Add glucose reading
- Edit glucose reading
- Delete glucose reading
- Duplicate reading validation
- Glucose value validation
- Reading history
- Daily report
- Month-to-date report
- Previous-month report
- Doctor dashboard
- Doctor-patient assignment
- Patient chatbot

Note: Automated backend test cases are not currently configured. The application has been manually tested.

## API Endpoints

### Authentication

| Method | Endpoint |
|---|---|
| POST | /api/auth/register |
| POST | /api/auth/login |

### Glucose Readings

| Method | Endpoint |
|---|---|
| POST | /api/readings |
| GET | /api/readings |
| PUT | /api/readings/:id |
| DELETE | /api/readings/:id |

### Reports

| Method | Endpoint |
|---|---|
| GET | /api/reports/daily |
| GET | /api/reports/month-to-date |
| GET | /api/reports/monthly |

### Doctor

| Method | Endpoint |
|---|---|
| GET | /api/doctor/patients |
| GET | /api/doctor/patients/:id/reports/daily |
| GET | /api/doctor/patients/:id/reports/month-to-date |
| GET | /api/doctor/patients/:id/reports/monthly |

### Chatbot

| Method | Endpoint |
|---|---|
| POST | /api/chat/message |
| GET | /api/chat/today-summary |

Authenticated endpoints require a JWT token.

## Validation Rules

- Glucose value must be a whole number.
- Minimum value: 40 mg/dL.
- Maximum value: 600 mg/dL.
- Only one reading is allowed per time slot per day.
- Maximum four readings per day.
- Future reading dates are not allowed.
- Patients can access only their own readings.
- Doctors can access only their assigned patients' reports.

## Notes

- Patients are automatically assigned to the doctor configured through DEFAULT_DOCTOR_EMAIL.
- The application supports one configured default doctor for new patient registrations.
- Patients manually enter their glucose readings.
- The chatbot provides application guidance and general educational information. It does not provide medical diagnosis or treatment.
- Gemini AI functionality is optional; FAQ responses are available without an API key.
- Demo credentials are intended for development and demonstration only.

### What I Would Improve With More Time

With more development time, I would improve the application by:

- Adding automated frontend and backend tests.
- Improving mobile responsiveness and accessibility.
- Adding pagination and advanced filtering to reading history.
- Improving chatbot responses and error handling.
- Adding more advanced reports and data visualizations.
- Implementing production database backups and monitoring.

## Deployment

The application is deployed using Render.

- Frontend: Render Static Site
- Backend: Render Web Service
- Database: Render PostgreSQL

Environment variables are configured separately in Render and are not stored in the public repository.

## Author

Developed as part of the Junior Full Stack Developer assignment for Kenpath.

**Project:** Sweety - Blood Glucose Tracker
