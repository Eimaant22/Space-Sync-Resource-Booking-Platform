# SpaceSync-Resource-Booking-Platform

**Stack:** Node.js · TypeScript · Express · MongoDB · Redis  · JWT Auth

> **Base URL:** `/api`
> **Auth scheme:** Bearer JWT in the `Authorization` header, issued at signup verification and login.

```http
Authorization: Bearer <token>
```

Unless noted otherwise, all request/response bodies are `application/json`, and all endpoints except Auth require a valid Bearer token.

---

# Module 1 (Part 1) – Signup Request Management

## Module Overview

The **Signup Request Management Module** implements a **Super Admin Approval Workflow** for new user registrations.

Instead of creating a user account immediately after registration, the system stores every registration as a **Signup Request**. The request remains in **Pending** status until it is reviewed by the **Super Admin**.

The Super Admin can:

- View all signup requests
- Filter requests by status
- View complete request details
- Approve signup requests
- Reject signup requests
- View processed request history

### Approval Workflow

When a request is **approved**:

- A new user account is automatically created.
- The signup request status changes to **Approved**.
- The approving administrator is recorded.
- The approval timestamp is saved.
- An approval email is sent to the applicant.
- An audit log is created.

When a request is **rejected**:

- The signup request status changes to **Rejected**.
- The reviewing administrator is recorded.
- The rejection timestamp is saved.
- A rejection email is sent.
- An audit log is created.

---

# Models Used

| Model | Purpose |
|--------|---------|
| SignupRequest | Stores user registration requests awaiting approval |
| User | Creates the actual user account after approval |
| AuditLog | Records approval and rejection activities |

---

# Signup Request Schema

## Collection

```text
signup_requests
```

## Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| username | String | ✅ Yes | Unique username |
| name | String | ✅ Yes | Full name |
| email | String | ✅ Yes | User email |
| password | String (Hashed) | ✅ Yes | Encrypted password |
| role | Enum | ✅ Yes | member / guest / space_admin |
| phone | String | ❌ No | Contact number |
| photoUrl | String | ❌ No | Profile image URL |
| status | Enum | ✅ Yes | pending / approved / rejected |
| approvedBy | ObjectId(User) | ❌ No | Super Admin who processed the request |
| approvedAt | Date | ❌ No | Approval or rejection timestamp |
| createdAt | Date | Auto | Request creation time |
| updatedAt | Date | Auto | Last update time |

---

# Controller: submitSignupRequest

## Purpose

Allows new users to submit a registration request. No user account is created immediately. Instead, the request is stored in **Pending** status until reviewed by the Super Admin.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | submitSignupRequest |
| Method | POST |
| Endpoint | `/api/signup-requests` |
| Authentication Required | No |
| Authorization Middleware | No |
| Allowed Roles | Public |

---

## Request Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| username | String | ✅ Yes | Unique username |
| name | String | ✅ Yes | Full name |
| email | String | ✅ Yes | Email address |
| password | String | ✅ Yes | Account password |
| role | Enum | ✅ Yes | member / guest / space_admin |
| phone | String | ❌ No | Contact number |
| photoUrl | String | ❌ No | Profile image URL |

---

## Example Request

```http
POST /api/signup-requests
```

```json
{
  "username": "john",
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "password123",
  "role": "member",
  "phone": "03001234567",
  "photoUrl": "https://example.com/profile.jpg"
}
```

---

## Success Response (201)

```json
{
  "success": true,
  "message": "Signup request submitted successfully. Please wait for approval from the Super Admin."
}
```

---

## Error Responses

### 422 Validation Error

```json
{
  "success": false,
  "message": "username, name, email, role and password are required."
}
```

### 422 Invalid Username

```json
{
  "success": false,
  "message": "Invalid username."
}
```

### 422 Invalid Role

```json
{
  "success": false,
  "message": "Invalid role."
}
```

### 409 User Already Exists

```json
{
  "success": false,
  "message": "User already exists."
}
```

### 409 Pending Request Exists

```json
{
  "success": false,
  "message": "A signup request is already pending."
}
```

---

## Frontend Usage

This endpoint is used by the Registration page. After successful submission, redirect the user to a **"Request Submitted Successfully"** screen informing them that their request is awaiting Super Admin approval.

Do **not** redirect the user to the Login page.

---

## Backend Review

- ✅ Prevents duplicate usernames and email addresses.
- ✅ Prevents multiple pending requests from the same user.
- ✅ Password is securely hashed before storing.
- ✅ No user account is created until approval.

---

# Controller: getSignupRequests

## Purpose

Returns all signup requests submitted by users. Administrators can optionally filter requests by their approval status.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | getSignupRequests |
| Method | GET |
| Endpoint | `/api/signup-requests` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles | Super Admin |

---

## Query Parameters

| Parameter | Required | Allowed Values |
|-----------|----------|----------------|
| status | ❌ No | pending, approved, rejected |

---

## Example Request

```http
GET /api/signup-requests?status=pending
Authorization: Bearer <SUPER_ADMIN_TOKEN>
```

---

## Success Response (200)

```json
{
  "success": true,
  "requests": [
    {
      "_id": "...",
      "username": "john",
      "name": "John Doe",
      "email": "john@gmail.com",
      "role": "member",
      "phone": "03001234567",
      "status": "pending",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## Error Response

### 422 Invalid Status

```json
{
  "success": false,
  "message": "Invalid status filter."
}
```

---

## Frontend Usage

This API powers:

- Pending Requests page
- Approved Requests page
- Rejected Requests page

The frontend only needs to change the `status` query parameter to retrieve the required list.

---

## Backend Review

- ✅ Supports filtering by request status.
- ✅ Returns requests sorted by latest submissions.
- ✅ Accessible only to Super Admin.

---

# Controller: getSignupRequestById

## Purpose

Returns complete details of a single signup request.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | getSignupRequestById |
| Method | GET |
| Endpoint | `/api/signup-requests/:id` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles | Super Admin |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Signup Request ID |

---

## Example Request

```http
GET /api/signup-requests/685abc1234567890abcdef11
Authorization: Bearer <SUPER_ADMIN_TOKEN>
```

---

## Success Response (200)

```json
{
  "success": true,
  "signupRequest": {
    "_id": "...",
    "username": "john",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "member",
    "phone": "03001234567",
    "status": "approved",
    "approvedAt": "...",
    "approvedBy": {
      "_id": "...",
      "name": "Super Admin",
      "email": "admin@gmail.com",
      "role": "super_admin"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid signup request id."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Signup request not found."
}
```

---

## Frontend Usage

Used to display complete signup request information on the **Request Details** page before approval or rejection.

---

## Backend Review

- ✅ Returns complete applicant information.
- ✅ Includes reviewer information if already processed.
- ✅ Accessible only by Super Admin.
---

# Module 1 part 2 – Authentication Module

The Authentication Module is responsible for authenticating users and managing password recovery. It allows users to log in using either their email address or username, securely log out, and reset forgotten passwords using an OTP-based verification process.

---

# 1.1 Log In

## Purpose

Authenticates a user using either their email or username together with their password. On successful authentication, a JWT access token is returned. Only active accounts are allowed to log in.

## API Details

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/login` |

### Authentication

**Not Required**

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| identifier | String | Yes | User's email address or username |
| password | String | Yes | User account password |

---

## Example Request

```http
POST /api/auth/login
```

```json
{
  "identifier": "john_doe",
  "password": "SecurePass123"
}
```

---

## Success Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6872e10dc24d59e9a5bb2d10",
      "username": "john_doe",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "organizationId": "6872cfe4f18e44b2fbb5e9d1"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Error Responses

### 401 – Invalid Credentials

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Credentials are incorrect."
  }
}
```

### 403 – Account Inactive

```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_INACTIVE",
    "message": "Your account is inactive."
  }
}
```

### 422 – Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "identifier (email or username) and password are required."
  }
}
```

---

## Notes

- The **identifier** field accepts either an email address or a username.
- Login is only allowed for active accounts (`isActive = true`).
- Passwords are verified using **bcrypt** before issuing a JWT access token.

---

# 1.2 Log Out

## Purpose

Logs the current user out by blacklisting the JWT token in Redis until it naturally expires.

## API Details

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/logout` |

### Authentication

**Required**

---

## Headers

```http
Authorization: Bearer <jwt_token>
```

---

## Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

---

## Error Responses

### 401 – Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Invalid or expired token."
  }
}
```

---

## Notes

- The JWT token is stored in a Redis blacklist.
- Any future request using the same token will be rejected until the token expires.

---

# 1.3 Forgot Password

## Purpose

Sends a password reset OTP to the user's email if a verified account exists. For security reasons, the response is identical whether or not the email exists.

## API Details

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/forgot-password` |

### Authentication

**Not Required**

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| email | String | Yes | Registered email address |

---

## Example Request

```http
POST /api/auth/forgot-password
```

```json
{
  "email": "john@example.com"
}
```

---

## Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, an OTP has been sent."
  }
}
```

---

## Error Responses

### 422 – Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email is required."
  }
}
```

---

## Notes

- OTP is sent only if the account exists and is verified.
- The same response is returned even if the email does not exist to prevent email enumeration attacks.

---

# 1.4 Verify Reset OTP

## Purpose

Verifies the OTP received through email and returns a temporary reset token required for resetting the password.

## API Details

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/verify-reset-otp` |

### Authentication

**Not Required**

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| email | String | Yes | Registered email address |
| otp | String | Yes | 6-digit password reset OTP |

---

## Example Request

```http
POST /api/auth/verify-reset-otp
```

```json
{
  "email": "john@example.com",
  "otp": "824163"
}
```

---

## Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "OTP verified. Use the resetToken to set a new password.",
    "resetToken": "3f7d15e3b4c7a98f41b23e1d5a67..."
  }
}
```

---

## Error Responses

### 400 – Invalid OTP

```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Invalid or expired OTP."
  }
}
```

### 422 – Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email and otp are required."
  }
}
```

---

## Notes

- The returned **resetToken** is temporary and expires automatically.
- It must be supplied when calling the **Reset Password** endpoint.

---

# 1.5 Reset Password

## Purpose

Allows a user to set a new password using the reset token obtained from the **Verify Reset OTP** endpoint.

## API Details

| Method | Endpoint |
|--------|----------|
| POST | `/api/auth/reset-password` |

### Authentication

**Not Required**

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| email | String | Yes | Registered email |
| resetToken | String | Yes | Token returned by Verify Reset OTP |
| newPassword | String | Yes | Minimum 8 characters |

---

## Example Request

```http
POST /api/auth/reset-password
```

```json
{
  "email": "john@example.com",
  "resetToken": "3f7d15e3b4c7a98f41b23e1d5a67...",
  "newPassword": "NewSecurePass123"
}
```

---

## Success Response (200)

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. Please log in."
  }
}
```

---

## Error Responses

### 400 – Invalid Reset Token

```json
{
  "success": false,
  "error": {
    "code": "INVALID_RESET_TOKEN",
    "message": "Invalid or expired reset token."
  }
}
```

### 404 – User Not Found

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "No account found for this email."
  }
}
```

### 422 – Missing Required Fields

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email, resetToken, and newPassword are required."
  }
}
```

### 422 – Password Too Short

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "newPassword must be at least 8 characters."
  }
}
```

---

## Notes

- Passwords are securely hashed before being stored.
- The reset token can only be used once.
- After successfully resetting the password, the user must log in again using the new password.




---
# Module 2: User Management

# Controller: getProfile

## Purpose

Retrieves the profile of the currently logged-in user.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| GET | `/api/users/profile` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest (if authenticated)

## Example Request

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | Profile retrieved successfully |
| 401 | Authentication required |
| 404 | User not found |
| 500 | Internal server error |

```json
{
    "success": true,
    "data": {
        "user": {
            "_id": "6a634ff1653c02679df3cfb9",
            "username": "superadmin",
            "name": "System Super Admin",
            "email": "superadmin@spacesync.com",
            "role": "super_admin",
            "organizationId": null,
            "photoUrl": "https://i.pravatar.cc/300?img=1",
            "phone": "+923001111111",
            "isVerified": true,
            "isActive": true
        }
    }
}
```

## Frontend Usage (PRD)

Used on the **Profile** and **Account Settings** page to display the logged-in user's information after login.

## Models Used

- User

---

# Controller: updateProfile

## Purpose

Allows the logged-in user to update their personal information such as name, phone number, department, and profile photo.
## Updatable Fields

| Field | Type | Required for Update | Description |
|-------|------|---------------------|-------------|
| `name` | String | No | User's full name. |
| `phone` | String | No | User's contact number. |
| `photoUrl` | String | No | URL of the user's profile picture. |

> **Note:** All fields are optional during profile update. Only the fields provided in the request body will be updated. Fields such as `username`, `email`, `role`, `organizationId`, `isVerified`, `isActive`, and `password` cannot be updated through this endpoint.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| PATCH | `/api/users/profile` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest (if authenticated)

## Example Request

```json
{
  "name": "John Doe",
  "phone": "+923001234567",
  "photoUrl": "https://example.com/profile.jpg"
}
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | Profile updated successfully |
| 401 | Authentication required |
| 404 | User not found |
| 500 | Internal server error |

```json
{
    "success": true,
    "data": {
        "message": "Profile updated successfully.",
        "user": {
            "_id": "6a634ff1653c02679df3cfb9",
            "username": "superadmin",
            "name": "John Doe",
            "email": "superadmin@spacesync.com",
            "role": "super_admin",
            "organizationId": null,
            "photoUrl": "https://example.com/profile.jpg",
            "phone": "+923001234567",
            "isVerified": true,
            "isActive": true,
            "updatedAt": "2026-07-24T11:57:19.732Z"
        }
    }
    }
```

## Frontend Usage (PRD)

Used on the **Edit Profile** page when a user updates their personal information.

## Models Used

- User

---

# Controller: getUsers

## Purpose

Retrieves the list of users. Super Admin can view all users, while Space Admin can only view users belonging to their organization.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| GET | `/api/users` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (`super_admin`, `space_admin`) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Example Request

```http
GET /api/users?search=john&role=member&isActive=true
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | Users retrieved successfully |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | Logged-in user not found |
| 500 | Internal server error |

```json
{
    "success": true,
    "data": {
        "users": [
            {
                "_id": "6a634ff1653c02679df3cfc1",
                "username": "hamza.sheikh",
                "name": "Hamza Sheikh",
                "email": "hamza.sheikh@example.com",
                "role": "member",
                "organizationId": null,
                "photoUrl": "https://i.pravatar.cc/300?img=9",
                "phone": "+923001111119",
                "isVerified": true,
                "isActive": true
            },
            {
                "_id": "6a634ff1653c02679df3cfc9",
                "username": "guest5",
                "name": "Iqra Guest",
                "email": "guest5@example.com",
                "role": "guest",
                "organizationId": null,
                "photoUrl": "https://i.pravatar.cc/300?img=17",
                "phone": "+923001111127",
                "isVerified": true,
                "isActive": true
            }]}}
```
# If user other than super_admin and space_admin try to run this:
```json
{
    "success": false,
    "error": {
        "code": "FORBIDDEN",
        "message": "You are not authorized to perform this action."
    }
}
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search users by **name**, **email**, or **username** (case-insensitive). |
| `role` | string | No | Filter users by role. Allowed values: `super_admin`, `space_admin`, `member`, `guest`. |
| `isActive` | boolean | No | Filter users by account status (`true` or `false`). |

---

## Example Requests

### 1. Get All Users

```http
GET /api/users
```

---

### 2. Search Users

Search by name, email, or username.

```http
GET /api/users?search=Ahmed
```

---

### 3. Filter by Role

```http
GET /api/users?role=member
```

Other examples:

```http
GET /api/users?role=space_admin
```

```http
GET /api/users?role=guest
```

```http
GET /api/users?role=super_admin
```

---

### 4. Filter Active Users

```http
GET /api/users?isActive=true
```

---

### 5. Filter Inactive Users

```http
GET /api/users?isActive=false
```

---

### 6. Search + Role

```http
GET /api/users?search=Ali&role=member
```

---

### 7. Search + Active Status

```http
GET /api/users?search=Sara&isActive=true
```

---

### 8. Role + Active Status

```http
GET /api/users?role=guest&isActive=true
```

---

### 9. Search + Role + Active Status

```http
GET /api/users?search=Ahmed&role=space_admin&isActive=true
```

---

## Successful Response

**Status Code**

```http
200 OK
```

Example:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "689f5c9b4e1c123456789abc",
        "username": "ahmedkhan",
        "name": "Ahmed Khan",
        "email": "ahmed@example.com",
        "role": "member",
        "isVerified": true,
        "isActive": true,
        "organizationId": {
          "_id": "689f5c9b4e1c987654321abc",
          "name": "Tech Organization"
        },
        "createdAt": "2026-07-20T12:00:00.000Z",
        "updatedAt": "2026-07-23T08:30:00.000Z"
      }
    ]
  }
}
```

---
## Frontend Usage (PRD)

Used in the **User Management** page where administrators can search, filter, and manage organization members.

## Models Used

- User

## Notes



---

# Controller: getUserById

## Purpose

Retrieves the details of a specific user by ID.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| GET | `/api/users/:id` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (`super_admin`, `space_admin`) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Example Request

```http
GET /api/users/6875e1d8f0c7d3a8d9f12345
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | User retrieved successfully |
| 400 | Invalid user ID |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | User not found |
| 500 | Internal server error |

## Frontend Usage (PRD)

Used when an administrator opens a user's profile from the **User Management** page to view detailed information.

## Models Used

- User

---

# Controller: updateUserRole

## Purpose

Allows the Super Admin to change the role of a user within the organization.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| PATCH | `/api/users/:id/role` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (`super_admin`) |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Example Request

```json
{
  "role": "space_admin"
}
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | User role updated successfully |
| 400 | Invalid ID or self-role change not allowed |
| 401 | Authentication required |
| 403 | Cannot modify Super Admin |
| 404 | User not found |
| 422 | Invalid or missing role |
| 500 | Internal server error |

```json

{
    "success": true,
    "data": {
        "message": "User role updated successfully.",
        "user": {
            "_id": "6a634ff1653c02679df3cfc0",
            "username": "maryam.asif",
            "name": "Maryam Asif",
            "email": "maryam.asif@example.com",
            "role": "space_admin",
            "organizationId": null,
            "photoUrl": "https://i.pravatar.cc/300?img=8",
            "phone": "+923001111118",
            "isVerified": true,
            "isActive": true,
            "updatedAt": "2026-07-24T12:11:34.128Z"
        }
    }
}
```

## Frontend Usage (PRD)

Used in the **Admin User Management** page where the Super Admin assigns or updates user roles. This supports the PRD's Role-Based Access Control, allowing administrators to define which users can manage resources or bookings.

## Models Used

- User

## Notes
- Prevents changing the Super Admin's role.
- Prevents users from changing their own role.
- Restricts allowed roles correctly.

---

# Controller: updateUserStatus

## Purpose

Updates the active status (`isActive`) of a user account. This allows administrators to activate or deactivate user accounts without permanently deleting them.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| PATCH | `/api/users/:id/status` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (`super_admin`, `space_admin`) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Example Request

```http
PATCH /api/users/6875e1d8f0c7d3a8d9f12345/status
Authorization: Bearer <JWT_TOKEN>
```

```json
{
  "isActive": false
}
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | User status updated successfully. |
| 400 | Invalid user ID or attempting to deactivate own account. |
| 401 | Authentication required. |
| 403 | Space Admin tried to update a user from another organization. |
| 404 | User not found. |
| 422 | `isActive` value is missing or invalid. |
| 500 | Internal server error. |

## Frontend Usage (PRD)

Used in the **Admin User Management** page where Super Admins and Space Admins can enable or disable user accounts. This supports the PRD's role-based user management by allowing administrators to control account access without deleting user records.

## Models Used

- User

## Notes

- ✅ Prevents administrators from deactivating their own account.
- ✅ Space Admins can only update users within their own organization.
- ⚠️ Implements a soft deactivation instead of permanently deleting user records, which is a good practice.

---

# Controller: deleteUser

## Purpose

Soft deletes a user account by marking it as inactive instead of permanently removing it from the database.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| DELETE | `/api/users/:id` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (`super_admin`) |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Example Request

```http
DELETE /api/users/6875e1d8f0c7d3a8d9f12345
Authorization: Bearer <JWT_TOKEN>
```

## Expected Responses

| Status | Description |
|--------|-------------|
| 200 | User deleted successfully. |
| 400 | Invalid user ID or attempting to delete own account. |
| 401 | Authentication required. |
| 403 | Attempt to delete a Super Admin account. |
| 404 | User not found. |
| 500 | Internal server error. |

## Frontend Usage (PRD)

Used in the **Super Admin User Management** panel when an administrator wants to remove a user from the platform. Since the account is only marked as inactive, the user data is preserved for future reference, reporting, and audit purposes.

## Models Used

- User

## Notes

- ✅ Prevents deletion of Super Admin accounts.
- ✅ Prevents users from deleting their own account.
- ✅ Implements a soft delete by setting `isActive = false`, preserving historical data.


---
# Module 3: Organization Management

# Controller: createOrganization

## Purpose

Creates a new organization in the system. This API is used by the Super Admin to register a new organization before assigning a Space Admin, creating resources, and managing bookings.

## API Details

| HTTP Method | Endpoint |
|-------------|----------|
| POST | `/api/organizations` |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| Authentication (`protect`) | Yes |
| Authorization (`authorize`) | Yes |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Organization name. |
| `description` | String | ❌ No | Organization description. |
| `address` | String | ❌ No | Organization address. |
| `city` | String | ❌ No | City name. |
| `country` | String | ❌ No | Country name. |
| `timezone` | String | ❌ No | Organization timezone (Default: UTC). |
| `logoUrl` | String | ❌ No | Organization logo URL. |

## Example Request

```http
POST /api/organizations
Authorization: Bearer <SUPER_ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "name": "FAST University",
  "description": "Main Campus",
  "address": "Islamabad",
  "city": "Islamabad",
  "country": "Pakistan",
  "timezone": "Asia/Karachi",
  "logoUrl": "https://example.com/logo.png"
}
```

## Example Responses

### ✅ 201 Created

```json
{
    "success": true,
    "data": {
        "message": "Organization created successfully.",
        "organization": {
            "name": "FAST University",
            "description": "Main Campus",
            "address": "Islamabad",
            "city": "Islamabad",
            "country": "Pakistan",
            "timezone": "Asia/Karachi",
            "logoUrl": "https://example.com/logo.png",
            "isActive": true,
            "createdBy": "6a634ff1653c02679df3cfb9",
            "_id": "6a635a0dd02da04a5da10f41",
            "createdAt": "2026-07-24T12:26:53.964Z",
            "updatedAt": "2026-07-24T12:26:53.964Z",
            "__v": 0
        }
    }
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Request status. |
| `data.message` | String | Success message. |
| `data.organization` | Object | Newly created organization. |
| `data.organization._id` | String | Organization ID. |
| `data.organization.name` | String | Organization name. |
| `data.organization.isActive` | Boolean | Organization status. |
| `data.organization.createdBy` | String | Super Admin who created the organization. |

### ❌ 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_EXISTS",
    "message": "Organization with this name already exists."
  }
}
```

### ❌ 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Organization name is required."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to perform this action."
  }
}
```

### ❌ 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong."
  }
}
```

## Frontend Usage (According to PRD)

Used on the **Super Admin → Organization Management** page. When the Super Admin submits the **Create Organization** form, the frontend sends this request to register a new organization. After a successful response, the frontend can redirect the administrator to assign a Space Admin, create resources, or display the newly created organization in the organizations list.

## Models Used

- Organization
- AuditLog

## Notes

- ✅ Only Super Admins can create organizations.
- ✅ Prevents duplicate organization names.
- ✅ Automatically records the creator (`createdBy`).
- ✅ Stores the action in the Audit Log.
- 💡 **Testing Role:** Login as a **Super Admin** before testing this API in Postman.
---

# Controller: getOrganizations

## Purpose

Retrieves all organizations registered in the system. This API is only accessible by the Super Admin.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Organization |
| Controller | `getOrganizations` |
| Method | GET |
| Endpoint | `/api/organizations` |
| Authentication | Yes |
| Authorization | Super Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| Authentication (`protect`) | Yes |
| Authorization (`authorize`) | Yes |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

No request body is required.

## Example Request

```http
GET /api/organizations
Authorization: Bearer <SUPER_ADMIN_TOKEN>
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "_id": "6875f9dc41b0c4b6fd8f3211",
        "name": "FAST University",
        "description": "Main Campus",
        "city": "Islamabad",
        "country": "Pakistan",
        "timezone": "Asia/Karachi",
        "isActive": true,
        "createdBy": {
          "_id": "6875f0ab41b0c4b6fd8f1111",
          "name": "Admin",
          "email": "admin@example.com"
        }
      }
    ]
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to perform this action."
  }
}
```

### ❌ 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong."
  }
}
```

## Frontend Usage (PRD)

Used on the **Organization Management** screen to display all organizations available in the platform.

## Models Used

- Organization

## Notes

- ✅ Returns creator information using `populate()`.
- 💡 **Testing Role:** Super Admin.

---

# Controller: getOrganizationById

## Purpose

Retrieves detailed information for a single organization.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Organization |
| Controller | `getOrganizationById` |
| Method | GET |
| Endpoint | `/api/organizations/:id` |
| Authentication | Yes |
| Authorization | Super Admin, Space Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| Authentication (`protect`) | Yes |
| Authorization (`authorize`) | Yes |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

No request body is required.

## Example Request

```http
GET /api/organizations/6875f9dc41b0c4b6fd8f3211
Authorization: Bearer <JWT_TOKEN>
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "organization": {
      "_id": "6875f9dc41b0c4b6fd8f3211",
      "name": "FAST University",
      "description": "Main Campus",
      "city": "Islamabad",
      "country": "Pakistan",
      "timezone": "Asia/Karachi",
      "createdBy": {
        "_id": "6875f0ab41b0c4b6fd8f1111",
        "name": "Admin",
        "email": "admin@example.com"
      }
    }
  }
}
```

### ❌ 400 Invalid ID

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid organization id."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

## Frontend Usage (PRD)

Used when opening an organization's profile to display its complete information.

## Models Used

- Organization

## Notes

- 💡 **Testing Role:** Super Admin or Space Admin.

---

# Controller: updateOrganization

## Purpose

Updates an organization's information.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Organization |
| Controller | `updateOrganization` |
| Method | PATCH |
| Endpoint | `/api/organizations/:id` |
| Authentication | Yes |
| Authorization | Super Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| Authentication (`protect`) | Yes |
| Authorization (`authorize`) | Yes |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

| Field | Type | Required |
|-------|------|----------|
| `name` | String | ❌ No |
| `description` | String | ❌ No |
| `address` | String | ❌ No |
| `city` | String | ❌ No |
| `country` | String | ❌ No |
| `timezone` | String | ❌ No |
| `logoUrl` | String | ❌ No |
| `isActive` | Boolean | ❌ No |

## Example Request

```json
{
  "name": "FAST Lahore",
  "city": "Lahore",
  "isActive": true
}
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Organization updated successfully.",
    "organization": {
      "_id": "6875f9dc41b0c4b6fd8f3211",
      "name": "FAST Lahore",
      "city": "Lahore",
      "isActive": true
    }
  }
}
```

### ❌ 400 Invalid ID

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid organization id."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

### ❌ 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_EXISTS",
    "message": "Organization name already exists."
  }
}
```

## Frontend Usage (PRD)

Used by the **Super Admin** to update organization details from the **Organization Management** page.

## Models Used

- Organization
- AuditLog

## Notes

- ✅ Supports partial updates.
- ✅ Stores update history in the Audit Log.
- 💡 **Testing Role:** Super Admin.

# Controller: deleteOrganization

## Purpose

Soft deletes an organization by marking it as inactive. An organization cannot be deleted if it still contains active users or active resources.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Organization |
| Controller | `deleteOrganization` |
| Method | DELETE |
| Endpoint | `/api/organizations/:id` |
| Authentication | Yes |
| Authorization | Super Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| Authentication (`protect`) | Yes |
| Authorization (`authorize`) | Yes |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

No request body is required.

## Example Request

```http
DELETE /api/organizations/6875f9dc41b0c4b6fd8f3211
Authorization: Bearer <SUPER_ADMIN_TOKEN>
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Organization deleted successfully."
  }
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Indicates request completed successfully. |
| `data.message` | String | Confirmation message. |

### ❌ 400 Invalid Organization ID

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid organization id."
  }
}
```

### ❌ 400 Organization Not Empty

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_NOT_EMPTY",
    "message": "Cannot delete organization because it still contains active users or resources."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to perform this action."
  }
}
```

### ❌ 404 Organization Not Found

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

### ❌ 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong."
  }
}
```

## Frontend Usage (According to PRD)

Used on the **Organization Management** page when the **Super Admin** removes an organization. Before allowing deletion, the frontend should inform the administrator that organizations with active users or resources cannot be deleted.

## Models Used

- Organization
- User
- Resource
- AuditLog

## Notes

- ✅ Implements a soft delete (`isActive = false`).
- ✅ Prevents deleting organizations containing active users or resources.
- ✅ Records the action in the Audit Log.
- 💡 **Testing Role:** Super Admin.

---

# Controller: assignSpaceAdmin

## Purpose

Assigns a verified user as the Space Admin of an organization. The selected user is linked to the organization and their role is updated to `space_admin`.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Organization |
| Controller | `assignSpaceAdmin` |
| Method | POST |
| Endpoint | `/api/organizations/:id/space-admin` |
| Authentication | Yes |
| Authorization | Super Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| Authentication (`protect`) | Yes |
| Authorization (`authorize`) | Yes |

### Allowed Roles

- ✅ Super Admin
- ❌ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | ObjectId | ✅ Yes | User to be assigned as Space Admin. |

## Example Request

```http
POST /api/organizations/6875f9dc41b0c4b6fd8f3211/space-admin
Authorization: Bearer <SUPER_ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "userId": "6875e1d8f0c7d3a8d9f12345"
}
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Space Admin assigned successfully.",
    "user": {
      "_id": "6875e1d8f0c7d3a8d9f12345",
      "name": "Ali Khan",
      "email": "ali@example.com",
      "role": "space_admin",
      "organizationId": "6875f9dc41b0c4b6fd8f3211",
      "isVerified": true,
      "isActive": true
    }
  }
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Request status. |
| `data.message` | String | Success message. |
| `data.user` | Object | Updated user details. |
| `data.user.role` | String | Updated role (`space_admin`). |
| `data.user.organizationId` | String | Assigned organization ID. |

### ❌ 400 Invalid ID

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid organization id."
  }
}
```

### ❌ 400 User Not Verified

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_VERIFIED",
    "message": "User must verify the account before becoming Space Admin."
  }
}
```

### ❌ 400 User Already Assigned

```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_ASSIGNED",
    "message": "User already belongs to another organization."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to perform this action."
  }
}
```

### ❌ 404 Organization Not Found

```json
{
  "success": false,
  "error": {
    "code": "ORGANIZATION_NOT_FOUND",
    "message": "Organization not found."
  }
}
```

### ❌ 404 User Not Found

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found."
  }
}
```

### ❌ 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong."
  }
}
```

## Frontend Usage (According to PRD)

After creating an organization, the **Super Admin** uses this API from the **Organization Management** page to assign a verified user as the Space Admin. Once assigned, the user gains permission to manage resources, bookings, calendars, and members for that organization.

## Models Used

- Organization
- User
-AuditLog

## Notes

- ✅ Only verified users can become Space Admins.
- ✅ Prevents assigning users already linked to another organization.
- 💡 **Testing Role:** Super Admin only.
---

# Module 4: Resource Management
---

# Controller: createResource

## Purpose

Creates a new resource (e.g., room, lab, desk, equipment, vehicle, court, etc.) within the logged-in Space Admin's organization. This resource can later be used for bookings, calendars, and approvals.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Resource |
| Controller | `createResource` |
| Method | POST |
| Endpoint | `/api/resources` |
| Authentication | Yes |
| Authorization | Yes (Space Admin) |
| Tested By | Space Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes |

### Allowed Roles

- ❌ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Resource name. |
| `type` | Enum | ✅ Yes | `room`, `lab`, `desk`, `equipment`, `vehicle`, `court`, `other` |
| `building` | String | ❌ No | Building name. |
| `location` | String | ❌ No | Resource location. |
| `capacity` | Number | ❌ No | Maximum capacity (Default: 1). |
| `amenities` | Array<String> | ❌ No | Available facilities. |
| `photoUrl` | String | ❌ No | Resource image URL. |
| `requiresApproval` | Boolean | ❌ No | Whether booking requires approval. |
| `bufferTime` | Number | ❌ No | Buffer time between bookings. |
| `accessGroupId` | ObjectId | ❌ No | Assigned Access Group. |

## Example Request

```http
POST /api/resources
Authorization: Bearer <SPACE_ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "name": "Conference Room A",
  "type": "room",
  "building": "Block A",
  "location": "First Floor",
  "capacity": 20,
  "amenities": [
    "Projector",
    "WiFi"
  ],
  "requiresApproval": true,
  "bufferTime": 15
}
```

## Example Responses

### ✅ 201 Created

```json
{
  "success": true,
  "data": {
    "message": "Resource created successfully.",
    "resource": {
      "_id": "6876...",
      "name": "Conference Room A",
      "type": "room",
      "organizationId": "...",
      "capacity": 20,
      "requiresApproval": true,
      "bufferTime": 15,
      "isActive": true
    }
  }
}
```

### ❌ 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name and type are required."
  }
}
```

### ❌ 404 User Not Found

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found."
  }
}
```

### ❌ 409 Resource Exists

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_EXISTS",
    "message": "A resource with this name already exists."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to perform this action."
  }
}
```

## Frontend Usage (According to PRD)

Used by the **Space Admin** from the **Resource Management** page to create resources that members can later search, view in the calendar, and book.

## Models Used

- Resource
- User
- AuditLog
- AccessGroup



---

# Controller: getResources

## Purpose

Returns all active resources belonging to the logged-in user's organization with optional search and type filters.

## Quick Reference

| Item | Value |
|------|-------|
| Module | Resource |
| Controller | `getResources` |
| Method | GET |
| Endpoint | `/api/resources` |
| Authentication | Yes |
| Authorization | Any Authenticated User |
| Tested By | Space Admin / Member / Guest |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin (if authenticated)
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Query Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | String | ❌ No | Search resources by name. |
| `type` | String | ❌ No | Filter by resource type. |

## Example Request

```http
GET /api/resources?search=room&type=room
Authorization: Bearer <TOKEN>
```

## Example Response

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "_id": "6876...",
        "name": "Conference Room A",
        "type": "room",
        "capacity": 20,
        "building": "Block A",
        "location": "First Floor",
        "requiresApproval": true,
        "createdBy": {
          "name": "Ali",
          "email": "ali@test.com"
        },
        "accessGroupId": {
          "_id": "...",
          "name": "Faculty"
        }
      }
    ]
  }
}
```

### ❌ 404 User Not Found

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

## Frontend Usage (According to PRD)

This API powers the **Browse Resources** page. Members, Guests, and Space Admins use it to search, filter, and select resources before checking availability or creating a booking.

## Models Used

- Resource
- User
---
# Controller: getResourceById

## Purpose

Retrieves the complete details of a specific resource.

For security, this endpoint only allows users to view resources that belong to their own organization. Super Admins can view resources from any organization.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | GET |
| Endpoint | `/api/resources/:id` |
| Authentication | Yes |
| Authorization | Organization-level access control |
| Allowed Roles | Super Admin, Space Admin, Member, Guest |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

### Access Rules

- **Super Admin:** Can retrieve any resource.
- **Space Admin:** Can retrieve resources belonging to their organization only.
- **Member:** Can retrieve resources belonging to their organization only.
- **Guest:** Can retrieve resources belonging to their organization only.

If a user attempts to access a resource belonging to another organization, the request is rejected with **403 Forbidden**.

---

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` (URL Parameter) | ObjectId | ✅ Yes | Resource ID |

---

## Example Request

```http
GET /api/resources/685bc7e2a4d25c2c95f73d10
Authorization: Bearer <TOKEN>
```

---

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "resource": {
      "_id": "685bc7e2a4d25c2c95f73d10",
      "name": "Conference Room A",
      "type": "room",
      "organizationId": {
        "_id": "685...",
        "name": "FAST University"
      },
      "accessGroupId": {
        "_id": "684...",
        "name": "Faculty"
      },
      "building": "Block A",
      "location": "First Floor",
      "capacity": 20,
      "amenities": [
        "Projector",
        "WiFi"
      ],
      "photoUrl": "https://...",
      "requiresApproval": true,
      "bufferTime": 15,
      "isActive": true,
      "createdBy": {
        "_id": "684...",
        "name": "Ali Khan",
        "email": "ali@test.com"
      },
      "createdAt": "2026-07-20T08:00:00.000Z",
      "updatedAt": "2026-07-22T10:30:00.000Z"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid resource id."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to access this resource."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}
```

---

## Frontend Usage (According to PRD)

This API is called when a user selects a resource from the resource listing to view its complete information before:

- Creating a booking
- Viewing resource details
- Checking resource capacity
- Viewing available amenities
- Determining whether approval is required
- Displaying the assigned access group

The frontend should only request resources that belong to the currently logged-in user's organization. If the backend returns **403 Forbidden**, the frontend should redirect the user or display an authorization error message.

---

## Models Used

- Resource
- User
- Organization
- AccessGroup

---

## Backend Review

- Validates the Resource ID.
- Retrieves populated organization, creator, and access group information.
- Returns a 404 error if the resource does not exist.
- Restricts access based on organization membership.
- Allows Super Admin to access resources across all organizations.

### Security

- Prevents authenticated users from viewing resources belonging to another organization.
- Enforces organization-level data isolation, ensuring users only access resources they are authorized to view.
---

# Controller: updateResource

## Purpose

Updates the details of an existing resource.

This endpoint allows a **Space Admin** to modify resource information such as its name, type, location, capacity, amenities, approval requirement, buffer time, and assigned access group. Before updating, the backend validates the input data and ensures the resource belongs to the Space Admin's organization.

---

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | PATCH |
| Endpoint | `/api/resources/:id` |
| Authentication | Yes |
| Authorization | Yes (Organization Ownership Verification) |
| Allowed Roles | Space Admin |

---

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes |

### Allowed Roles

- ❌ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

---

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ❌ No | Updated resource name |
| `type` | Enum | ❌ No | Resource type (`room`, `lab`, `desk`, `equipment`, `vehicle`, `court`, `other`) |
| `building` | String | ❌ No | Building name |
| `location` | String | ❌ No | Resource location |
| `capacity` | Number | ❌ No | Capacity (minimum value: **1**) |
| `amenities` | String[] | ❌ No | List of available amenities |
| `photoUrl` | String | ❌ No | Resource image URL |
| `requiresApproval` | Boolean | ❌ No | Whether bookings require approval |
| `bufferTime` | Number | ❌ No | Buffer time (minutes) between bookings |
| `accessGroupId` | ObjectId | ❌ No | Access Group assigned to the resource |

---

## Example Request

```http
PATCH /api/resources/685bc7e2a4d25c2c95f73d10
Authorization: Bearer <SPACE_ADMIN_TOKEN>
```

```json
{
  "capacity": 30,
  "location": "Second Floor",
  "requiresApproval": false,
  "accessGroupId": "685bc7e2a4d25c2c95f74111"
}
```

---

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Resource updated successfully.",
    "resource": {
      "_id": "685bc7e2a4d25c2c95f73d10",
      "name": "Conference Room A",
      "capacity": 30,
      "location": "Second Floor",
      "requiresApproval": false,
      "accessGroupId": "685bc7e2a4d25c2c95f74111"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid resource id."
  }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid access group id."
  }
}
```

---

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to update this resource."
  }
}
```

---

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "ACCESS_GROUP_NOT_FOUND",
    "message": "Access group not found."
  }
}
```

---

### ❌ 422 Unprocessable Entity

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid resource type."
  }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Capacity must be at least 1."
  }
}
```

---

## Frontend Usage (According to PRD)

This endpoint is used from the **Edit Resource** page.

The frontend allows a Space Admin to update resource information such as:

- Resource name
- Resource type
- Building and location
- Capacity
- Amenities
- Resource image
- Booking approval requirement
- Buffer time
- Assigned Access Group

The frontend should only display Access Groups belonging to the current organization when selecting a new access group.

---

## Models Used

- Resource
- User
- AccessGroup
- AuditLog

---

## Backend Review

- Validates the Resource ID.
- Verifies that the logged-in user exists.
- Ensures the resource belongs to the Space Admin's organization.
- Validates the resource type before updating.
- Ensures capacity is greater than or equal to **1**.
- Validates the Access Group ID.
- Confirms the Access Group belongs to the same organization.
- Records every successful update in the Audit Log.
- Returns the updated resource after saving.

### Security

- Prevents Space Admins from updating resources belonging to another organization.
- Prevents assigning resources to invalid or external Access Groups.
- Prevents invalid resource types and capacities from being stored in the database.
- Maintains an audit trail of all resource update operations for accountability.
---

# Controller: updateResourceStatus

## Purpose

Activates or deactivates a resource without permanently deleting it.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | PATCH |
| Endpoint | `/api/resources/:id/status` |
| Authentication | Yes |
| Authorization | Yes |
| Allowed Roles | Space Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes |

### Allowed Roles

- ❌ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | Boolean | ✅ Yes | Resource status |

## Example Request

```http
PATCH /api/resources/685bc7e2a4d25c2c95f73d10/status
Authorization: Bearer <SPACE_ADMIN_TOKEN>
```

```json
{
  "isActive": false
}
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Resource status updated successfully.",
    "resource": {
      "_id": "685bc7e2a4d25c2c95f73d10",
      "name": "Conference Room A",
      "isActive": false
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid resource id."
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to update this resource."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}
```

### ❌ 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "isActive must be true or false."
  }
}
```

## Frontend Usage (According to PRD)

This API is used when the **Space Admin** enables or disables a resource from the **Resource Management** page. Inactive resources cannot be booked but remain stored in the system.

## Models Used

- Resource
- User
- AuditLog

## Backend Review

- ✅ Validates `isActive` before updating.
- ✅ Verifies that the resource belongs to the logged-in Space Admin's organization.
- ✅ Creates an audit log for activation/deactivation.
- 💡 Consider preventing deactivation if the resource has active or upcoming bookings.

---

# Controller: deleteResource

## Purpose

Soft deletes a resource by marking it as **inactive** (`isActive = false`) instead of permanently removing it from the database.

Before deleting the resource, the backend verifies that:
- The resource exists.
- The logged-in Space Admin belongs to the same organization.
- The resource has **no active or upcoming bookings**.

This prevents accidental deletion of resources that are still reserved and preserves historical booking data.

---

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | DELETE |
| Endpoint | `/api/resources/:id` |
| Authentication | Yes |
| Authorization | Yes (Organization Ownership Verification) |
| Allowed Roles | Space Admin |

---

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes |

### Allowed Roles

- ❌ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

---

## Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` (URL Parameter) | ObjectId | ✅ Yes | Resource ID |

---

## Example Request

```http
DELETE /api/resources/685bc7e2a4d25c2c95f73d10
Authorization: Bearer <SPACE_ADMIN_TOKEN>
```

---

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Resource deleted successfully."
  }
}
```

---

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid resource id."
  }
}
```

or

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_HAS_ACTIVE_BOOKINGS",
    "message": "Resource has active or upcoming bookings and cannot be deleted."
  }
}
```

---

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required."
  }
}
```

---

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to delete this resource."
  }
}
```

---

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}
```

---

## Frontend Usage (According to PRD)

This API is used from the **Delete Resource** action in the **Resource Management** module.

When a Space Admin chooses to delete a resource:

1. The frontend sends the Resource ID to this endpoint.
2. The backend checks whether the resource has any active or upcoming bookings.
3. If future bookings exist, the deletion is rejected and the frontend should display the returned error message.
4. Otherwise, the resource is **soft deleted** by setting `isActive = false`.

Since the resource is not permanently removed, historical bookings, reports, and audit logs remain intact.

---

## Models Used

- Resource
- User
- Booking
- AuditLog
---

## Backend Review

- Validates the Resource ID.
- Verifies the authenticated user.
- Ensures the resource exists.
- Restricts deletion to the Space Admin of the same organization.
- Prevents deletion when active or upcoming bookings exist.
- Performs a soft delete by setting `isActive = false`.
- Records the deletion in the Audit Log for traceability.

### Security

- Prevents unauthorized users from deleting resources belonging to another organization.
- Preserves historical booking data by using soft deletion.
- Prevents orphaned bookings by blocking deletion of resources that still have active or upcoming reservations.
- Maintains a complete audit trail of resource deletion operations.
```
---
# Module 5: Booking Management

## Module Overview

The **Booking Management** module is the core functionality of the Resource Booking Platform. It allows authenticated users to reserve organizational resources such as rooms, labs, desks, equipment, vehicles, and courts. The module manages the complete booking lifecycle, including booking creation, updates, cancellations, approvals, recurring bookings, check-ins, and conflict prevention while ensuring resource availability.

---

## Models Used

| Model | Purpose |
|--------|---------|
| **Booking** | Stores complete booking information including resource, user, time slot, booking status, attendees, notes, and check-in status. |
| **Resource** | Verifies resource availability, approval requirements, and capacity. |
| **User** | Identifies the booking owner and organization. |
| **Approval** | Created when a booking requires administrator approval. |
| **CheckIn** | Stores the user's check-in record after arriving for the booking. |
| **RecurringBooking** | Stores recurring booking schedules for repeated reservations. |
| **BlackoutDate** | Prevents bookings during maintenance or blocked dates. |
| **AuditLog** | Records all booking-related activities for auditing purposes. |

---

## Fields Used for Creating a Booking

| Field | Type | Required |
|-------|------|----------|
| `resourceId` | ObjectId | ✅ Yes |
| `title` | String | ✅ Yes |
| `attendeeCount` | Number | ❌ No |
| `notes` | String | ❌ No |
| `startTime` | Date | ✅ Yes |
| `endTime` | Date | ✅ Yes |

---

The Booking Management module allows authenticated users to reserve organizational resources. It validates resource availability, checks booking conflicts, verifies blackout dates, supports recurring bookings, creates approval requests when required, sends notifications, and records audit logs. It is responsible for managing the complete booking lifecycle.

---

# Controller: createBooking

## Purpose

Creates a new booking for a selected resource after validating resource availability, booking conflicts, blackout dates, capacity, and approval requirements. It also supports recurring bookings and generates notifications and audit logs.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | POST |
| Endpoint | `/api/bookings` |
| Authentication | Yes |
| Authorization | No |
| Allowed Roles | Super Admin, Space Admin, Member, Guest |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Request Fields

| Field | Required | Description |
|-------|----------|-------------|
| `resourceId` | ✅ Yes | Resource to book |
| `title` | ✅ Yes | Booking title |
| `attendeeCount` | ❌ No | Number of attendees |
| `notes` | ❌ No | Additional notes |
| `startTime` | ✅ Yes | Booking start time |
| `endTime` | ✅ Yes | Booking end time |
| `rrule` | ❌ No | Recurring booking rule |

## Example Request

```http
POST /api/bookings
Authorization: Bearer <TOKEN>
```

```json
{
  "resourceId": "685ab1234de45f2345678901",
  "title": "Weekly Team Meeting",
  "attendeeCount": 8,
  "notes": "Sprint Planning",
  "startTime": "2026-07-25T09:00:00Z",
  "endTime": "2026-07-25T10:00:00Z",
  "rrule": "FREQ=WEEKLY;COUNT=5"
}
```

## Example Responses

### ✅ 201 Created

```json
{
  "success": true,
  "data": {
    "message": "Booking created successfully.",
    "booking": {
      "_id": "686123abc456",
      "resourceId": "685ab1234de45f2345678901",
      "userId": "685cd5678ab901234567890",
      "title": "Weekly Team Meeting",
      "attendeeCount": 8,
      "notes": "Sprint Planning",
      "status": "approved",
      "checkedIn": false,
      "startTime": "2026-07-25T09:00:00Z",
      "endTime": "2026-07-25T10:00:00Z"
    }
  }
}
```

### ✅ If Resource Requires Approval

```json
{
  "success": true,
  "data": {
    "message": "Booking submitted for approval.",
    "booking": {
      "status": "pending"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid resource id."
  }
}
```

Or

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_INACTIVE",
    "message": "Resource is inactive."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Resource belongs to another organization."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}
```

### ❌ 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "This resource is already booked for the selected time."
  }
}
```

Or

```json
{
  "success": false,
  "error": {
    "code": "BLACKOUT_DATE",
    "message": "This resource is unavailable during the selected time."
  }
}
```

### ❌ 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields."
  }
}
```

Or

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TIME",
    "message": "End time must be after start time."
  }
}
```

Or

```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "Attendee count exceeds resource capacity."
  }
}
```

## Automatically Assigned Fields

- `userId`
- `status`
- `checkedIn`
- `recurringBookingId` *(when applicable)*
- `createdAt`
- `updatedAt`

## Frontend Usage (According to PRD)

The frontend calls this API when a user submits the booking form after selecting a resource, date, and time. The controller automatically validates booking conflicts, blackout dates, resource capacity, approval requirements, creates recurring bookings when requested, generates notifications, and records audit logs.

---

# Controller: getBookings

## Purpose

Retrieves bookings for the authenticated user. Members and Guests receive only their own bookings, while administrators can access all bookings. Supports filtering by booking status.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | GET |
| Endpoint | `/api/bookings` |
| Authentication | Yes |
| Authorization | No |
| Allowed Roles | Super Admin, Space Admin, Member, Guest |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Query Parameters

| Parameter | Required |
|-----------|----------|
| `status` | ❌ No |

## Example Request

```http
GET /api/bookings?status=approved
Authorization: Bearer <TOKEN>
```

## Example Response

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "686123abc456",
        "title": "Weekly Team Meeting",
        "status": "approved",
        "startTime": "2026-07-25T09:00:00Z",
        "endTime": "2026-07-25T10:00:00Z",
        "resourceId": {
          "name": "Conference Room A",
          "type": "room"
        },
        "userId": {
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found."
  }
}
```

## Frontend Usage (According to PRD)

This API powers both the **Booking Management** page and the **My Bookings** page. Members and Guests receive only their own bookings, while administrators can view all bookings. It also supports filtering bookings by status.

---

# Controller: getBookingById

## Purpose

Retrieves complete details of a specific booking.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | GET |
| Endpoint | `/api/bookings/:id` |
| Authentication | Yes |
| Authorization | No |
| Allowed Roles | Super Admin, Space Admin, Member, Guest |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Request Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` (URL Parameter) | ✅ Yes | Booking ID |

## Example Request

```http
GET /api/bookings/686123abc456
Authorization: Bearer <TOKEN>
```

## Example Response

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "booking": {
      "_id": "686123abc456",
      "title": "Weekly Team Meeting",
      "status": "approved",
      "checkedIn": false,
      "resourceId": {
        "_id": "685ab1234de45f2345678901",
        "name": "Conference Room A"
      },
      "userId": {
        "_id": "685cd5678ab901234567890",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid booking id."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found."
  }
}
```

## Frontend Usage (According to PRD)

The frontend uses this API to display complete booking details on the **Booking Details** page before allowing users to edit, approve, reject, cancel, or check in to a booking.

---

# Controller: updateBooking

## Purpose

Updates an existing booking while validating booking ownership, booking conflicts, blackout dates, recurring bookings, and time constraints before saving the changes.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | PATCH |
| Endpoint | `/api/bookings/:id` |
| Authentication | Yes |
| Authorization | No (Ownership checked inside controller) |
| Allowed Roles | Booking Owner, Super Admin, Space Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Booking Owner
- ✅ Super Admin
- ✅ Space Admin

## Request Fields

| Field | Required |
|-------|----------|
| `title` | ❌ No |
| `attendeeCount` | ❌ No |
| `notes` | ❌ No |
| `startTime` | ❌ No |
| `endTime` | ❌ No |
| `rrule` | ❌ No |

## Example Request

```http
PATCH /api/bookings/686123abc456
Authorization: Bearer <TOKEN>
```

```json
{
  "title": "Updated Weekly Meeting",
  "attendeeCount": 12,
  "notes": "Updated Agenda",
  "startTime": "2026-07-28T09:00:00Z",
  "endTime": "2026-07-28T10:00:00Z",
  "rrule": "FREQ=WEEKLY;COUNT=10"
}
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Booking updated successfully.",
    "booking": {
      "_id": "686123abc456",
      "title": "Updated Weekly Meeting",
      "status": "approved",
      "startTime": "2026-07-28T09:00:00Z",
      "endTime": "2026-07-28T10:00:00Z"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid booking id."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to update this booking."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found."
  }
}
```

### ❌ 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Selected time slot is already booked."
  }
}
```

Or

```json
{
  "success": false,
  "error": {
    "code": "BLACKOUT_DATE",
    "message": "Resource is unavailable during the selected time."
  }
}
```

### ❌ 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TIME",
    "message": "End time must be after start time."
  }
}
```

## Frontend Usage (According to PRD)

Used when users edit an existing booking. The frontend submits only the updated fields, while the backend validates booking ownership, booking conflicts, blackout dates, recurring bookings, notifications, and audit logs before saving the changes.

---

# Controller: updateBookingStatus

## Purpose

Updates the status of a booking. This controller is primarily used by administrators to approve, reject, cancel, or complete booking requests.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | PATCH |
| Endpoint | `/api/bookings/:id/status` |
| Authentication | Yes |
| Authorization | Yes |
| Allowed Roles | Super Admin, Space Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Request Fields

| Field | Required |
|-------|----------|
| `status` | ✅ Yes |

### Allowed Values

- `pending`
- `approved`
- `rejected`
- `cancelled`
- `completed`

## Example Request

```http
PATCH /api/bookings/686123abc456/status
Authorization: Bearer <TOKEN>
```

```json
{
  "status": "approved"
}
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Booking status updated successfully.",
    "booking": {
      "_id": "686123abc456",
      "status": "approved"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid booking id."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found."
  }
}
```

### ❌ 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid booking status."
  }
}
```

## Frontend Usage (According to PRD)

Used by the **Approval Management** screen. After reviewing a booking request, administrators use this API to approve, reject, complete, or cancel bookings.

---

# Controller: cancelBooking

## Purpose

Cancels an existing booking by changing its status to `cancelled`. The controller also removes recurring booking information (when applicable), generates notifications, and records audit logs.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | DELETE |
| Endpoint | `/api/bookings/:id` |
| Authentication | Yes |
| Authorization | No (Ownership checked inside controller) |
| Allowed Roles | Booking Owner, Super Admin |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Booking Owner
- ✅ Super Admin

## Request Fields

No request body is required.

## Example Request

```http
DELETE /api/bookings/686123abc456
Authorization: Bearer <TOKEN>
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Booking cancelled successfully.",
    "booking": {
      "_id": "686123abc456",
      "status": "cancelled"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid booking id."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to cancel this booking."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found."
  }
}
```

## Frontend Usage (According to PRD)

Used when a user clicks **Cancel Booking** from **My Bookings**, or when a **Super Admin** cancels an inappropriate booking. The controller also removes recurring booking information (if any), generates notifications, and stores an audit log.

---

# Controller: checkInBooking

## Purpose

Allows the booking owner to check in after arriving at the reserved resource. The controller records the check-in, updates the booking, generates notifications, and stores audit logs.

## Quick Reference

| Item | Value |
|------|-------|
| HTTP Method | PATCH |
| Endpoint | `/api/bookings/:id/check-in` |
| Authentication | Yes |
| Authorization | No (Ownership checked inside controller) |
| Allowed Roles | Booking Owner |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | No |

### Allowed Roles

- ✅ Booking Owner

## Request Fields

No request body is required.

## Example Request

```http
PATCH /api/bookings/686123abc456/check-in
Authorization: Bearer <TOKEN>
```

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Checked in successfully.",
    "checkIn": {
      "_id": "687xyz987",
      "bookingId": "686123abc456",
      "userId": "685cd5678ab901234567890",
      "checkInTime": "2026-07-28T09:02:10Z"
    }
  }
}
```

### ❌ 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_BOOKING_STATUS",
    "message": "Only approved bookings can be checked in."
  }
}
```

Or

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid booking id."
  }
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not authorized to check in for this booking."
  }
}
```

### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found."
  }
}
```

### ❌ 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "You have already checked in."
  }
}
```

## Frontend Usage (According to PRD)

The frontend calls this API when the booking owner presses the **Check In** button after arriving at the reserved resource. The controller records the check-in, marks the booking as completed, sends a notification, and stores an audit log. This functionality supports attendance tracking and resource utilization monitoring as described in the PRD.

# Module 6: Approval Management

The **Approval Management Module** handles booking approval workflows for resources that require administrator approval. It allows Super Admins and Space Admins to review pending booking requests, approve or reject them, and maintain approval records for auditing purposes.

---

## Controller: getApprovals

### Purpose

Retrieves all booking approval requests. Super Admins and Space Admins can optionally filter approvals by their status.

### API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | GET |
| **Endpoint** | `/api/approvals` |
| **Authentication** | Yes |
| **Authorization** | Yes (Super Admin, Space Admin) |

### Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (Super Admin, Space Admin) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

### Query Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| status | String (`pending`, `approved`, `rejected`) | ❌ No |

### Example Request

```http
GET /api/approvals?status=pending
Authorization: Bearer <TOKEN>
```

### Success Response (200)

```json
{
  "success": true,
  "approvals": [
    {
      "_id": "66b3c8ab12cd345678901234",
      "bookingId": {
        "_id": "66b3c1aa12cd345678901111",
        "resourceId": {
          "_id": "66b3bbaa12cd345678901000",
          "name": "Conference Room A",
          "type": "room"
        },
        "userId": {
          "_id": "66b3bcaa12cd345678901222",
          "name": "Ali Khan",
          "email": "ali@example.com"
        }
      },
      "approvedBy": {
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "status": "pending",
      "reason": null,
      "approvedAt": null,
      "createdAt": "2026-07-23T09:00:00.000Z",
      "updatedAt": "2026-07-23T09:00:00.000Z"
    }
  ]
}
```

### Error Responses

#### 403 Forbidden

```json
{
  "success": false,
  "message": "Forbidden",
  "code": "FORBIDDEN"
}
```

### Frontend Usage (According to PRD)

Used by the **Approval Management** page where Super Admins and Space Admins review pending, approved, or rejected booking requests.

### Models Used

- Approval
- Booking
- User
- Resource

---

## Controller: getApprovalById

### Purpose

Retrieves the details of a specific booking approval request.

### API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | GET |
| **Endpoint** | `/api/approvals/:id` |
| **Authentication** | Yes |
| **Authorization** | Yes (Super Admin, Space Admin) |

### Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (Super Admin, Space Admin) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

### Request Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| id | ObjectId | ✅ Yes |

### Example Request

```http
GET /api/approvals/66b3c8ab12cd345678901234
Authorization: Bearer <TOKEN>
```

### Success Response (200)

```json
{
  "success": true,
  "approval": {
    "_id": "66b3c8ab12cd345678901234",
    "bookingId": {
      "_id": "66b3c1aa12cd345678901111",
      "title": "Weekly Meeting"
    },
    "approvedBy": {
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "status": "approved",
    "reason": "Approved",
    "approvedAt": "2026-07-23T10:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Invalid ID

```json
{
  "success": false,
  "message": "Invalid approval id.",
  "code": "INVALID_ID"
}
```

#### 404 Approval Not Found

```json
{
  "success": false,
  "message": "Approval not found.",
  "code": "APPROVAL_NOT_FOUND"
}
```

### Frontend Usage (According to PRD)

Used when an administrator opens an approval request to view its complete details before making a decision.

### Models Used

- Approval
- Booking
- User

---

## Controller: approveBooking

### Purpose

Approves a pending booking request. The booking status is updated, the approval record is created or updated, and the requester receives an approval notification.

### API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | PATCH |
| **Endpoint** | `/api/approvals/:bookingId/approve` |
| **Authentication** | Yes |
| **Authorization** | Yes (Super Admin, Space Admin) |

### Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (Super Admin, Space Admin) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

### Request Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| bookingId | ObjectId | ✅ Yes |

### Request Body

| Field | Type | Required |
|------|------|----------|
| reason | String | ❌ No |

### Example Request

```http
PATCH /api/approvals/66b3c1aa12cd345678901111/approve
Authorization: Bearer <TOKEN>
```

```json
{
  "reason": "Resource is available."
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Booking approved successfully.",
  "approval": {
    "_id": "66b3c8ab12cd345678901234",
    "bookingId": "66b3c1aa12cd345678901111",
    "approvedBy": "66b3bcaa12cd345678901222",
    "status": "approved",
    "reason": "Resource is available.",
    "approvedAt": "2026-07-23T10:15:00.000Z"
  }
}
```

### Error Responses

#### 400 Invalid Booking ID

```json
{
  "success": false,
  "message": "Invalid booking id.",
  "code": "INVALID_ID"
}
```

#### 400 Already Approved

```json
{
  "success": false,
  "message": "Booking is already approved.",
  "code": "BOOKING_ALREADY_APPROVED"
}
```

#### 400 Already Rejected

```json
{
  "success": false,
  "message": "Booking has already been rejected.",
  "code": "BOOKING_ALREADY_REJECTED"
}
```

#### 404 User Not Found

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

#### 404 Booking Not Found

```json
{
  "success": false,
  "message": "Booking not found.",
  "code": "BOOKING_NOT_FOUND"
}
```

### Frontend Usage (According to PRD)

Used by administrators from the **Approval Management** page to approve pending booking requests.

### Models Used

- Approval
- Booking
- User
- Notification
- AuditLog

---

## Controller: rejectBooking

### Purpose

Rejects a pending booking request. The booking status is updated, the approval record is created or updated, and the requester receives a rejection notification.

### API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | PATCH |
| **Endpoint** | `/api/approvals/:bookingId/reject` |
| **Authentication** | Yes |
| **Authorization** | Yes (Super Admin, Space Admin) |

### Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (Super Admin, Space Admin) |

### Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

### Request Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| bookingId | ObjectId | ✅ Yes |

### Request Body

| Field | Type | Required |
|------|------|----------|
| reason | String | ❌ No |

### Example Request

```http
PATCH /api/approvals/66b3c1aa12cd345678901111/reject
Authorization: Bearer <TOKEN>
```

```json
{
  "reason": "Resource unavailable due to maintenance."
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Booking rejected successfully.",
  "approval": {
    "_id": "66b3c8ab12cd345678901234",
    "bookingId": "66b3c1aa12cd345678901111",
    "approvedBy": "66b3bcaa12cd345678901222",
    "status": "rejected",
    "reason": "Resource unavailable due to maintenance.",
    "approvedAt": "2026-07-23T10:20:00.000Z"
  }
}
```

### Error Responses

#### 400 Invalid Booking ID

```json
{
  "success": false,
  "message": "Invalid booking id.",
  "code": "INVALID_ID"
}
```

#### 400 Already Approved

```json
{
  "success": false,
  "message": "Booking has already been approved.",
  "code": "BOOKING_ALREADY_APPROVED"
}
```

#### 400 Already Rejected

```json
{
  "success": false,
  "message": "Booking is already rejected.",
  "code": "BOOKING_ALREADY_REJECTED"
}
```

#### 404 User Not Found

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

#### 404 Booking Not Found

```json
{
  "success": false,
  "message": "Booking not found.",
  "code": "BOOKING_NOT_FOUND"
}
```

### Frontend Usage (According to PRD)

Used by administrators to reject booking requests that cannot be accommodated due to scheduling conflicts, maintenance, or policy restrictions.

### Models Used

- Approval
- Booking
- User
- Notification
- AuditLog


----------------
# Module 7: Notification Management

The **Notification Management Module** is responsible for creating, retrieving, and managing user notifications throughout the Resource Booking Platform. Notifications are generated for booking confirmations, reminders, approvals, rejections, check-ins, and other important system events. Administrators can also manually send notifications to users.

**Models Used**

| Model | Purpose |
|--------|---------|
| Notification | Stores notification details including recipient, message, type, read status, and related booking. |
| User | Identifies the notification recipient and validates organization ownership. |
| Booking | Links notifications to bookings when applicable. |

---

# Controller: createNotification

## Purpose

Creates a new notification for a user. This API is used by Super Admins and Space Admins to manually send notifications. A Space Admin can only send notifications to users within their own organization.

## API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | POST |
| **Endpoint** | `/api/notifications` |
| **Authentication** | Yes |
| **Authorization** | Yes (Super Admin, Space Admin) |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |
| authorize | Yes (Super Admin, Space Admin) |

## Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ❌ Member
- ❌ Guest

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| userId | ObjectId | ✅ Yes | Recipient user ID |
| bookingId | ObjectId | ❌ No | Related booking ID |
| title | String | ✅ Yes | Notification title |
| message | String | ✅ Yes | Notification message |
| type | String | ❌ No | `booking_confirmation`, `booking_reminder`, `approval`, `rejection`, `check_in`, `general` |

## Example Request

```http
POST /api/notifications
Authorization: Bearer <TOKEN>
```

```json
{
  "userId": "685abc1234567890abcdef11",
  "bookingId": "685abc1234567890abcdef22",
  "title": "Booking Reminder",
  "message": "Your booking starts in 30 minutes.",
  "type": "booking_reminder"
}
```

## Success Response (201)

```json
{
  "success": true,
  "message": "Notification created successfully.",
  "notification": {
    "_id": "685abc1234567890abcdef33",
    "userId": "685abc1234567890abcdef11",
    "bookingId": "685abc1234567890abcdef22",
    "title": "Booking Reminder",
    "message": "Your booking starts in 30 minutes.",
    "type": "booking_reminder",
    "isRead": false,
    "createdAt": "2026-07-23T10:20:00.000Z",
    "updatedAt": "2026-07-23T10:20:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid user id.",
  "code": "INVALID_ID"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You are not authorized to send notifications to this user.",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

### 422 Validation Error

```json
{
  "success": false,
  "message": "User, title and message are required.",
  "code": "VALIDATION_ERROR"
}
```

## Frontend Usage (According to PRD)

Used by the administration panel to manually send notifications to users regarding bookings, approvals, reminders, announcements, and other important updates.

## Models Used

- Notification
- User
- Booking

---

# Controller: getMyNotifications

## Purpose

Returns all notifications belonging to the currently logged-in user. Notifications are sorted from newest to oldest and include booking information when available.

## API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | GET |
| **Endpoint** | `/api/notifications` |
| **Authentication** | Yes |
| **Authorization** | No |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |

## Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Example Request

```http
GET /api/notifications
Authorization: Bearer <TOKEN>
```

## Success Response (200)

```json
{
  "success": true,
  "notifications": [
    {
      "_id": "685abc1234567890abcdef33",
      "userId": "685abc1234567890abcdef11",
      "bookingId": {
        "_id": "685abc1234567890abcdef22",
        "title": "Conference Meeting",
        "startTime": "2026-07-24T09:00:00.000Z",
        "endTime": "2026-07-24T10:00:00.000Z"
      },
      "title": "Booking Reminder",
      "message": "Your booking starts in 30 minutes.",
      "type": "booking_reminder",
      "isRead": false,
      "createdAt": "2026-07-23T10:20:00.000Z",
      "updatedAt": "2026-07-23T10:20:00.000Z"
    }
  ]
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required."
}
```

## Frontend Usage (According to PRD)

Used by the Notifications page and notification dropdown to display all notifications belonging to the currently logged-in user.

## Models Used

- Notification
- Booking

---

# Controller: getNotificationById

## Purpose

Retrieves a specific notification belonging to the currently logged-in user.

## API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | GET |
| **Endpoint** | `/api/notifications/:id` |
| **Authentication** | Yes |
| **Authorization** | No |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |

## Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Request Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| id | ObjectId | ✅ Yes |

## Example Request

```http
GET /api/notifications/685abc1234567890abcdef33
Authorization: Bearer <TOKEN>
```

## Success Response (200)

```json
{
  "success": true,
  "notification": {
    "_id": "685abc1234567890abcdef33",
    "userId": "685abc1234567890abcdef11",
    "bookingId": {
      "_id": "685abc1234567890abcdef22",
      "title": "Conference Meeting",
      "startTime": "2026-07-24T09:00:00.000Z",
      "endTime": "2026-07-24T10:00:00.000Z"
    },
    "title": "Booking Reminder",
    "message": "Your booking starts in 30 minutes.",
    "type": "booking_reminder",
    "isRead": false,
    "createdAt": "2026-07-23T10:20:00.000Z",
    "updatedAt": "2026-07-23T10:20:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid notification id.",
  "code": "INVALID_ID"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Unauthorized.",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Notification not found.",
  "code": "NOTIFICATION_NOT_FOUND"
}
```

## Frontend Usage (According to PRD)

Used when a user opens a notification from the Notifications page or notification panel to view its complete details, including any related booking information.

## Models Used

- Notification
- Booking

---

# Controller: markNotificationAsRead

## Purpose

Marks a specific notification as read. Only the owner of the notification can perform this operation.

## API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | PATCH |
| **Endpoint** | `/api/notifications/:id/read` |
| **Authentication** | Yes |
| **Authorization** | No |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |

## Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Notification ID |

## Example Request

```http
PATCH /api/notifications/685abc1234567890abcdef33/read
Authorization: Bearer <TOKEN>
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Notification marked as read.",
  "notification": {
    "_id": "685abc1234567890abcdef33",
    "userId": "685abc1234567890abcdef11",
    "bookingId": "685abc1234567890abcdef22",
    "title": "Booking Reminder",
    "message": "Your booking starts in 30 minutes.",
    "type": "booking_reminder",
    "isRead": true,
    "createdAt": "2026-07-23T10:20:00.000Z",
    "updatedAt": "2026-07-23T10:35:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid notification id.",
  "code": "INVALID_ID"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Unauthorized.",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Notification not found.",
  "code": "NOTIFICATION_NOT_FOUND"
}
```

## Frontend Usage (According to PRD)

Used when a user opens or manually marks a notification as read from the Notifications page or notification dropdown. This allows the frontend to update the unread notification count.

## Models Used

- Notification

---

# Controller: markAllNotificationsAsRead

## Purpose

Marks all unread notifications belonging to the currently logged-in user as read.

## API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | PATCH |
| **Endpoint** | `/api/notifications/read-all` |
| **Authentication** | Yes |
| **Authorization** | No |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |

## Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## Request Body

No request body is required.

## Example Request

```http
PATCH /api/notifications/read-all
Authorization: Bearer <TOKEN>
```

## Success Response (200)

```json
{
  "success": true,
  "message": "All notifications marked as read."
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required."
}
```

## Frontend Usage (According to PRD)

Used when the user selects the **"Mark All as Read"** option from the Notifications page or notification dropdown. It clears all unread notifications without deleting them.

## Models Used

- Notification

---

# Controller: deleteNotification

## Purpose

Deletes a notification belonging to the currently logged-in user. Users cannot delete notifications belonging to other users.

## API Details

| Property | Value |
|----------|-------|
| **HTTP Method** | DELETE |
| **Endpoint** | `/api/notifications/:id` |
| **Authentication** | Yes |
| **Authorization** | No |

## Authentication & Authorization

| Middleware | Required |
|------------|----------|
| protect | Yes |

## Allowed Roles

- ✅ Super Admin
- ✅ Space Admin
- ✅ Member
- ✅ Guest

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Notification ID |

## Example Request

```http
DELETE /api/notifications/685abc1234567890abcdef33
Authorization: Bearer <TOKEN>
```

## Success Response (200)

```json
{
  "success": true,
  "message": "Notification deleted successfully."
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid notification id.",
  "code": "INVALID_ID"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Unauthorized.",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Notification not found.",
  "code": "NOTIFICATION_NOT_FOUND"
}
```

## Frontend Usage (According to PRD)

Used when a user deletes an individual notification from the Notifications page. The controller ensures that users can only remove their own notifications, protecting notification privacy and ownership.

## Models Used

- Notification
- User

---

# Module 8: Access Group Management

The **Access Group Management** module allows administrators to organize users into logical groups within an organization. These groups can later be assigned to resources to control which users are allowed to access or book them. The module supports creating, retrieving, updating, and managing access groups while ensuring organization-level isolation.

**Models Used**

| Model | Purpose |
|--------|---------|
| AccessGroup | Stores access group information including assigned users. |
| User | Used to verify users and assign them to access groups. |
| Resource | Used to ensure an access group is not deleted while assigned to resources. |

---

# 1. Create Access Group

## Purpose

Creates a new access group within the logged-in administrator's organization. Duplicate group names within the same organization are not allowed.

## API Information

| Property | Value |
|----------|-------|
| Controller | createAccessGroup |
| Method | POST |
| Endpoint | `/api/access-groups` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles | Space Admin |

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| name | String | ✅ Yes | Access group name |
| description | String | No | Group description |

---

## Example Request

```http
POST /api/access-groups
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Computer Science Department",
  "description": "Faculty and students of CS department"
}
```

---

## Success Response (201 Created)

```json
{
  "success": true,
  "message": "Access group created successfully.",
  "accessGroup": {
    "_id": "685abc1234567890abcdef11",
    "name": "Computer Science Department",
    "description": "Faculty and students of CS department",
    "organizationId": "685abc1234567890abcdef22",
    "users": [],
    "createdAt": "2026-07-23T10:00:00.000Z",
    "updatedAt": "2026-07-23T10:00:00.000Z"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Organization not assigned.",
  "code": "NO_ORGANIZATION"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "Access group already exists.",
  "code": "ACCESS_GROUP_EXISTS"
}
```

### 422 Validation Error

```json
{
  "success": false,
  "message": "Name is required.",
  "code": "VALIDATION_ERROR"
}
```

---

## Frontend Usage

This API is used from the **Access Group Management** page when an administrator creates a new access group for organizing users within the organization.

---

# 2. Get Access Groups

## Purpose

Returns all access groups belonging to the logged-in user's organization.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | getAccessGroups |
| Method | GET |
| Endpoint | `/api/access-groups` |
| Authentication Required | Yes |
| Authorization Middleware | No |
| Allowed Roles | Super Admin, Space Admin, Member, Guest |

---

## Example Request

```http
GET /api/access-groups
Authorization: Bearer <token>
```

---

## Success Response (200 OK)

```json
{
  "success": true,
  "accessGroups": [
    {
      "_id": "685abc1234567890abcdef11",
      "name": "Computer Science Department",
      "description": "Faculty Members",
      "users": [
        {
          "_id": "685abc1234567890abcdef55",
          "name": "Ali Khan",
          "email": "ali@example.com",
          "role": "member"
        }
      ]
    }
  ]
}
```

---

## Error Responses

### 404 Not Found

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

---

## Frontend Usage

This API loads the **Access Groups** page and displays every access group belonging to the logged-in user's organization.

---

# 3. Get Access Group By ID

## Purpose

Retrieves complete details of a specific access group along with all assigned users.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | getAccessGroupById |
| Method | GET |
| Endpoint | `/api/access-groups/:id` |
| Authentication Required | Yes |
| Authorization Middleware | No |
| Allowed Roles | Super Admin, Space Admin, Member, Guest |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Access Group ID |

---

## Example Request

```http
GET /api/access-groups/685abc1234567890abcdef11
Authorization: Bearer <token>
```

---

## Success Response (200 OK)

```json
{
  "success": true,
  "accessGroup": {
    "_id": "685abc1234567890abcdef11",
    "name": "Computer Science Department",
    "description": "Faculty Members",
    "users": [
      {
        "_id": "685abc1234567890abcdef55",
        "name": "Ali Khan",
        "email": "ali@example.com",
        "role": "member",
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid access group id.",
  "code": "INVALID_ID"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Access group not found.",
  "code": "ACCESS_GROUP_NOT_FOUND"
}
```

---

## Frontend Usage

This API is used when the administrator opens an individual access group to view its details and all users currently assigned to that group.

---
# 4. Update Access Group

## Purpose

Updates the name or description of an existing access group.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | updateAccessGroup |
| Method | PATCH |
| Endpoint | `/api/access-groups/:id` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles | Super Admin, Space Admin |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Access Group ID |

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| name | String | No | Updated access group name |
| description | String | No | Updated group description |

---

## Example Request

```http
PATCH /api/access-groups/685abc1234567890abcdef11
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Engineering Department",
  "description": "Updated description"
}
```

---

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Access group updated successfully.",
  "accessGroup": {}
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid access group id.",
  "code": "INVALID_ID"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Access group not found.",
  "code": "ACCESS_GROUP_NOT_FOUND"
}
```

---

## Frontend Usage

This API is used from the **Edit Access Group** page when an administrator updates the group's name or description.

---

# 5. Add User to Group

## Purpose

Adds an existing user to an access group. Duplicate users are automatically prevented.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | addUserToGroup |
| Method | PATCH |
| Endpoint | `/api/access-groups/:id/add-user` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles |Space Admin |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Access Group ID |

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| userId | ObjectId | ✅ Yes | User to be added into the access group |

---

## Example Request

```http
PATCH /api/access-groups/685abc1234567890abcdef11/add-user
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "userId": "685abc1234567890abcdef55"
}
```

---

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "User added successfully.",
  "accessGroup": {}
}
```

---

## Error Responses

### 404 Not Found

```json
{
  "success": false,
  "message": "Access group not found.",
  "code": "ACCESS_GROUP_NOT_FOUND"
}
```

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

---

## Frontend Usage

This API is used when an administrator selects a user and assigns them to an existing access group from the **Manage Group Members** screen.

---

# 6. Remove User From Group

## Purpose

Removes a user from an existing access group.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | removeUserFromGroup |
| Method | PATCH |
| Endpoint | `/api/access-groups/:id/remove-user` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles |Space Admin |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Access Group ID |

---

## Request Body

| Field | Type | Required | Description |
|------|------|----------|-------------|
| userId | ObjectId | ✅ Yes | User to be removed from the access group |

---

## Example Request

```http
PATCH /api/access-groups/685abc1234567890abcdef11/remove-user
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "userId": "685abc1234567890abcdef55"
}
```

---

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "User removed successfully.",
  "accessGroup": {}
}
```

---

## Error Responses

### 404 Not Found

```json
{
  "success": false,
  "message": "Access group not found.",
  "code": "ACCESS_GROUP_NOT_FOUND"
}
```

---

## Frontend Usage

This API is used when an administrator removes a user from an access group. Once removed, the user immediately loses access to resources that are restricted to that group.

---

# 7. Delete Access Group

## Purpose

Deletes an access group. The group cannot be deleted if it is currently assigned to one or more resources.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | deleteAccessGroup |
| Method | DELETE |
| Endpoint | `/api/access-groups/:id` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles |Space Admin |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Access Group ID |

---

## Example Request

```http
DELETE /api/access-groups/685abc1234567890abcdef11
Authorization: Bearer <token>
```

---

## Success Response (200 OK)

```json
{
  "success": true,
  "message": "Access group deleted successfully."
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid access group id.",
  "code": "INVALID_ID"
}
```

```json
{
  "success": false,
  "message": "Cannot delete access group because it is assigned to one or more resources.",
  "code": "ACCESS_GROUP_IN_USE"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Access group not found.",
  "code": "ACCESS_GROUP_NOT_FOUND"
}
```

---

## Frontend Usage

This API is used from the **Access Group Management** page when an administrator deletes an access group. Before deletion, the backend verifies that the group is not assigned to any resources, preventing broken resource permissions.

---

## Backend Review

- Prevents duplicate access group names within the same organization.
- Restricts management operations to Super Admins and Space Admins.
- Prevents duplicate users from being added to the same group.
- Prevents deletion of access groups that are still assigned to resources.
- Maintains organization-level separation of access groups.

# Extra Info About Access Group Management

### What is the Access Group Module?

The **Access Group Module** is responsible for controlling which users are allowed to access or book specific resources within an organization.

Instead of assigning permissions to each user individually, users are organized into **Access Groups**. Resources are then assigned to one of these groups. When a user attempts to book a resource, the system checks whether the user belongs to the resource's assigned Access Group.

This approach simplifies permission management and makes the system easier to maintain.

---

## How Access Groups Work

The relationship can be represented as:

```text
Users
   │
   ▼
Access Group
   │
   ▼
Resource
```

- Users belong to one or more Access Groups.
- Each resource is assigned to an Access Group.
- Users can only book resources that are accessible to their assigned group.

---

## Real-Life Example 1 – Computer Labs

Suppose a university has the following resources:

- Computer Lab 1
- Computer Lab 2
- Conference Room
- Faculty Meeting Room

The university also has different categories of users:

- CS Students
- EE Students
- Teachers
- Head of Department (HOD)
- Visitors

Instead of manually assigning hundreds of students permission to use **Computer Lab 1**, an Access Group is created.

### Access Group

**CS Students**

### Members

- Ali
- Ahmed
- Sara
- Hamza
- Fatima

The resource **Computer Lab 1** is assigned to the **CS Students** Access Group.

As a result, every student in that group automatically has permission to book the lab.

---

## Real-Life Example 2 – Faculty Meeting Room

Consider a Faculty Meeting Room that should only be available to teachers.

Create an Access Group named:

**Faculty Members**

### Members

- Teacher A
- Teacher B
- Teacher C

Assign the **Faculty Meeting Room** to the **Faculty Members** Access Group.

Now:

- ✅ Teachers can book the room.
- ❌ Students cannot book the room.

---

## Why Not Store Users Directly Inside Each Resource?

Imagine an organization with:

- **500 users**
- **100 resources**

If every resource stored its own list of users, the structure would look like this:

```text
Resource A
 ├── User 1
 ├── User 2
 ├── User 3
 ├── ...
 └── User 500

Resource B
 ├── User 4
 ├── User 10
 ├── User 22
 └── ...
```

Managing permissions in this way becomes difficult because every resource must maintain its own user list.

Instead, the system uses Access Groups:

```text
Users
   │
   ▼
Access Group
   │
   ▼
Resource
```

This provides several benefits:

- Easier permission management
- Less duplicate data
- Simpler updates when users join or leave a department
- Better scalability for large organizations

---

## Access Groups According to the PRD

According to the Project Requirements Document (PRD), resources may have different access restrictions.

Examples include:

- Resources available to everyone
- Resources restricted to a specific department
- Resources available only to faculty members
- Resources assigned to a particular project team

The Access Group Module is responsible for implementing these restrictions.

When a booking request is received, the backend checks:

> **Is the logged-in user a member of the Access Group assigned to this resource?**

If the answer is:

- **Yes** → The booking is allowed (subject to other validations such as availability and conflicts).
- **No** → The booking request is rejected because the user does not have permission to access that resource.

---

## Summary

The Access Group Module provides centralized permission management for organizational resources.

Instead of assigning permissions individually to each user, permissions are granted through Access Groups.

This design:

- Improves scalability
- Simplifies administration
- Reduces duplicate permission assignments
- Ensures resources are only accessible to authorized users
- Aligns with the access control requirements defined in the PRD
----------


# Module 9: Analytics & Dashboard

## Module Overview

The **Analytics & Dashboard Module** provides statistical information required by the administrative dashboard of the Resource Booking Platform.

Instead of requiring the frontend to call multiple APIs from different modules, this module collects data from several collections—including **Organization**, **User**, **Resource**, **Booking**, and **Approval**—and returns all important statistics in a single response.

The analytics returned depend on the role of the logged-in user:

- **Super Admin** receives platform-wide analytics across all organizations.
- **Space Admin** receives analytics limited to their own organization.

This centralized approach improves dashboard performance, reduces frontend complexity, and minimizes the number of API requests required to render the dashboard.

### Models Used

| Model | Purpose |
|--------|---------|
| Organization | Counts organizations in the system. |
| User | Counts registered users. |
| Resource | Counts organizational resources. |
| Booking | Counts bookings by status. |
| Approval | Counts approval requests and pending approvals. |

---

# Controller: getDashboardAnalytics

## Purpose

Returns all important dashboard statistics required by the **Admin Dashboard**. Instead of making multiple API calls to different modules, this controller gathers data from the **Organization**, **User**, **Resource**, **Booking**, and **Approval** collections and returns a single analytics object.

If the logged-in user is a **Space Admin**, the analytics are limited to their own organization. If the logged-in user is a **Super Admin**, system-wide analytics are returned.

### Quick Reference

| Item | Value |
|------|-------|
| Module | Analytics & Dashboard |
| Controller | getDashboardAnalytics |
| HTTP Method | GET |
| Endpoint | `/api/analytics/dashboard` |
| Authentication | Yes |
| Authorization | Yes |
| Allowed Roles | Super Admin, Space Admin |

---

## Request Fields

No URL parameters or request body are required.

---

## Example Request

```http
GET /api/analytics/dashboard
Authorization: Bearer <TOKEN>
```

---

## Example Responses

### ✅ 200 OK

```json
{
  "success": true,
  "analytics": {
    "totalOrganizations": 8,
    "totalUsers": 164,
    "totalResources": 52,
    "totalBookings": 734,
    "pendingBookings": 21,
    "approvedBookings": 642,
    "rejectedBookings": 28,
    "completedBookings": 43,
    "totalApprovals": 670,
    "pendingApprovals": 12
  }
}
```

### ❌ 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required."
}
```

### ❌ 403 Forbidden

```json
{
  "success": false,
  "message": "You are not authorized to access this resource."
}
```

Occurs when a user other than a **Super Admin** or **Space Admin** attempts to access the endpoint.

### ❌ 404 Not Found

```json
{
  "success": false,
  "message": "User not found.",
  "code": "USER_NOT_FOUND"
}
```

---

## Returned Analytics

| Field | Description |
|--------|-------------|
| totalOrganizations | Total number of organizations in the system |
| totalUsers | Total registered users |
| totalResources | Total available resources |
| totalBookings | Total bookings |
| pendingBookings | Bookings waiting for approval |
| approvedBookings | Successfully approved bookings |
| rejectedBookings | Rejected booking requests |
| completedBookings | Completed bookings after check-in |
| totalApprovals | Total approval records |
| pendingApprovals | Approval requests awaiting action |

---

## Frontend Usage

This API is used to populate the **Admin Dashboard**. By returning all key statistics in a single response, it eliminates the need for multiple API calls and enables the dashboard to load faster and more efficiently.

---

## Models Used

- Organization
- User
- Resource
- Booking
- Approval

---

## Role-wise Behaviour

### Super Admin

Receives analytics for the entire platform, including:

- All organizations
- All users
- All resources
- All bookings
- All approval records

### Space Admin

Receives analytics only for their own organization.

The controller automatically filters:

- Users belonging to the organization
- Resources belonging to the organization
- Bookings associated with those resources
- Approval records related to those bookings

This ensures that a Space Admin cannot view analytics belonging to another organization.

---

## Internal Workflow

1. Verify the logged-in user.
2. Determine the user's role.
3. If the user is a **Space Admin**, build organization-specific filters.
4. Retrieve statistics for:
   - Organizations
   - Users
   - Resources
   - Total bookings
   - Pending bookings
   - Approved bookings
   - Rejected bookings
   - Completed bookings
   - Approval records
   - Pending approvals
5. Return all statistics as a single analytics object.

---

## Backend Review

✅ Uses role-based filtering to ensure organization-level data isolation.

✅ Aggregates statistics from multiple collections into a single API response.

✅ Uses parallel database queries (`Promise.all`) to improve performance and reduce response time.

💡 **Recommendation:** Consider adding analytics for resource utilization, peak booking hours, booking trends, and monthly booking summaries to provide more detailed operational insights in future versions.


# Module 10 – Audit Log Module

## Module Overview

The Audit Log Module records important activities performed throughout the Resource Booking Platform. Every significant action—such as creating users, updating resources, approving bookings, cancelling reservations, or modifying organizations—is stored as an audit log.

These logs provide administrators with complete visibility into system activity, helping with security, troubleshooting, compliance, and accountability.

Only administrators are allowed to view audit logs.

---

## Models Used

| Model | Purpose |
|--------|---------|
| AuditLog | Stores system activity records |
| User | Displays user information for each activity |

---

# Controller: getAuditLogs

## Purpose

Returns all audit logs recorded by the system. Administrators can monitor important activities such as resource creation, booking approvals, user updates, cancellations, and other system events.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | getAuditLogs |
| Method | GET |
| Endpoint | `/api/audit-logs` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles | Super Admin, Space Admin |

---

## Query Parameters (Optional)

| Parameter | Required | Description |
|-----------|----------|-------------|
| module | No | Filter logs by module |
| action | No | Filter logs by action |

---

## Example Request

```http
GET /api/audit-logs?module=BOOKING
Authorization: Bearer <token>
```

---

## Success Response (200)

```json
{
  "success": true,
  "logs": [
    {
      "_id": "685abc1234567890abcdef55",
      "userId": {
        "_id": "685abc1234567890abcdef11",
        "name": "Ali Khan",
        "email": "ali@example.com",
        "role": "member"
      },
      "action": "CREATE",
      "module": "BOOKING",
      "entityId": "685abc1234567890abcdef22",
      "description": "Booking created successfully.",
      "ipAddress": "192.168.1.5",
      "createdAt": "2026-07-23T09:30:00.000Z"
    }
  ]
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required."
}
```

---

### 403 Forbidden

```json
{
  "success": false,
  "message": "You are not authorized to access this resource."
}
```

---

## Frontend Usage

This API powers the Audit Logs page, allowing administrators to monitor platform activity. The frontend may optionally filter logs by module or action to simplify searching.

---

# Controller: getAuditLogById

## Purpose

Returns complete information for a specific audit log.

---

## API Information

| Property | Value |
|----------|-------|
| Controller | getAuditLogById |
| Method | GET |
| Endpoint | `/api/audit-logs/:id` |
| Authentication Required | Yes |
| Authorization Middleware | Yes |
| Allowed Roles | Super Admin, Space Admin |

---

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | ✅ Yes | Audit Log ID |

---

## Example Request

```http
GET /api/audit-logs/685abc1234567890abcdef55
Authorization: Bearer <token>
```

---

## Success Response (200)

```json
{
  "success": true,
  "log": {
    "_id": "685abc1234567890abcdef55",
    "userId": {
      "_id": "685abc1234567890abcdef11",
      "name": "Ali Khan",
      "email": "ali@example.com",
      "role": "member"
    },
    "action": "UPDATE",
    "module": "RESOURCE",
    "entityId": "685abc1234567890abcdef66",
    "description": "Updated resource successfully.",
    "ipAddress": "192.168.1.5",
    "createdAt": "2026-07-23T10:15:00.000Z"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid audit log id.",
  "code": "INVALID_ID"
}
```

---

### 404 Not Found

```json
{
  "success": false,
  "message": "Audit log not found.",
  "code": "AUDIT_LOG_NOT_FOUND"
}
```

---

## Frontend Usage

This API is used when an administrator opens a specific audit log from the Audit Logs page to view complete details of the recorded activity.

---

## Backend Review

✅ Stores immutable records for important system events.

✅ Supports filtering by module and action.

✅ Restricts access to administrators only.



# Resource Booking Platform – Backend Modules

The Resource Booking Platform backend is divided into multiple modules, where each module is responsible for a specific business functionality. Together, these modules provide complete resource management, booking, approval, notification, access control, calendar integration, analytics, and audit logging capabilities.

---

## Project Modules

| # | Module | Status | Description |
|---|--------|--------|-------------|
| **1** | Authentication Module | ✅ Complete | Handles user registration, login, JWT authentication, email verification, forgot password, and password reset. |
| **2** | User Management Module | ✅ Complete | Manages user accounts, profiles, roles, and user CRUD operations. |
| **3** | Organization Module | ✅ Complete | Handles organization creation, updates, retrieval, and deletion. |
| **4** | Resource Module | ✅ Complete | Manages resources including CRUD operations, approval settings, access group assignment, and activation/deactivation. |
| **5** | Booking Module | ✅ Complete | Handles the complete booking lifecycle including booking creation, updates, cancellation, approvals, recurring bookings, and check-in. |
| **6** | Approval Module | ✅ Complete | Allows administrators to approve or reject booking requests that require approval. |
| **7** | Notification Module | ✅ Complete | Creates and manages user notifications including reading, marking as read, and deleting notifications. |
| **8** | Access Group Module | ✅ Complete | Manages access groups, assigns users to groups, and controls resource access permissions. |
| **9** | Calendar Integration Module | ✅ Complete | Connects user accounts with Google Calendar and Microsoft Outlook for future booking synchronization. |
| **10** | Analytics Module | ✅ Complete | Provides dashboard statistics and system analytics for administrators through a single API endpoint. |
| **11** | Audit Log Module | ✅ Complete | Records and retrieves system activities for monitoring, auditing, and administrative tracking. |

---

## Overall Project Status

**Total Modules:** **11**

**Completed Modules:** **11**

**Project Completion:** ✅ **100% (Backend API Documentation)**

---

## Module Summary

### 1. Authentication Module
Provides secure authentication using JWT and manages the complete authentication lifecycle including registration, login, email verification, forgot password, and password reset.

### 2. User Management Module
Allows administrators to manage users, profiles, and role assignments while enabling users to maintain their personal profile information.

### 3. Organization Module
Manages organizations within the platform, enabling organizational separation of users, resources, and bookings.

### 4. Resource Module
Allows administrators to create, update, activate, deactivate, and manage organizational resources along with approval requirements and access restrictions.

### 5. Booking Module
Serves as the core module of the platform by managing resource reservations, booking conflicts, recurring bookings, cancellations, approvals, and check-ins.

### 6. Approval Module
Handles approval workflows for bookings that require administrative authorization before becoming active.

### 7. Notification Module
Delivers notifications related to bookings, approvals, reminders, check-ins, and general announcements while allowing users to manage notification status.

### 8. Access Group Module
Implements role-based resource access by grouping users and assigning resources to those groups instead of individual users.

### 9. Analytics Module
Aggregates statistical information from multiple collections to provide dashboard metrics for administrators using a single optimized API request.

### 10. Audit Log Module
Maintains a complete history of important system activities, providing administrators with auditing, monitoring, and traceability capabilities.

---
# Complete Backend Workflow

This section describes the complete backend workflow of the **Resource Booking Platform**, showing how different modules interact from user authentication to booking management, notifications, analytics, and audit logging.

---

# 1. Overall Backend Workflow

```text
                            START
                               │
                               ▼
                 User Opens Frontend Application
                               │
                               ▼
                  Login / Register / Verify Email
                               │
                               ▼
                  JWT Token Generated Successfully
                               │
                               ▼
                Is Authentication Successful?
                      │
           ┌──────────┴──────────┐
           │                     │
          NO                    YES
           │                     │
           ▼                     ▼
    Return Error          Identify User Role
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
    Super Admin            Space Admin          Member / Guest
```

---

# 2. Super Admin Workflow

```text
Super Admin
     │
     ▼
Dashboard Analytics
     │
     ▼
Manage Organizations
     │
     ▼
Manage Users
     │
     ▼
Manage Resources
     │
     ▼
Manage Access Groups
     │
     ▼
Approve / Reject Bookings
     │
     ▼
Manage Notifications
     │
     ▼
View Audit Logs
     │
     ▼
View Analytics
     │
     ▼
END
```

---

# 3. Space Admin Workflow

```text
Space Admin
      │
      ▼
Dashboard Analytics
      │
      ▼
Manage Organization Users
      │
      ▼
Manage Resources
      │
      ▼
Manage Access Groups
      │
      ▼
Approve / Reject Bookings
      │
      ▼
Send Notifications
      │
      ▼
View Audit Logs (Organization)
      │
      ▼
View Analytics
      │
      ▼
END
```

---

# 4. Member / Guest Booking Workflow

```text
Member / Guest
      │
      ▼
Browse Resources
      │
      ▼
Select Resource
      │
      ▼
Choose Date & Time
      │
      ▼
Booking Controller
      │
      ▼
Validate Time
      │
      ▼
Check Blackout Dates
      │
      ▼
Check Booking Conflict
      │
      ▼
Conflict?
      │
 ┌────┴────┐
 │         │
YES        NO
 │         │
 ▼         ▼
Show      Create
Error     Booking
            │
            ▼
Requires Approval?
      │
 ┌────┴────┐
 │         │
YES        NO
 │         │
 ▼         ▼
Pending   Approved
 │         │
 ▼         ▼
Admin     Notification
Reviews
 │
 ▼
Approved?
 │
┌────┴─────┐
│          │
NO         YES
│          │
▼          ▼
Rejected   Booking Active
               │
               ▼
        Update / Cancel
               │
               ▼
       Booking Date Arrives
               │
               ▼
            Check-In
               │
               ▼
       Booking Completed
               │
               ▼
              END
```

---

# 5. Notification Workflow

```text
Booking Created
       │
       ▼
Notification Generated
       │
       ▼
User Opens Notification Page
       │
       ▼
Read Notification
       │
       ▼
Mark As Read
       │
       ▼
Delete (Optional)
```
---

# 6. Analytics Workflow

```text
Analytics Request
       │
       ▼
Count Organizations
       │
       ▼
Count Users
       │
       ▼
Count Resources
       │
       ▼
Count Bookings
       │
       ▼
Count Pending Bookings
       │
       ▼
Count Approved Bookings
       │
       ▼
Count Rejected Bookings
       │
       ▼
Count Completed Bookings
       │
       ▼
Count Approval Records
       │
       ▼
Count Pending Approvals
       │
       ▼
Return Dashboard Statistics
```

---

# 7. Audit Log Workflow

```text
Any Important Action
      │
      ▼
Create User
Create Organization
Create Resource
Update Resource
Delete Resource
Create Booking
Update Booking
Approve Booking
Reject Booking
Cancel Booking
Check-In
Update Organization
Delete Organization
       │
       ▼
Automatically Create Audit Log
       │
       ▼
Administrator Views Audit History
```

---

# 8. Overall System Architecture

```text
                     Authentication
                           │
                           ▼
                   Role Identification
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
 Super Admin         Space Admin         Member / Guest
       │                   │                    │
       ├──────────────┬─────┴───────┬────────────┤
       │              │             │
       ▼              ▼             ▼
 Organization    Resources     Booking System
       │              │             │
       │              ▼             ▼
       │        Access Groups   Approval Module
       │              │             │
       └──────────────┼─────────────┘
                      ▼
              Notification Module
                      │
                      ▼
              Analytics Dashboard
                      │
                      ▼
                Audit Log Module
                      │
                      ▼
                     END
```

---

# Backend Module Interaction Summary

| Step | Module |
|------|--------|
| 1 | Authentication Module |
| 2 | User Management Module |
| 3 | Organization Module |
| 4 | Resource Module |
| 5 | Access Group Module |
| 6 | Booking Module |
| 7 | Approval Module |
| 8 | Notification Module |
| 9 | Analytics Module |
| 10 | Audit Log Module |

---

## Complete Backend Flow

The backend follows a modular architecture where **Authentication** verifies users before granting access based on their role. Administrators manage organizations, users, resources, and access groups, while members create bookings that pass through validation, conflict detection, approval (when required), notifications, and check-in. Supporting modules such as Calendar Integration, Analytics, and Audit Logs operate alongside the core booking workflow to provide synchronization, dashboard reporting, and complete activity tracking across the entire Resource Booking Platform.