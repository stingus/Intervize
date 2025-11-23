# Deployment Guide

## Production Build

Build the application for production:

```bash
pnpm build
```

The build output will be in the `dist/` directory.

## Environment Variables for Production

Create a `.env.production` file:

```env
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_ENV=production
```

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

1. Install Vercel CLI: `pnpm add -g vercel`
2. Run: `vercel`
3. Follow prompts to deploy

### Option 2: Netlify

1. Install Netlify CLI: `pnpm add -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Configure build settings:
   - Build command: `pnpm build`
   - Publish directory: `dist`

### Option 3: Static Hosting (AWS S3, CloudFront, etc.)

1. Build the app: `pnpm build`
2. Upload the `dist/` folder to your static hosting service
3. Configure routing for SPA (redirect all routes to index.html)

### Option 4: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY ../frontend/package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY ../frontend .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Build and run:

```bash
docker build -t laptop-checkout-frontend .
docker run -p 80:80 laptop-checkout-frontend
```

## Production Checklist

- [ ] Set `VITE_API_URL` to production API endpoint
- [ ] Enable HTTPS
- [ ] Configure CORS on backend to allow production domain
- [ ] Set up CDN for static assets (optional)
- [ ] Enable gzip compression
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure analytics (Google Analytics, etc.)
- [ ] Test all features on production
- [ ] Set up CI/CD pipeline

## Performance Optimization

### Code Splitting

The app already uses React Router lazy loading for admin pages.

### Caching

Configure cache headers for static assets:

```nginx
location /assets {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Compression

Enable gzip/brotli compression on your server.

## Security Headers

Add security headers to your server configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

## Monitoring

### Error Tracking

Set up Sentry:

```bash
pnpm add @sentry/react
```

Initialize in `main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.VITE_ENV,
});
```

### Analytics

Add Google Analytics or similar in `index.html`.

## Troubleshooting

### Blank Page After Deployment

- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Ensure server is configured for SPA routing
- Check CORS configuration on backend

### API Connection Issues

- Verify backend is accessible from frontend domain
- Check CORS headers on backend
- Verify API URL in environment variables
- Check network tab in browser DevTools

### Build Failures

- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Clear build cache: `rm -rf dist`
- Check Node.js version (should be 18+ or 20+)
