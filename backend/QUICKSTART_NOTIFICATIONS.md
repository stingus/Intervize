# Notification System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Start Required Services

```bash
# From the project root
docker compose up -d postgres redis
```

### 2. Install Dependencies (if not already done)

```bash
cd backend
pnpm install
```

### 3. Run Migrations (if not already done)

```bash
pnpm prisma migrate dev
```

### 4. Start the Backend

```bash
pnpm run start:dev
```

You should see:
```
[Bootstrap] Application is running on: http://localhost:3000
[Bootstrap] Bull Board UI available at /admin/queues (Admin only)
[Bootstrap] Bull Board: http://localhost:3000/admin/queues
[EmailService] SendGrid API key not configured. Using mock email service.
```

### 5. Get Admin Access Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Save the `accessToken` from response:
```bash
export TOKEN="paste-your-token-here"
```

### 6. Test the Notification System

#### View Notification Stats
```bash
curl http://localhost:3000/api/notifications/stats \
  -H "Authorization: Bearer $TOKEN"
```

#### Trigger Overdue Check
```bash
curl -X POST http://localhost:3000/api/notifications/check-overdue \
  -H "Authorization: Bearer $TOKEN"
```

#### View Notification History
```bash
curl http://localhost:3000/api/notifications/history \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Access Bull Board Dashboard

The Bull Board UI requires a browser with the Authorization header. Use one of these methods:

**Method 1: Using a Browser Extension**
1. Install "ModHeader" or similar browser extension
2. Add header: `Authorization: Bearer YOUR_TOKEN`
3. Visit: http://localhost:3000/admin/queues

**Method 2: Using Postman**
1. Open Postman
2. Create GET request to: http://localhost:3000/admin/queues
3. Add Authorization header: `Bearer YOUR_TOKEN`
4. Send request and view HTML response

### 8. Test Email Notifications

#### Report a Laptop as Lost (creates notification)

First, login as a user and checkout a laptop, then:

```bash
# Get user token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "user123"}'

export USER_TOKEN="paste-user-token-here"

# Report laptop lost
curl -X POST http://localhost:3000/api/checkouts/report-lost \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"laptopUniqueId": "LAPTOP-001"}'
```

#### Check Console for Mock Email

Look for logs like:
```
[EmailService] [MOCK EMAIL] Sending email to: admin@example.com
[EmailService] [MOCK EMAIL] Subject: Laptop Reported Lost: LAPTOP-001
[EmailProcessor] Email sent successfully for notification xxx
```

## 📊 What You Just Set Up

✅ **Email Queue**: Asynchronous email processing with Bull
✅ **Scheduled Jobs**: Hourly overdue checkout checks
✅ **Bull Board**: Job monitoring dashboard at `/admin/queues`
✅ **Notifications API**: Full CRUD and management endpoints
✅ **Mock Emails**: Development-friendly email logging

## 🎯 Next Steps

1. **Configure SendGrid** (optional, for real emails):
   - Get API key from SendGrid
   - Add to `.env`: `SENDGRID_API_KEY=your-key`
   - Restart server

2. **Customize Overdue Threshold**:
   - Edit `.env`: `OVERDUE_THRESHOLD_MINUTES=720` (12 hours)
   - Restart server

3. **Monitor Queue Health**:
   - Visit Bull Board regularly
   - Check notification stats endpoint
   - Review failed jobs

4. **Read Full Documentation**:
   - `NOTIFICATIONS_SYSTEM.md` - Complete system docs
   - `TEST_NOTIFICATIONS.md` - Comprehensive testing guide
   - `IMPLEMENTATION_SUMMARY.md` - Technical details

## 🐛 Troubleshooting

### Redis Connection Error
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis if needed
docker compose restart redis
```

### Emails Not Sending (Mock Mode)
This is expected in development! Check server console logs for email output.

### Bull Board 401 Error
- Verify you're using an admin token
- Check token hasn't expired (15 min default)
- Re-login to get fresh token

### Jobs Stuck in Queue
- Check Redis connection
- Restart server: `pnpm run start:dev`
- Check processor logs for errors

## 📚 Documentation

- **Full System Docs**: `NOTIFICATIONS_SYSTEM.md`
- **Testing Guide**: `TEST_NOTIFICATIONS.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`

## 💡 Tips

- Mock email mode is perfect for development
- Bull Board is your best friend for debugging queue issues
- Check notification stats regularly during testing
- Failed jobs are retained for inspection
- Cron job runs every hour on the hour

## 🎉 You're All Set!

The notification system is running and ready to use. Check the docs for advanced features and testing procedures.
