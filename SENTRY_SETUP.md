# Sentry Monitoring Setup

## Quick Start

1. **Create a Sentry account** at https://sentry.io (free tier available)

2. **Get your DSN keys**:
   - Create a new project for Node.js (backend)
   - Create a new project for React (frontend)
   - Copy the DSN from each project settings

3. **Add to your `.env` file**:
```env
# Backend Sentry DSN (Node.js project)
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/1234567

# Frontend Sentry DSN (React project) - prefix with VITE_
VITE_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7654321
```

4. **Restart the servers**:
```bash
npm run api
npm run dev
```

5. **Verify**: You should see in the console:
```
📊 Sentry monitoring initialized
📊 Sentry frontend monitoring initialized
```

## What's Monitored

### Backend (server.js)
- Unhandled exceptions
- API errors
- Performance traces (20% sampling)

### Frontend (React)
- JavaScript errors
- User session replays on errors
- Performance metrics (20% sampling)

## Test the Integration

Add this to trigger a test error:
```javascript
// In browser console:
throw new Error("Sentry test error!");
```

Check Sentry dashboard to see the captured error.
