# Notification System Documentation

## Overview

The Laptop Checkout System now includes a comprehensive notification system using Bull queues for asynchronous email processing. This system handles various types of notifications including overdue checkouts, lost/found events, user invitations, and password resets.

## Features

### 1. Email Queue System
- Asynchronous email processing using Bull queues
- Automatic retry with exponential backoff for failed emails
- Job monitoring and management via Bull Board UI
- Notification logging and tracking in the database

### 2. Notification Types

#### Overdue Notifications
- Automatically checks for overdue checkouts every hour
- Sends reminder emails to users who haven't returned laptops
- Configurable threshold (default: 24 hours)
- Rate limited to one notification per checkout per 24 hours

#### Lost/Found Notifications
- Admin notification when a laptop is reported lost
- User notification when their lost laptop is found
- Thank you notification to the finder

#### User Invitation (Future)
- Welcome emails with account setup links
- Template ready for implementation

#### Password Reset (Future)
- Password reset email with secure tokens
- Template ready for implementation

### 3. Bull Board UI
- Real-time queue monitoring dashboard
- Job status tracking (waiting, active, completed, failed)
- Retry failed jobs manually
- Admin-only access with JWT authentication
- Available at `/admin/queues`

## Architecture

### Components

#### 1. Notifications Module (`src/notifications/`)
```
notifications/
├── dto/
│   └── notification-filters.dto.ts    # Query filters for notification history
├── interfaces/
│   └── email-options.interface.ts     # Email and job data interfaces
├── processors/
│   └── email.processor.ts             # Queue job processors
├── email.service.ts                   # Email sending service (SendGrid/Mock)
├── notifications.controller.ts        # API endpoints for notifications
├── notifications.module.ts            # Module configuration
└── notifications.service.ts           # Business logic and scheduled jobs
```

#### 2. Bull Board Module (`src/bull-board/`)
```
bull-board/
├── bull-board.middleware.ts           # JWT authentication middleware
└── bull-board.module.ts               # Module configuration
```

### Database Schema

The system uses the existing `NotificationLog` table:
```prisma
model NotificationLog {
  id                String             @id @default(uuid())
  notificationType  NotificationType   @map("notification_type")
  recipientEmail    String             @map("recipient_email")
  recipientUserId   String?            @map("recipient_user_id")
  subject           String
  body              String?
  relatedEntityType String?            @map("related_entity_type")
  relatedEntityId   String?            @map("related_entity_id")
  status            NotificationStatus @default(pending)
  sentAt            DateTime?          @map("sent_at")
  failedAt          DateTime?          @map("failed_at")
  errorMessage      String?            @map("error_message")
  retryCount        Int                @default(0) @map("retry_count")
  createdAt         DateTime           @default(now()) @map("created_at")
  updatedAt         DateTime           @updatedAt @map("updated_at")
}
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# Email (SendGrid)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Laptop Checkout System

# Bull Queue
BULL_QUEUE_EMAIL_ATTEMPTS=3
BULL_QUEUE_EMAIL_BACKOFF=exponential

# Notifications
OVERDUE_THRESHOLD_MINUTES=1440
ADMIN_EMAIL=admin@example.com
```

### Mock Email Mode

If `SENDGRID_API_KEY` is not configured or set to `your-sendgrid-api-key`, the system will use mock email mode, which logs emails to the console instead of sending them. This is useful for development and testing.

## API Endpoints

All endpoints require admin authentication except where noted.

### Get Notification History
```
GET /api/notifications/history
Query params:
  - userId?: string
  - notificationType?: overdue | lost_found | user_invitation | password_reset
  - status?: pending | sent | failed | bounced
  - limit?: number (default: 50)
  - offset?: number (default: 0)

Response:
{
  "notifications": [...],
  "total": 123,
  "limit": 50,
  "offset": 0
}
```

### Get Notification Statistics
```
GET /api/notifications/stats

Response:
{
  "total": 1234,
  "sent": 1000,
  "failed": 34,
  "pending": 200,
  "byType": {
    "overdue": 800,
    "lost_found": 234,
    "user_invitation": 150,
    "password_reset": 50
  }
}
```

### Manually Trigger Overdue Check
```
POST /api/notifications/check-overdue

Response:
{
  "overdueCount": 5
}
```

### Process Pending Lost/Found Notifications
```
POST /api/notifications/process-lost-found

Response:
{
  "processed": 3
}
```

### Retry Failed Notifications
```
POST /api/notifications/retry-failed

Response:
{
  "retried": 2
}
```

## Scheduled Jobs

### Overdue Checkout Check
- **Schedule**: Every hour (cron: `0 * * * *`)
- **Action**:
  1. Finds all active checkouts older than threshold
  2. Checks if notification was sent in last 24 hours
  3. Queues new overdue notifications if needed
- **Configuration**: `OVERDUE_THRESHOLD_MINUTES` env variable

## Queue Processors

### Email Queue (`email`)

#### Job Types:

1. **send-email** - Generic email sending
   - Input: `{ notificationLogId, emailOptions, notificationType }`
   - Updates notification log on success/failure

2. **send-overdue-notification** - Overdue checkout reminder
   - Input: `{ checkoutId }`
   - Creates notification log
   - Sends formatted overdue email

3. **send-lost-found-notification** - Lost/found notification
   - Input: `{ notificationLogId }`
   - Sends notification from existing log entry

#### Retry Configuration:
- Attempts: 3
- Backoff: Exponential (5s, 25s, 125s)
- Failed jobs are kept for manual inspection

## Bull Board Dashboard

### Accessing Bull Board

1. **URL**: `http://localhost:3000/admin/queues`
2. **Authentication**: JWT token required (admin only)
3. **Headers**:
   ```
   Authorization: Bearer <your-admin-jwt-token>
   ```

### Features:
- View all queues and their status
- Monitor active, waiting, completed, and failed jobs
- View job details and data
- Retry failed jobs
- Clean completed jobs

### Using with Postman/cURL:

```bash
# Get admin JWT token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'

# Access Bull Board (paste JWT from login response)
curl http://localhost:3000/admin/queues \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Testing

### 1. Test Overdue Notifications

```bash
# Manually trigger overdue check
curl -X POST http://localhost:3000/api/notifications/check-overdue \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### 2. Test Lost/Found Notifications

```bash
# Report a laptop as lost (creates notification)
curl -X POST http://localhost:3000/api/checkouts/report-lost \
  -H "Authorization: Bearer <user-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"laptopUniqueId": "LAPTOP-001"}'

# Process pending lost/found notifications
curl -X POST http://localhost:3000/api/notifications/process-lost-found \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### 3. View Notification History

```bash
curl "http://localhost:3000/api/notifications/history?limit=10" \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### 4. Check Notification Stats

```bash
curl http://localhost:3000/api/notifications/stats \
  -H "Authorization: Bearer <admin-jwt-token>"
```

## Integration with Existing Services

### Checkouts Service

The checkouts service now automatically queues notifications:

1. **Report Lost**: Creates pending notification for admin and queues it
2. **Report Found**: Creates two notifications (user and finder) and queues both

Example integration:
```typescript
// In checkouts.service.ts
const notification = await this.prisma.notificationLog.create({
  data: {
    notificationType: 'lost_found',
    recipientEmail: 'admin@example.com',
    subject: `Laptop Reported Lost: ${laptop.uniqueId}`,
    body: `Laptop ${laptop.uniqueId} has been reported lost...`,
    status: 'pending',
  },
});

await this.emailQueue.add('send-lost-found-notification', {
  notificationLogId: notification.id,
});
```

## Error Handling

### Automatic Retry
- Failed email jobs are automatically retried up to 3 times
- Exponential backoff prevents overwhelming email service
- Notification logs track retry count and error messages

### Failed Job Monitoring
- Failed jobs remain in queue for inspection
- Access via Bull Board to view error details
- Manual retry available through API or Bull Board

### Notification Status Tracking
- `pending`: Notification created, not yet processed
- `sent`: Email successfully sent
- `failed`: All retry attempts exhausted
- `bounced`: Email bounced (future implementation)

## Performance Considerations

### Queue Configuration
- Jobs are processed asynchronously to avoid blocking API requests
- Redis persistence ensures jobs survive server restarts
- Configurable concurrency for email processing

### Rate Limiting
- Overdue notifications limited to one per checkout per 24 hours
- Prevents spam to users with long-overdue items

### Cleanup
- Completed jobs are automatically removed from queue
- Failed jobs are retained for debugging
- Consider implementing periodic cleanup of old notification logs

## Future Enhancements

1. **Email Templates**: Use a templating engine (Handlebars, EJS) for richer emails
2. **Multiple Channels**: Add SMS, Slack, or push notifications
3. **User Preferences**: Allow users to configure notification preferences
4. **Webhook Support**: Trigger external systems on certain events
5. **Analytics Dashboard**: Track notification delivery rates and user engagement
6. **Batch Notifications**: Daily digest of overdue items instead of individual emails
7. **Email Validation**: Verify email addresses before sending
8. **Bounce Handling**: Process SendGrid webhooks for bounces and complaints

## Troubleshooting

### Emails Not Sending

1. **Check Redis Connection**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Queue Status** via Bull Board or API

3. **Verify SendGrid Configuration**:
   - API key is valid
   - From email is verified in SendGrid
   - No rate limits hit

4. **Check Logs**:
   ```bash
   # Look for email processor logs
   grep "EmailProcessor" logs/app.log
   ```

### Bull Board Not Accessible

1. **Verify JWT Token**: Must be from admin user
2. **Check Helmet Configuration**: CSP may block Bull Board assets
3. **Verify Route**: Should be `/admin/queues` (not `/api/admin/queues`)

### Scheduled Jobs Not Running

1. **Verify ScheduleModule** is imported in NotificationsModule
2. **Check Server Logs** for cron job execution
3. **Manually Trigger** to test: `POST /api/notifications/check-overdue`

## Dependencies

- `@nestjs/bull`: NestJS integration for Bull
- `bull`: Job queue library
- `@bull-board/api`: Bull Board core
- `@bull-board/express`: Express adapter for Bull Board
- `@nestjs/schedule`: Cron job scheduling
- `@sendgrid/mail`: SendGrid email client
- `ioredis`: Redis client

## Security Considerations

1. **Bull Board Access**: Protected by JWT authentication, admin-only
2. **Email Content**: Sanitize user input to prevent injection
3. **API Keys**: Store SendGrid API key in environment variables
4. **Rate Limiting**: Consider adding rate limits to notification endpoints
5. **Data Privacy**: Be careful with PII in notification logs

## Monitoring

### Key Metrics to Track

1. **Email Delivery Rate**: sent / (sent + failed)
2. **Queue Depth**: Number of waiting jobs
3. **Processing Time**: Average job completion time
4. **Failure Rate**: failed / total
5. **Retry Rate**: jobs requiring retries

### Recommended Alerts

1. Queue depth > 1000 jobs
2. Failure rate > 10%
3. Email processor not running
4. Redis connection lost
5. SendGrid API errors

## License

This notification system is part of the Laptop Checkout System.
