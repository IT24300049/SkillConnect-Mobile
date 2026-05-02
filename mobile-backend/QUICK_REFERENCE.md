# SkillConnect Mobile - Quick Reference Guide

## 🚀 Quick Start (2 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env

# 3. Generate strong JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env

# 4. Run tests
npm test

# 5. Start server
npm run dev
```

## 📍 Important URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:5000/api/health` | Health check + DB status |
| `http://localhost:5000/api/docs` | Swagger API documentation |
| `http://localhost:5000/api/v1/auth/register` | User registration |
| `http://localhost:5000/api/v1/jobs` | Jobs listing |

## 🔐 Security Key Points

- **JWT Expiration:** 1 hour (not 7 days)
- **Rate Limiting:** 5 requests per 15 minutes on `/auth/*`
- **Password:** Min 8 chars, 1 uppercase, 1 number, 1 special char
- **CORS:** Whitelist via `ALLOWED_ORIGINS` env var
- **Field Updates:** Whitelist only allows specific fields

## 📊 Database Indexes

All automatic, created on startup:

```javascript
User: { email, role, createdAt }
Job: { customer, status, expiryDate }
Booking: { customer, worker, status }
Review: { booking, rating }
Complaint: { booking, status }
```

## 🧪 Testing

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm test -- auth.test.js # Specific file
```

## 📝 Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| PORT | No | 5000 |
| MONGODB_URI | Yes | mongodb://localhost:27017/skillconnect |
| JWT_SECRET | Yes | random_32_char_string |
| LOG_LEVEL | No | debug |
| ALLOWED_ORIGINS | No | http://localhost:3000 |
| NODE_ENV | No | development |
| SENTRY_DSN | No | (for error tracking) |
| REDIS_URL | No | (for caching) |

## 🐛 Debugging

```bash
# See all logs in real-time
tail -f logs/combined.log

# See only errors
tail -f logs/error.log

# Check MongoDB connection
curl http://localhost:5000/api/health

# Test authorization
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/v1/profile
```

## 📚 Documentation Files

- **PRODUCTION_READY.md** - Production deployment guide
- **SECURITY_IMPROVEMENTS.md** - Security details
- **API_GUIDE.md** - API endpoints reference
- **TESTING_GUIDE.md** - Testing procedures
- **IMPLEMENTATION_REPORT.md** - What was fixed

## 🔧 Common Tasks

### Register New User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Jobs with Pagination
```bash
curl "http://localhost:5000/api/v1/jobs?limit=20&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Job
```bash
curl -X POST http://localhost:5000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jobTitle": "House Cleaning",
    "description": "Clean 3 bedroom house",
    "category": "cleaning",
    "budget": 50
  }'
```

## 🚨 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

## 📈 Performance Tips

- Use Redis caching for worker profiles: `REDIS_URL=redis://localhost:6379`
- Use indexes (already enabled) for frequent queries
- Paginate large result sets (max 100 items)
- Monitor with Sentry: `SENTRY_DSN=your-dsn`

## ✅ Pre-Deployment Checklist

- [ ] `npm test` passes all tests
- [ ] `npm run test:coverage` shows >75% coverage
- [ ] `.env` file configured with production values
- [ ] `JWT_SECRET` is 32+ random characters
- [ ] `MONGODB_URI` points to production database
- [ ] `ALLOWED_ORIGINS` has production domain
- [ ] `NODE_ENV=production`
- [ ] Health check: `curl http://localhost:5000/api/health`
- [ ] Swagger docs: Visit `/api/docs`
- [ ] Logs writing to `/logs` directory

## 🔄 Common Workflows

### Add New Endpoint
1. Create route in `routes/newfeature.js`
2. Add Joi validation schema
3. Add authorization checks
4. Add logging for debugging
5. Add tests in `__tests__/integration`

### Fix a Bug
1. Create test that reproduces bug
2. Fix code
3. Verify test passes
4. Check no other tests break

### Deploy to Production
1. Run `npm test` - all must pass
2. Update `.env` with production values
3. Run `npm ci --only=production`
4. Run `npm start`
5. Verify health check
6. Monitor logs for errors

---

## 📞 Support Resources

**Documentation:** Check PRODUCTION_READY.md and API_GUIDE.md first  
**Tests:** Run `npm test -- --verbose` for detailed output  
**Logs:** Check `logs/error.log` for production issues  
**Monitoring:** Set `SENTRY_DSN` to track errors  

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-04-06

