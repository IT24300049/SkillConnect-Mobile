# SkillConnect Mobile Backend - Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and set required values:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/skillconnect
   JWT_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

---

## API Documentation

### Authentication Endpoints

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "1234567890",
  "role": "customer"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGc...",
    "userId": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Jobs Endpoints

#### List Jobs
```bash
GET /api/jobs?category=plumbing&district=Colombo&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `category`: Filter by job category
- `district`: Filter by location
- `status`: Filter by job status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

#### Get My Jobs
```bash
GET /api/jobs/my?page=1&limit=20
Authorization: Bearer <token>
```

#### Create Job
```bash
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobTitle": "Fix Leaky Faucet",
  "jobDescription": "Need emergency plumbing repair",
  "category": "plumbing",
  "locationAddress": "123 Main St",
  "city": "Colombo",
  "district": "Colombo",
  "urgencyLevel": "urgent",
  "budgetMin": 2000,
  "budgetMax": 5000,
  "estimatedDurationHours": 2,
  "preferredStartDate": "2026-04-08T10:00:00Z"
}
```

#### Update Job
```bash
PUT /api/jobs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobTitle": "Updated Title",
  "budgetMax": 6000
}
```

**Note:** Only these fields can be updated:
`jobTitle`, `jobDescription`, `category`, `locationAddress`, `city`, `district`, `urgencyLevel`, `budgetMin`, `budgetMax`, `estimatedDurationHours`, `preferredStartDate`

#### Apply for Job
```bash
POST /api/jobs/:id/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverLetter": "I am a skilled plumber with 5 years experience",
  "proposedRate": 3500
}
```

---

### Bookings Endpoints

#### Get My Bookings
```bash
GET /api/bookings/my?as=customer&page=1&limit=20
Authorization: Bearer <token>
```

**Parameters:**
- `as`: `customer` or `worker` (default: customer)
- `page`: Page number
- `limit`: Items per page

#### Get Booking Details
```bash
GET /api/bookings/:id
Authorization: Bearer <token>
```

#### Create Booking
```bash
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "worker": "507f1f77bcf86cd799439011",
  "job": "507f1f77bcf86cd799439012",
  "scheduledDate": "2026-04-10T09:00:00Z",
  "scheduledTime": "09:00",
  "estimatedDurationHours": 2,
  "notes": "Please bring all tools"
}
```

#### Update Booking Status
```bash
PATCH /api/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "accepted",
  "reason": "Optional cancellation reason if cancelling"
}
```

**Valid Transitions:**
- `requested` → `accepted` or `rejected`
- `accepted` → `in_progress` or `cancelled`
- `in_progress` → `completed` or `cancelled`
- Terminal states: `completed`, `cancelled`, `rejected`

---

### Profile Endpoints

#### Get My Profile
```bash
GET /api/profile/me
Authorization: Bearer <token>
```

#### Update Profile
```bash
PUT /api/profile/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "district": "Colombo",
  "city": "Colombo",
  "skills": ["plumbing", "repairs"],
  "bio": "Professional plumber with 10 years experience",
  "hourlyRate": 3000,
  "experience": "10+ years",
  "companyName": "John's Plumbing"
}
```

**Note:** Email and role cannot be updated through this endpoint.

#### List Workers
```bash
GET /api/profile/workers?district=Colombo&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Worker Profile
```bash
GET /api/profile/workers/:id
Authorization: Bearer <token>
```

---

### Reviews Endpoints

#### List Reviews
```bash
GET /api/reviews?page=1&limit=20
Authorization: Bearer <token>
```

#### Get My Reviews
```bash
GET /api/reviews/my?page=1&limit=20
Authorization: Bearer <token>
```

#### Submit Review
```bash
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "reviewee": "507f1f77bcf86cd799439011",
  "booking": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "Great service, highly recommended!"
}
```

**Rating:** Must be between 1 and 5

#### Update Review
```bash
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated comment"
}
```

---

### Equipment Endpoints

#### List Available Equipment
```bash
GET /api/equipment?category=tools&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Equipment Details
```bash
GET /api/equipment/:id
Authorization: Bearer <token>
```

#### Add Equipment (Supplier Only)
```bash
POST /api/equipment
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Drill",
  "description": "20V Cordless Drill",
  "category": "tools",
  "dailyRate": 500,
  "isAvailable": true,
  "location": "Colombo"
}
```

#### Update Equipment
```bash
PUT /api/equipment/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "dailyRate": 600,
  "isAvailable": false
}
```

---

### Complaints Endpoints

#### List Complaints
```bash
GET /api/complaints?page=1&limit=20
Authorization: Bearer <token>
```

**Note:** Admin users see all complaints, others see only their own.

#### Get My Complaints
```bash
GET /api/complaints/my?page=1&limit=20
Authorization: Bearer <token>
```

#### Submit Complaint
```bash
POST /api/complaints
Authorization: Bearer <token>
Content-Type: application/json

{
  "complainedAgainst": "507f1f77bcf86cd799439011",
  "description": "Worker did not show up for appointment"
}
```

#### Update Complaint Status (Admin Only)
```bash
PATCH /api/complaints/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNotes": "Refund has been issued"
}
```

**Valid Statuses:** `open`, `under_review`, `resolved`, `rejected`

---

## Security Features

✅ **Input Validation**
- Email format validation
- Password strength requirements
- Rate limiting on auth endpoints (5 requests/15 min)
- Request size limits (10KB max)

✅ **Authorization**
- JWT token-based authentication
- Role-based access control
- User ownership verification
- Field-level filtering

✅ **Data Protection**
- Passwords hashed with bcryptjs
- No sensitive data in error messages
- CORS restricted to allowed origins
- Database indexes for query performance

✅ **Data Integrity**
- Input validation on all endpoints
- Date range validation
- Booking status state machine
- Enum validation for categorical fields

---

## Error Handling

All errors follow a consistent format:

**Validation Error (400):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 chars with uppercase, lowercase, number, and special char"
    }
  ]
}
```

**Not Found (404):**
```json
{
  "status": "error",
  "message": "Job not found"
}
```

**Unauthorized (401):**
```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

**Forbidden (403):**
```json
{
  "status": "error",
  "message": "Only admins can update complaint status"
}
```

**Rate Limited (429):**
```json
{
  "status": "error",
  "message": "Too many login attempts, please try again later"
}
```

---

## Development

### Running Tests (Not yet implemented)
```bash
npm test
```

### Development with Hot Reload
```bash
npm run dev
```

### Production Build
```bash
npm start
```

---

## Troubleshooting

### "Too many login attempts"
Rate limiting is active. Wait 15 minutes before trying again.

### "Invalid email or password"
Check that email exists and password is correct. Passwords are case-sensitive.

### "Validation failed"
Check error details in response. Ensure all required fields are provided with correct formats.

### "Not authorized"
Verify you're authenticated (have valid token in Authorization header) and have permission for the resource.

---

## Support

For issues or questions, refer to:
1. `SECURITY_IMPROVEMENTS.md` - Detailed technical changes
2. Plan file in session workspace - High-level architecture
3. GitHub issues - For bug reports

---

Version: 1.0.0
Last Updated: 2026-04-06
