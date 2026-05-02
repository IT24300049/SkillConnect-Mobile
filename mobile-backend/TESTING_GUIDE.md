# SkillConnect Mobile - Testing Guide

## Test Infrastructure Setup

### Framework & Tools
- **Jest**: Unit & integration test framework
- **Supertest**: HTTP assertion library for API testing
- **MongoDB Memory Server**: In-memory database for isolated tests
- **Coverage Reports**: HTML coverage reports in `./coverage/`

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

## Test Structure

```
__tests__/
├── middleware/
│   └── validation.test.js       # Validation middleware tests
├── integration/
│   └── api.integration.test.js  # End-to-end API tests
└── routes/                       # Route-specific tests (to be added)
    ├── auth.test.js
    ├── jobs.test.js
    └── bookings.test.js
```

## Unit Tests Coverage

### Validation Middleware (`middleware/validation.test.js`)
✅ Tests implemented:
- Email validation (valid/invalid formats)
- Password strength requirements (8+ chars, uppercase, number, special)
- Phone number validation
- Field sanitization (whitelist approach)
- Job data validation
- Booking data validation
- Profile update validation

### Example Test Case

```javascript
describe('Email Validation', () => {
    test('Should accept valid email format', () => {
        const result = validateEmail('user@example.com');
        expect(result.valid).toBe(true);
    });

    test('Should reject email without @', () => {
        const result = validateEmail('userexample.com');
        expect(result.valid).toBe(false);
    });

    test('Should reject email with spaces', () => {
        const result = validateEmail('user @example.com');
        expect(result.valid).toBe(false);
    });
});
```

## Integration Tests Coverage

### Authentication Flow (`integration/api.integration.test.js`)
⚪ Tests to implement:
- [ ] User registration with valid data
- [ ] User registration with invalid email
- [ ] User registration with weak password
- [ ] User login with correct credentials
- [ ] User login with incorrect password
- [ ] JWT token generation and validation
- [ ] Token expiration (1 hour)
- [ ] Refresh token flow

### Authorization Tests
⚪ Tests to implement:
- [ ] Protected endpoints reject unauthenticated requests
- [ ] Protected endpoints reject invalid tokens
- [ ] RBAC: Customer can only see own bookings
- [ ] RBAC: Worker can only accept job bookings
- [ ] Field filtering: Cannot modify protected fields
- [ ] Field filtering: Cannot escalate privilege

### Data Validation Tests
⚪ Tests to implement:
- [ ] Past dates rejected for job/booking creation
- [ ] Rating must be 1-5
- [ ] Phone number format validated
- [ ] Cost fields must be positive numbers
- [ ] Status transitions enforce valid state machine

### Pagination Tests
⚪ Tests to implement:
- [ ] Default page size is 20
- [ ] Max page size is 100
- [ ] Limit parameter respected
- [ ] Page/skip parameters work correctly
- [ ] Pagination metadata returned

### Rate Limiting Tests
⚪ Tests to implement:
- [ ] Auth endpoints rate limited to 5/15min
- [ ] Rate limit header returned
- [ ] Exceeded limit returns 429 status
- [ ] Rate limit resets after window

## Performance Testing

### Load Testing with Artillery

```bash
# Install
npm install -g artillery

# Create test profile (load.yml)
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Get Jobs List"
    flow:
      - get:
          url: "/api/v1/jobs"
          headers:
            Authorization: "Bearer YOUR_TOKEN"

# Run test
artillery run load.yml
```

### Benchmark Queries

```bash
# Time database queries
time curl http://localhost:5000/api/v1/jobs
time curl http://localhost:5000/api/v1/jobs?limit=100
```

## Security Testing

### Manual Security Tests

```bash
# 1. Test CORS - should reject origin not in ALLOWED_ORIGINS
curl -H "Origin: http://untrusted.com" http://localhost:5000/api/v1/jobs

# 2. Test rate limiting - should be blocked after 5 requests
for i in {1..10}; do curl http://localhost:5000/api/auth/login -X POST; done

# 3. Test XSS prevention - script tags should be sanitized
curl -X POST http://localhost:5000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"jobTitle": "<script>alert(1)</script>job"}'

# 4. Test SQL injection - NoSQL injection should fail
curl "http://localhost:5000/api/v1/jobs?status={\"$ne\":null}"

# 5. Test unauthorized field update
curl -X PATCH http://localhost:5000/api/v1/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"role": "admin"}'  # Should be rejected

# 6. Test request size limit - should reject >10KB
curl -X POST http://localhost:5000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d "$(python -c 'print(\"x\"*11000)')"
```

## Test Data Fixtures

### Create Test Database Seed

```javascript
// __tests__/fixtures/seed.js
const seedDatabase = async () => {
    const testUser = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123!',
        role: 'customer'
    };

    const testWorker = {
        email: 'worker@example.com',
        firstName: 'Worker',
        lastName: 'Pro',
        password: 'SecurePass123!',
        role: 'worker'
    };

    return { testUser, testWorker };
};

module.exports = { seedDatabase };
```

## Continuous Integration Setup

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Statements | 80% | ~45% |
| Branches | 75% | ~40% |
| Functions | 80% | ~50% |
| Lines | 80% | ~45% |

## Common Test Patterns

### Testing an Express Route

```javascript
describe('GET /api/v1/jobs', () => {
    test('Should return list of jobs with pagination', async () => {
        const response = await request(app)
            .get('/api/v1/jobs')
            .set('Authorization', `Bearer ${testToken}`)
            .query({ page: 1, limit: 20 })
            .expect(200);

        expect(response.body.status).toBe('success');
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.pagination.limit).toBe(20);
    });

    test('Should enforce authorization', async () => {
        const response = await request(app)
            .get('/api/v1/jobs')
            .expect(401);

        expect(response.body.status).toBe('error');
    });
});
```

### Testing Error Handling

```javascript
describe('Error Handling', () => {
    test('Should return 400 for invalid email', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'not-an-email',
                password: 'SecurePass123!'
            })
            .expect(400);

        expect(response.body.errors).toContain('Invalid email format');
    });

    test('Should return 500 for database errors', async () => {
        // Mock database error
        jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB Error'));
        
        const response = await request(app)
            .get('/api/v1/profile')
            .set('Authorization', `Bearer ${testToken}`)
            .expect(500);
    });
});
```

## Debugging Tests

```bash
# Run single test file
npm test -- auth.test.js

# Run with verbose output
npm test -- --verbose

# Debug mode (step through in DevTools)
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in browser
```

## Test Maintenance

### When to Update Tests
- When functionality changes
- When bugs are fixed (add test to prevent regression)
- When security vulnerabilities are patched
- When performance optimizations are made

### Best Practices
- Test behavior, not implementation
- Avoid testing third-party libraries
- Mock external APIs and services
- Keep tests DRY (Don't Repeat Yourself)
- Use descriptive test names
- Clean up after tests (close connections)

