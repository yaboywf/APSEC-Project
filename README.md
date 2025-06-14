# APSEC Project
- This is a draft for the APSEC Project

## Roles

| Feature               | Student   | Teacher Assistant        | Teacher   | Admin     |
|-----------------------|-----------|-----------|-----------|-----------|
| CUD Student           | &cross;   | &cross;   | &check;   | &check;   |
| CUD TA                | &cross;   | &cross;   | &check;   | &check;   |
| CUD Teacher           | &cross;   | &cross;   | &cross;   | &check;   |
| CUD Documents         | &cross;   | &cross;   | &check;   | &check;   |
| CUD Grades            | &cross;   | &check;   | &check;   | &cross;   |
| Submit Assignments    | &check;   | &check;   | &cross;   | &cross;   |

## Authentication

### Passport.js
- A flexible and modular authentication middleware for Node.js
- Passport JS is used for the initial authentication via LocalStrategy

### Authentication Flow
1. User Registration
    - The user keys in their username, password, email and account type
    - Both frontend and backend would ensure that the data valid
    - Backend will sanitise all keyed in values
    - Backend will save the values in the MongoDB database

2. User Authentication
    - The user keys in their username and password
    - Frontend will perform basic checks (input not empty, etc)
    - Backend will perform the same checks again, as well as sanitise the input before verifying the user
    
3. Accessing protected routes
    - Passport JS with validate the session
    - Will deny access if not authenticated or unauthorised

## API Routes
| Name              | URL                    | Method | Description                                                           |
|-------------------|------------------------|--------|-----------------------------------------------------------------------|
| Account Creation  | /api/auth/register     | POST   | Used for the registration of new accounts                             |
| Login             | /api/auth/login        | POST   | Used to authenticate the user when trying to login                    |
| Admin Page        | /api/admin             | GET    | Only authenticated and admin accounts can access this API             |
| Teacher Page      | /api/teacher           | GET    | Only authenticated and teacher accounts can access this API           |
| TA Page           | /api/teacher-assistant | GET    | Only authenticated and teacher assistant accounts can access this API |
| Student Page      | /api/student           | GET    | Only authenticated and student accounts can access this API           |
| Dashboard Page    | /api/dashboard         | GET    | All authenticated users can access this API                           |
| Home Page         | /api/home              | GET    | All users can access this page                                        |

## Author
- Dylan Yeo (yaboywf)
- @ 2025 Dylan Yeo. All Rights Reserved.

### Temasek Polytechnic Application Security (APSEC) Project
