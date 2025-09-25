# Configuration Guide

## Environment Setup

### 1. Create Environment File

Create a `.env` file in the frontend directory with the following content:

```env
# API Configuration
VITE_API_URL=https://snowball-u41l.onrender.com

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Optional: Enable debug logging
VITE_DEBUG=false
```

### 2. Backend URL Configuration

The `VITE_API_URL` should point to your backend server:

- **Development**: `http://localhost:3000`
- **Production**: `https://snowball-u41l.onrender.com`
- **Staging**: `https://staging.your-domain.com`

### 3. API Endpoints

The application expects the following backend endpoints:

#### Authentication
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login
- `GET /api/v1/dashboard` - Dashboard data

#### Brand Analysis
- `POST /api/v1/brand/analyze` - Domain analysis
- `GET /api/v1/brand/rank` - Brand ranking
- `POST /api/v1/brand/competitors` - Competitor analysis
- `POST /api/v1/brand/share-of-voice` - Share of voice calculation
- `POST /api/v1/brand/queries` - Generate prompts

#### History
- `GET /api/v1/history` - Get analysis history
- `DELETE /api/v1/history/:id` - Delete history item

#### Legacy Endpoints (for backward compatibility)
- `POST /api/v1/analyze` - Link analysis
- `POST /api/v1/suggest` - Get AI suggestions

### 4. CORS Configuration

Ensure your backend has CORS configured to allow requests from your frontend domain:

```javascript
// Backend CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### 5. Authentication

The frontend expects JWT tokens to be returned in the following format:

```json
{
  "token": "your-jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### 6. Error Response Format

The backend should return errors in this format:

```json
{
  "msg": "Error message",
  "error": "Detailed error information",
  "status": 400
}
```

## Troubleshooting

### Common Configuration Issues

1. **CORS Errors**
   - Check that your backend CORS configuration includes your frontend URL
   - Ensure the protocol (http/https) matches

2. **API Connection Failed**
   - Verify the `VITE_API_URL` is correct
   - Check if the backend server is running
   - Test the API endpoint directly

3. **Authentication Issues**
   - Ensure JWT tokens are being returned correctly
   - Check token expiration settings
   - Verify the token format matches expectations

4. **Environment Variables Not Loading**
   - Restart the development server after changing `.env`
   - Ensure the `.env` file is in the correct location
   - Check that variable names start with `VITE_`

### Development vs Production

#### Development
```env
VITE_API_URL=http://localhost:3000
VITE_DEBUG=true
```

#### Production
```env
VITE_API_URL=https://snowball-u41l.onrender.com
VITE_DEBUG=false
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different URLs for development and production
   - Consider using environment-specific files

2. **API Security**
   - Use HTTPS in production
   - Implement proper rate limiting
   - Validate all inputs on the backend

3. **Token Security**
   - Store tokens securely in localStorage
   - Implement token refresh mechanisms
   - Clear tokens on logout

## Performance Optimization

1. **API Caching**
   - Implement caching for static data
   - Use appropriate cache headers
   - Consider implementing request deduplication

2. **Bundle Optimization**
   - Enable code splitting
   - Minimize bundle size
   - Use production builds for deployment

3. **Network Optimization**
   - Use CDN for static assets
   - Implement request batching
   - Optimize API response sizes 