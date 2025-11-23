# Testing the Notification System

This guide provides step-by-step instructions to test all notification system features.

## Prerequisites

1. Start the services:
```bash
docker compose up -d postgres redis
```

2. Run database migrations (if not already done):
```bash
cd backend
pnpm prisma migrate dev
```

3. Seed the database with test data (if not already done):
```bash
pnpm prisma db seed
```

4. Start the backend server:
```bash
pnpm run start:dev
```

## Step 1: Get Admin JWT Token

First, login as an admin to get a JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Save the `accessToken` from the response. You'll need it for the next steps.

**Set the token as an environment variable for easier testing:**
```bash
export ADMIN_TOKEN="<your-access-token-here>"
```

## Step 2: Access Bull Board Dashboard

Open your browser and navigate to:
```
http://localhost:3000/admin/queues
```

You'll need to pass the JWT token. Since browsers don't send Authorization headers by default, you can:

1. Use a browser extension like "ModHeader" to add the Authorization header
2. Use Postman to access the UI
3. Or use curl to fetch the HTML:

```bash
curl http://localhost:3000/admin/queues \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Step 3: Test Overdue Notifications

### 3.1 Create a Test Checkout (as a user)

First, get a user token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user123"
  }'
```

Save the token:
```bash
export USER_TOKEN="<user-access-token>"
```

Checkout a laptop:
```bash
curl -X POST http://localhost:3000/api/checkouts/checkout \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laptopUniqueId": "LAPTOP-001",
    "userId": "<user-id-from-login-response>"
  }'
```

### 3.2 Manually Trigger Overdue Check (as admin)

Since the cron job runs hourly, you can manually trigger it for testing:

```bash
curl -X POST http://localhost:3000/api/notifications/check-overdue \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "overdueCount": 0
}
```

Note: The checkout you just made won't be overdue yet (threshold is 24 hours by default).

### 3.3 Check Notification Logs

View all notifications:
```bash
curl http://localhost:3000/api/notifications/history \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Step 4: Test Lost/Found Notifications

### 4.1 Report a Laptop as Lost (as user)

```bash
curl -X POST http://localhost:3000/api/checkouts/report-lost \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laptopUniqueId": "LAPTOP-001"
  }'
```

**Expected Response:**
```json
{
  "message": "Laptop reported as lost. Admin has been notified.",
  "laptop": { ... }
}
```

### 4.2 Check Queue Jobs in Bull Board

Refresh the Bull Board dashboard. You should see a new job in the "email" queue for the lost notification.

### 4.3 Process Pending Lost/Found Notifications

```bash
curl -X POST http://localhost:3000/api/notifications/process-lost-found \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4.4 View Notification Logs

Check the notification history filtered by type:
```bash
curl "http://localhost:3000/api/notifications/history?notificationType=lost_found" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4.5 Report Laptop as Found (as admin or another user)

First, checkout another laptop and get its unique ID, then:

```bash
curl -X POST http://localhost:3000/api/checkouts/report-found \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "laptopUniqueId": "LAPTOP-001",
    "finderUserId": "<admin-user-id>"
  }'
```

This will create TWO notifications:
1. Notification to the original user that their laptop was found
2. Thank you notification to the finder

## Step 5: Test Notification Statistics

Get overall notification statistics:

```bash
curl http://localhost:3000/api/notifications/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "total": 3,
  "sent": 2,
  "failed": 0,
  "pending": 1,
  "byType": {
    "lost_found": 3,
    "overdue": 0
  }
}
```

## Step 6: Test Retry Failed Notifications

If any notifications failed (you can check in Bull Board), retry them:

```bash
curl -X POST http://localhost:3000/api/notifications/retry-failed \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Step 7: Monitor Queue in Bull Board

### Using cURL to Monitor Queue Status

```bash
# View the Bull Board UI
curl http://localhost:3000/admin/queues \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Accept: text/html"
```

### Features to Test in Bull Board:

1. **View Queues**: See the "email" queue with job counts
2. **Job Details**: Click on jobs to see their data and status
3. **Retry Failed Jobs**: Use the retry button for failed jobs
4. **Clean Completed Jobs**: Remove old completed jobs

## Step 8: Test Different Notification Filters

### Filter by Status
```bash
curl "http://localhost:3000/api/notifications/history?status=sent" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Filter by User
```bash
curl "http://localhost:3000/api/notifications/history?userId=<user-id>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Pagination
```bash
curl "http://localhost:3000/api/notifications/history?limit=5&offset=0" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Step 9: Check Email Logs (Mock Mode)

If you're running in mock email mode (SENDGRID_API_KEY not configured), check the server logs for email output:

```bash
# View server console output
# Look for lines like:
# [EmailService] [MOCK EMAIL] Sending email to: user@example.com
# [EmailService] [MOCK EMAIL] Subject: Your Lost Laptop Has Been Found
```

## Step 10: Test Scheduled Job (Cron)

The overdue check runs automatically every hour. To test:

1. Wait for the next hour boundary, OR
2. Temporarily modify the cron expression in `notifications.service.ts`:
   ```typescript
   @Cron(CronExpression.EVERY_MINUTE) // Changed from EVERY_HOUR
   ```

3. Rebuild and restart:
   ```bash
   pnpm run build
   pnpm run start:dev
   ```

4. Watch the logs for:
   ```
   [NotificationsService] Running scheduled overdue checkout check...
   ```

## Troubleshooting

### Issue: "Unauthorized" when accessing Bull Board

**Solution**: Make sure you're passing a valid admin JWT token in the Authorization header.

### Issue: Jobs not processing

**Solutions**:
1. Check Redis is running: `docker ps | grep redis`
2. Check server logs for processor errors
3. Verify queue name matches in module registration

### Issue: Emails not sending (mock mode)

This is expected if `SENDGRID_API_KEY` is not configured. Check server console for mock email logs.

### Issue: "Queue not found" error

**Solution**: Make sure the NotificationsModule is imported in AppModule and the BullModule is properly configured.

## Performance Testing

### Bulk Notification Test

Create multiple notifications quickly to test queue performance:

```bash
# Run this script multiple times
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/notifications/check-overdue \
    -H "Authorization: Bearer $ADMIN_TOKEN" &
done
wait
```

Then check Bull Board to see all jobs being processed.

## Expected Results Summary

After running all tests, you should see:

1. ✅ Bull Board accessible at `/admin/queues`
2. ✅ Overdue check runs without errors
3. ✅ Lost notifications created and queued
4. ✅ Found notifications created for both user and finder
5. ✅ Notification logs properly tracking status
6. ✅ Statistics showing correct counts
7. ✅ Mock emails logged to console (if in mock mode)
8. ✅ Failed jobs can be retried
9. ✅ Scheduled cron job executes every hour

## Next Steps

1. Configure SendGrid API key for real email sending
2. Set up proper overdue threshold based on business requirements
3. Implement user invitation and password reset flows
4. Add monitoring and alerting for queue health
5. Consider implementing email templates for better formatting
