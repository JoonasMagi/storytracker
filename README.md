# User Authentication System with MariaDB Backend

This project includes a complete user authentication system with a Node.js backend and MariaDB database.

## Features

- User registration with email and password
- Secure login with JSON Web Token (JWT) authentication
- Password hashing with bcrypt
- Multi-language support (English, Estonian, Russian, Spanish)
- Dark mode toggle with persistent preferences
- Form validation (frontend and backend)
- MariaDB database integration

## Project Structure

```
project-frontend/
├── index.html        # Frontend user interface
├── script.js         # Frontend JavaScript logic
├── styles.css        # CSS styling
└── server/           # Backend code
    ├── server.js     # Express server and API endpoints
    ├── db.js         # Database connection and initialization
    ├── package.json  # Node.js dependencies
    └── .env          # Environment variables (not in version control)
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MariaDB/MySQL database

### Database Setup

1. Install MariaDB or MySQL on your system if not already installed
2. Create a new database:
   ```sql
   CREATE DATABASE userauth;
   ```
3. You can use the default schema defined in `db.js` which will create the necessary tables automatically when the server starts

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Edit the `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=userauth
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_change_in_production
   ```

4. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Open `index.html` in a web browser, or serve it using a local development server.
2. Ensure the API URL in `script.js` points to your backend server (default: `http://localhost:3000/api`).

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login and get JWT token
- `GET /api/profile` - Get user profile data (requires authentication)

## Security Notes

- Change the JWT secret key in production
- The database password should be strong and unique
- HTTPS should be enabled in production