Resource-Booking-Backend

REST API backend for managing shared organizational resources—rooms, labs, desks, equipment, and more. It supports multi-tenant organizations with role-based access (super_admin, space_admin, member, guest), resource booking with optional approval workflows, check-in tracking, access groups, notifications, calendar integrations, and dashboard analytics. Authentication uses JWT with OTP email verification and password reset flows.

Tech Stack

Category

Technology

Runtime

Node.js (18+ recommended)

Language

TypeScript 5.9

Framework

Express 5

Database

MongoDB (Mongoose 9)

Cache / Rate limiting

Redis 6 (rate-limit-redis)

Authentication

JSON Web Tokens (jsonwebtoken), bcrypt (bcryptjs)

Email

Nodemailer

Other

CORS, dotenv, express-rate-limit

Folder Structure

src/

├── app.ts              # Express app setup, route mounting, middleware

├── server.ts           # Entry point — connects DB/Redis and starts HTTP server

├── config/             # Environment, database, Redis, and mailer configuration

├── controllers/        # Request handlers and business logic per domain

├── middleware/         # Auth, authorization, rate limiting, and error handling

├── models/             # Mongoose schemas (User, Resource, Booking, Organization, etc.)

├── routes/             # Express route definitions mapped to controllers

└── utils/              # Shared helpers (JWT, hashing, OTP, errors, API responses)

Folder

Purpose

config/

Loads environment variables, connects to MongoDB and Redis, configures the SMTP mail transporter

controllers/

Implements endpoint logic for auth, users, organizations, resources, bookings, approvals, notifications,analytics and auditLogs.

middleware/

protect (JWT auth), authorize (role checks), rate limiters, and global error handler

models/

Data models for users, organizations, resources, bookings, approvals, access groups, notifications, audit logs, blackout dates, and recurring bookings

routes/

Defines HTTP methods and paths, applies middleware, and delegates to controllers

utils/

Reusable utilities for token generation, password hashing, OTP, standardized responses, and custom errors

Setup Instructions (Windows / PowerShell)

1. Clone the repository

git clone [https://github.com/kashishdembra/Resource-Booking-Backend.git](https://github.com/kashishdembra/Resource-Booking-Backend.git)

cd Resource-Booking-Backend

2. Install dependencies

npm install

3. Configure environment variables

Create a .env file in the project root. The following variables are read from src/config/env.ts:

Variable

Required

Default

Description

MONGO_URI

Yes

—

MongoDB connection string

JWT_SECRET

Yes

—

Secret key for signing JWTs

JWT_EXPIRES_IN

No

7d

JWT expiration duration

MAIL_USER

Yes

—

SMTP account username

MAIL_PASS

Yes

—

SMTP account password

PORT

No

5000

HTTP server port

REDIS_URL

No

redis://localhost:6379

Redis connection URL

MAIL_HOST

No

—

SMTP host (e.g. [smtp.gmail.com](http://smtp.gmail.com))

MAIL_PORT

No

587

SMTP port

MAIL_FROM

No

—

Sender address for outgoing email

Example .env:

PORT=5000

MONGO_URI=mongodb://localhost:27017/resource-booking

JWT_SECRET=your-secret-key

JWT_EXPIRES_IN=7d

REDIS_URL=redis://localhost:6379

MAIL_HOST=[smtp.gmail.com](http://smtp.gmail.com)

MAIL_PORT=587

[MAIL_USER=your-email@gmail.com](mailto:MAIL_USER=your-email@gmail.com)

MAIL_PASS=your-app-password

[MAIL_FROM=your-email@gmail.com](mailto:MAIL_FROM=your-email@gmail.com)

Ensure MongoDB and Redis are running locally before starting the server.

4. Run the server

Development (with hot reload):

npm run dev

Production:

npm run build

npm start

The API is available at [http://localhost:5000/api](http://localhost:5000/api).

API Endpoints

All routes below are prefixed with /api. Endpoints marked with 🔒 require a valid Authorization: Bearer <token> header.

Health

Method

Endpoint

Description

GET

/health

Server health check

Auth — /auth

Method

Endpoint

Description

POST

/signup

Register a new user account

POST

/verify-otp

Verify email with OTP after signup

POST

/login

Authenticate and receive a JWT

POST

/logout 🔒

Invalidate the current session token

POST

/forgot-password

Request a password reset OTP

POST

/verify-reset-otp

Verify the password reset OTP

POST

/reset-password

Set a new password after OTP verification

Users — /users

Method

Endpoint

Description

GET

/profile 🔒

Get the logged-in user's profile

PATCH

/profile 🔒

Update the logged-in user's profile

GET

/ 🔒

List all users (super_admin, space_admin)

GET

/:id 🔒

Get a user by ID (super_admin, space_admin)

PATCH

/:id/role 🔒

Update a user's role (super_admin)

PATCH

/:id/status 🔒

Activate or deactivate a user (super_admin, space_admin)

DELETE

/:id 🔒

Delete a user (super_admin)

Organizations — /organizations

Method

Endpoint

Description

POST

/ 🔒

Create an organization (super_admin)

GET

/ 🔒

List all organizations (super_admin)

GET

/:id 🔒

Get an organization by ID (super_admin, space_admin)

PATCH

/:id 🔒

Update an organization (super_admin)

DELETE

/:id 🔒

Delete an organization (super_admin)

POST

/:id/space-admin 🔒

Assign a space admin to an organization (super_admin)

Resources — /resources

Method

Endpoint

Description

POST

/ 🔒

Create a resource (space_admin)

GET

/ 🔒

List resources

GET

/:id 🔒

Get a resource by ID

PATCH

/:id 🔒

Update a resource (space_admin)

PATCH

/:id/status 🔒

Activate or deactivate a resource (space_admin)

DELETE

/:id 🔒

Delete a resource (space_admin)

Access Groups — /access-groups

Method

Endpoint

Description

GET

/ 🔒

List access groups

GET

/:id 🔒

Get an access group by ID

POST

/ 🔒

Create an access group (super_admin, space_admin)

PATCH

/:id 🔒

Update an access group (super_admin, space_admin)

PATCH

/:id/add-user 🔒

Add a user to an access group (super_admin, space_admin)

PATCH

/:id/remove-user 🔒

Remove a user from an access group (super_admin, space_admin)

DELETE

/:id 🔒

Delete an access group (super_admin, space_admin)

Bookings — /bookings

Method

Endpoint

Description

POST

/ 🔒

Create a booking

GET

/ 🔒

List bookings

GET

/:id 🔒

Get a booking by ID

PATCH

/:id 🔒

Update a booking

PATCH

/:id/status 🔒

Approve, reject, or change booking status (super_admin, space_admin)

DELETE

/:id 🔒

Cancel a booking (owner or super_admin)

PATCH

/:id/check-in 🔒

Check in to a booking

Approvals — /approvals

Method

Endpoint

Description

GET

/ 🔒

List pending approvals (super_admin, space_admin)

GET

/:id 🔒

Get an approval by ID (super_admin, space_admin)

PATCH

/:bookingId/approve 🔒

Approve a booking (super_admin, space_admin)

PATCH

/:bookingId/reject 🔒

Reject a booking (super_admin, space_admin)

Notifications — /notifications

Method

Endpoint

Description

GET

/ 🔒

Get notifications for the logged-in user

GET

/:id 🔒

Get a notification by ID

PATCH

/:id/read 🔒

Mark a notification as read

PATCH

/read-all 🔒

Mark all notifications as read

DELETE

/:id 🔒

Delete a notification

POST

/ 🔒

Create a notification (super_admin, space_admin)

Analytics — /analytics

Method

Endpoint

Description

GET

/dashboard 🔒

Get dashboard analytics (super_admin, space_admin)

Calendar — /calendar

Method

Endpoint

Description

POST

/ 🔒

Connect a calendar integration

GET

/ 🔒

Get the current user's calendar integration

PATCH

/ 🔒

Update calendar integration settings

DELETE

/ 🔒

Disconnect calendar integration

Author

GitHub: kashishdembra
