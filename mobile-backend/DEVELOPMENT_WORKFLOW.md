# SkillConnect Mobile - Development Workflow Guide

## Project Structure Overview

```
mobile-backend/
├── server.js                      # Main entry point
├── .env                          # Configuration (DO NOT COMMIT)
├── .env.example                  # Configuration template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── jest.config.js                # Test configuration
│
├── middleware/
│   ├── auth.js                   # JWT authentication
│   ├── validation.js             # Joi schema validation
│   ├── logger.js                 # Winston logger config
│   ├── morganLogger.js           # HTTP request logging
│   ├── sanitize.js               # XSS prevention
│   └── sentry.js                 # Error tracking
│
├── routes/
│   ├── auth.js                   # /api/auth endpoints
│   ├── jobs.js                   # /api/jobs endpoints
│   ├── bookings.js               # /api/bookings endpoints
│   ├── equipment.js              # /api/equipment endpoints
│   ├── reviews.js                # /api/reviews endpoints
│   ├── complaints.js             # /api/complaints endpoints
│   └── profile.js                # /api/profile endpoints
│
├── models/
│   ├── User.js                   # User schema + indexes
│   ├── Job.js                    # Job schema + indexes
│   ├── Booking.js                # Booking schema + indexes
│   ├── Equipment.js              # Equipment schema
│   ├── Review.js                 # Review schema
│   └── Complaint.js              # Complaint schema
│
├── utils/
│   ├── transaction.js            # MongoDB transaction helpers
│   └── cache.js                  # Redis caching layer
│
├── config/
│   └── swagger.js                # Swagger/OpenAPI config
│
├── __tests__/
│   ├── middleware/
│   │   └── validation.test.js    # Unit tests
│   └── integration/
│       └── api.integration.test.js # Integration tests
│
├── logs/                         # Created automatically
│   ├── combined.log             # All logs
│   └── error.log                # Errors only
│
└── Documentation/
    ├── QUICK_REFERENCE.md        # Quick start
    ├── PRODUCTION_READY.md       # Production guide
    ├── SECURITY_IMPROVEMENTS.md  # Security details
    ├── API_GUIDE.md              # API reference
    ├── TESTING_GUIDE.md          # Testing procedures
    ├── IMPLEMENTATION_REPORT.md  # What was fixed
    └── COMPLETION_SUMMARY.md     # Project summary
```

---

## Development Setup

### 1. Initial Setup
```bash
# Clone repository
git clone <repo-url>
cd mobile-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongosh  # Opens MongoDB shell
```

**Option B: MongoDB Atlas (Cloud)**
```bash
# Create account at https://www.mongodb.com/cloud/atlas
# Create cluster and get connection string
# Add to .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillconnect
```

### 3. Start Development
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# Terminal 3: Monitor logs
tail -f logs/combined.log
```

---

## Adding a New Feature

### Step 1: Create Test First (TDD)
```javascript
// __tests__/integration/feature.test.js
describe('New Feature', () => {
    test('Should do something', async () => {
        const response = await request(app)
            .post('/api/v1/feature')
            .set('Authorization', `Bearer ${token}`)
            .send({ data: 'value' })
            .expect(201);

        expect(response.body.status).toBe('success');
    });
});
```

### Step 2: Define Model (if needed)
```javascript
// models/Feature.js
const schema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Add index for performance
schema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Feature', schema);
```

### Step 3: Create Route with Validation
```javascript
// routes/feature.js
const express = require('express');
const Joi = require('joi');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Define validation schema
const createSchema = Joi.object({
    name: Joi.string().required().min(3).max(100)
});

// POST endpoint
router.post('/', auth, validateRequest(createSchema), async (req, res) => {
    try {
        const feature = await Feature.create({
            name: req.body.name,
            user: req.userId
        });

        res.status(201).json({
            status: 'success',
            data: feature
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to create feature'
        });
    }
});

module.exports = router;
```

### Step 4: Register Route in server.js
```javascript
// server.js
const featureRoutes = require('./routes/feature');
app.use('/api/v1/features', featureRoutes);
```

### Step 5: Run Tests
```bash
npm test -- --testNamePattern="New Feature"
```

### Step 6: Document in Swagger
```javascript
// config/swagger.js - Add JSDoc comments

/**
 * @swagger
 * /features:
 *   post:
 *     summary: Create new feature
 *     tags: [Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature created
 */
```

---

## Git Workflow

### Feature Branch
```bash
# Create feature branch
git checkout -b feature/awesome-feature

# Make changes
# Test thoroughly
npm test

# Commit with descriptive message
git commit -m "feat: add awesome feature with validation"

# Push to GitHub
git push origin feature/awesome-feature

# Create Pull Request on GitHub
```

### Commit Message Format
```
feat: new feature description
fix: bug fix description
docs: documentation updates
refactor: code restructuring
test: test additions
chore: dependency updates

Example: feat: add rate limiting to auth endpoints
```

### Before Merging
- [ ] All tests pass (`npm test`)
- [ ] No console errors
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No hardcoded values

---

## Common Development Tasks

### Fix a Bug
```bash
# 1. Check logs
tail -f logs/error.log

# 2. Create test that reproduces bug
npm test -- --testNamePattern="bug description"

# 3. Fix code
# 4. Verify test passes
npm test

# 5. Check for regressions
npm test  # All tests must pass
```

### Improve Performance
```bash
# Run performance test
npm test -- --testNamePattern="performance"

# Monitor query times
LOG_LEVEL=debug npm run dev

# Check database indexes
mongosh
> db.users.getIndexes()
```

### Add Dependency
```bash
# Add and save
npm install new-package

# Test works
npm test

# Commit
git add package*.json
git commit -m "chore: add new-package for feature-x"
```

### Remove Dependency
```bash
# Uninstall
npm uninstall unused-package

# Verify nothing breaks
npm test

# Commit
git add package*.json
git commit -m "chore: remove unused-package"
```

---

## Debugging

### Enable Debug Logs
```bash
# Set log level to debug
export LOG_LEVEL=debug
npm run dev

# Or with nodemon
nodemon --exec 'LOG_LEVEL=debug node' server.js
```

### Use Node Inspector
```bash
# Start with debugger
node --inspect server.js

# Open Chrome DevTools
# Navigate to chrome://inspect
# Click "Inspect"
```

### Database Query Debugging
```bash
// In route handler
console.log('Query:', Job.find({status: 'active'}).explain('executionStats'));
```

### JWT Token Debugging
```bash
# Decode JWT (without verification)
npm install jwt-cli -g
jwt decode YOUR_TOKEN

# Or decode manually
echo "YOUR_TOKEN" | node -e "console.log(JSON.parse(Buffer.from(require('fs').readFileSync(0,'utf-8').split('.')[1], 'base64')))"
```

---

## Testing Strategies

### Unit Test Example
```javascript
describe('User Model', () => {
    test('Should hash password before saving', async () => {
        const user = await User.create({
            email: 'test@example.com',
            password: 'plaintext'
        });
        
        expect(user.password).not.toBe('plaintext');
    });
});
```

### Integration Test Example
```javascript
describe('Auth Endpoints', () => {
    test('Register → Login → Access Protected Route', async () => {
        // Register
        const registerRes = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'test@example.com', password: 'Pass123!' });
        
        // Login
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'Pass123!' });
        
        const token = loginRes.body.data.token;
        
        // Access protected route
        const protectedRes = await request(app)
            .get('/api/v1/profile')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
```

---

## Performance Optimization Checklist

- [ ] Database indexes on frequently filtered fields
- [ ] Pagination on list endpoints
- [ ] Redis caching for expensive queries
- [ ] Lazy loading for relations
- [ ] Compression middleware (gzip)
- [ ] Connection pooling
- [ ] Query optimization (select only needed fields)
- [ ] N+1 query prevention

---

## Security Checklist for Each Change

- [ ] No hardcoded secrets
- [ ] Input validated with Joi
- [ ] Authorization checked
- [ ] User ID/role not updatable by users
- [ ] XSS prevention (sanitizeInput middleware)
- [ ] CORS properly scoped
- [ ] No sensitive data in logs
- [ ] Rate limiting on auth
- [ ] SQL/NoSQL injection prevention
- [ ] HTTPS in production

---

## Deployment Preparation

### Pre-Deployment Steps
```bash
# 1. Run full test suite
npm test

# 2. Generate coverage report
npm run test:coverage

# 3. Check for vulnerabilities
npm audit

# 4. Build and verify
npm run build 2>/dev/null || npm start

# 5. Create deployment checklist
# (See PRODUCTION_READY.md)
```

### Deploy Script Example
```bash
#!/bin/bash
# deploy.sh

set -e  # Exit on error

echo "Running tests..."
npm test

echo "Installing production dependencies..."
npm ci --only=production

echo "Starting server..."
npm start

echo "✅ Deployment successful!"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT env var or `lsof -i :5000 \| kill -9` |
| MongoDB connection failed | Check MONGODB_URI, ensure MongoDB running |
| Tests failing | Check Node version (16+), run `npm install` |
| Swagger docs not loading | Clear browser cache, check /api/docs |
| Rate limit blocking legitimate traffic | Adjust windowMs or max in server.js |
| High memory usage | Check for memory leaks, enable profiling |

---

## Code Style

### ESLint Configuration (Recommended)
```bash
npm install -D eslint eslint-config-airbnb-base
```

### Format with Prettier (Recommended)
```bash
npm install -D prettier
npx prettier --write "**/*.js"
```

### Current Code Standards
- ✅ ES6+ features allowed
- ✅ Async/await preferred over callbacks
- ✅ Meaningful variable names
- ✅ Comments only for complex logic
- ✅ Consistent error handling

---

## Resources

| Resource | Link |
|----------|------|
| Express Docs | https://expressjs.com |
| Mongoose Docs | https://mongoosejs.com |
| Joi Validation | https://joi.dev |
| JWT Introduction | https://jwt.io |
| REST API Best Practices | https://restfulapi.net |

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-06

