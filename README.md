# SpaceSync — Resource Booking Backend

SpaceSync is a resource reservation platform built to help universities, institutions, and organizations manage shared facilities such as meeting rooms, labs, sports facilities, parking spaces, and equipment through a centralized system. This repository contains the **backend** of the project, which I built and worked on independently.

The frontend for this project was developed separately and is available here: [SpaceSync Frontend Repository](https://github.com/ZainUlAbideen-01/SpaceSync-Resource-Manager)

> **Note:** This project has not been deployed yet (no live Vercel link). To try it out, please run both the frontend and backend locally by following the instructions below.

## 🚀 My Contribution (Backend)

- Built a modular REST API using **Express.js** and **TypeScript**
- Designed the database schema and data models using **MongoDB** (via Mongoose)
- Implemented **JWT-based authentication**, including login, logout, and password recovery (forgot/reset password with OTP verification)
- Added **role-based authorization** and rate limiting middleware to secure sensitive routes
- Developed the following core modules:
  - **Auth Module** — login, logout, forgot/reset password, OTP verification
  - **User Module** — profile management, user roles, and admin-level user controls
  - **Organization Module** — organization creation, space admin assignment, and user management within organizations
  - **Resource Module** — creating, searching, updating, and managing bookable resources
  - **Access Group Module** — grouping users and controlling access permissions
  - **Booking Module** — creating, updating, cancelling, and checking in bookings
  - **Approval Module** — approval/rejection workflow for bookings requiring authorization, with audit logging and notifications

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT
- **Caching/Sessions:** Redis
- **Frontend:** Next.js, Tailwind CSS (built separately — see link above)

## 📂 Project Structure

```
BACKEND
├── src
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   └── utils
├── app.ts
├── server.ts
├── documentation.md
├── package.json
└── tsconfig.json
```

## ⚙️ Getting Started

### Backend Setup

1. Clone this repository
   ```bash
   git clone https://github.com/Eimaant22/Space-Sync-Resource-Booking-Platform
   cd BACKEND
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   REDIS_URL=your_redis_connection_string
   ```
4. Run the development server
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.

### Frontend Setup

The frontend needs to be run alongside the backend for the full application to work. Clone and run it from its own repository:

```bash
git clone https://github.com/ZainUlAbideen-01/SpaceSync-Resource-Manager
cd SpaceSync-Resource-Manager
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser to view the app.
