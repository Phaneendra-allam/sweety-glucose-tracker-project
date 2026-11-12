\# Sweety – Blood Glucose Tracker



A full-stack blood glucose tracking application built with React, Node.js, Express and PostgreSQL.



\## Features



\- User registration and login

\- Secure password hashing using bcrypt

\- JWT-based authentication

\- Add, view, edit and delete glucose readings

\- Four daily reading slots:

&#x20; - Morning

&#x20; - After breakfast

&#x20; - After lunch

&#x20; - After dinner

\- Glucose validation between 40 and 600 mg/dl

\- Prevent duplicate readings for the same time slot and date

\- Dashboard with highest, lowest, average and total readings

\- Daily, month-to-date and previous-month reports

\- Reading history and chart visualization

\- User-specific reading data



\## Technology Stack



\*\*Frontend\*\*

\- React

\- Vite

\- CSS

\- Axios

\- Recharts

\- React Router



\*\*Backend\*\*

\- Node.js

\- Express.js

\- PostgreSQL

\- JWT

\- bcryptjs



\## Project Structure



```text

sweety-glucose-tracker/

├── client/

│   ├── src/

│   └── package.json

├── server/

│   ├── config/

│   ├── controllers/

│   ├── database/

│   │   ├── schema.sql

│   │   └── seed.js

│   ├── middleware/

│   ├── routes/

│   ├── .env.example

│   └── package.json

├── .gitignore

└── README.md

```



\## Requirements



\- Node.js

\- npm

\- PostgreSQL



\## Installation



\### 1. Clone the repository



```bash

git clone https://github.com/Phaneendra-allam/sweety-glucose-tracker.git
cd sweety-glucose-tracker

```



\### 2. Set up PostgreSQL



Create a database named:



```sql

CREATE DATABASE sweety\_db;

```



Run the database schema:



```bash

psql -U postgres -d sweety\_db -f server/database/schema.sql

```



\### 3. Configure the backend



Go to the server folder:



```bash

cd server

npm install

```



Create a `.env` file using `.env.example` and configure your PostgreSQL credentials and JWT secret.



\### 4. Start the backend



```bash

npm run dev

```



Backend runs at:



```text

http://localhost:5000

```



\### 5. Configure and start the frontend



Open another terminal:



```bash

cd client

npm install

npm run dev

```



Frontend runs at:



```text

http://localhost:5173

```



\## Demo Login



After running the seed script:



```bash

cd server

npm run seed

```



Use these credentials:



\- Email: `demo@sweety.com`

\- Password: `Sweety12345`



The seed script creates a demo user with four sample readings.



\## API Endpoints



\### Authentication



| Method | Endpoint |

|---|---|

| POST | `/api/auth/register` |

| POST | `/api/auth/login` |



\### Glucose Readings



| Method | Endpoint |

|---|---|

| POST | `/api/readings` |

| GET | `/api/readings` |

| PUT | `/api/readings/:id` |

| DELETE | `/api/readings/:id` |



\### Reports



| Method | Endpoint |

|---|---|

| GET | `/api/reports/daily?date=YYYY-MM-DD` |

| GET | `/api/reports/month-to-date?date=YYYY-MM-DD` |

| GET | `/api/reports/monthly?date=YYYY-MM-DD` |



All reading and report endpoints require JWT authentication.



\## Validation Rules



\- Glucose value is required.

\- Glucose value must be a whole number between 40 and 600 mg/dl.

\- Only one reading is allowed per time slot per day.

\- Maximum four readings are allowed per day.

\- Future dates are not allowed.

\- Users can access only their own readings.



\## Notes and Future Improvements



\- Add automated frontend and backend tests.

\- Add pagination for reading history.

\- Improve accessibility and mobile responsiveness.

\- Add optional doctor access with user permission.

\- Add deployment and production monitoring.



## Testing

The application was manually tested using the browser and Postman.

Verified scenarios:
- User registration and login
- Add, view, edit and delete glucose readings
- Required field and glucose range validation
- Duplicate time-slot validation
- Maximum four readings per day
- Future-date validation
- User-specific data access
- Daily and monthly reports
- Dashboard calculations and navigation

Automated test cases are planned as a future improvement.



\## Author



Junior Full Stack Developer Assignment – Kenpath



\*\*Project:\*\* Sweety – Blood Glucose Tracker



