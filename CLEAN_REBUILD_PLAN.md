# Clean Rebuild Plan - Frontend/Backend Separation

## Overview

This document outlines the clean separation between your V0 frontend and backend logic, ensuring that:

1. **Frontend is completely dumb** - handles only UI/UX and API calls
2. **Backend contains all secrets** - API keys, sensitive logic, and business rules
3. **Clear API boundaries** - well-defined endpoints with proper error handling
4. **Environment separation** - proper configuration management

## Architecture Changes Made

### 1. Backend API Structure ✅

Created proper REST API endpoints:

```
/api/auth/
├── signin/route.ts          # User authentication
├── signup/route.ts          # User registration  
└── signout/route.ts         # User logout

/api/users/
└── profile/route.ts         # User profile management

/api/progress/
├── save/route.ts            # Save exercise progress
└── patient/[patientId]/route.ts  # Get patient progress

/api/analyze-pose/route.ts   # AI-powered pose analysis
```

### 2. Frontend API Client ✅

Created `lib/api-client.ts` - a clean, type-safe API client that:
- Makes HTTP requests to backend endpoints
- Handles errors gracefully
- Provides type-safe interfaces
- Contains NO secrets or sensitive logic

### 3. Environment Configuration ✅

Created `lib/config.ts` with proper separation:
- **Frontend config**: Safe to expose (app name, API URLs, feature flags)
- **Backend config**: Server-side only (API keys, database URLs, secrets)

### 4. Updated Authentication ✅

Refactored `contexts/auth-context.tsx` to:
- Use the API client instead of direct localStorage manipulation
- Make proper API calls to backend endpoints
- Handle authentication state through backend APIs

### 5. Clean AI Component ✅

Created `components/ai-suggestions-panel-clean.tsx` that:
- Uses the API client for pose analysis
- Contains only UI logic
- Makes API calls to backend for AI processing

## Key Principles Implemented

### Frontend (V0 React UI)
- ✅ **Handles UI/UX only**: Video capture, forms, dashboards, user interactions
- ✅ **Calls APIs for logic**: All business logic delegated to backend
- ✅ **No embedded secrets**: API keys and sensitive data never exposed
- ✅ **Type-safe API calls**: Clean interfaces with proper error handling

### Backend (Next.js API Routes)
- ✅ **Contains all secrets**: OpenAI API keys, database credentials, JWT secrets
- ✅ **Business logic**: Authentication, pose analysis, progress tracking
- ✅ **Data validation**: Input validation and sanitization
- ✅ **Error handling**: Proper HTTP status codes and error messages

## Environment Variables

### Backend Only (Server-side)
```bash
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### Frontend Safe (Public)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Forma
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_ANALYSIS=true
NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING=true
NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=https://storage.googleapis.com/...
```

## Usage Examples

### Frontend Component (Clean)
```tsx
import { apiClient } from '@/lib/api-client'

function MyComponent() {
  const [suggestions, setSuggestions] = useState(null)
  
  const analyzePose = async () => {
    const result = await apiClient.analyzePose({
      exercise: 'squat',
      landmarks: poseData,
      formIssues: ['knee_valgus']
    })
    
    if (result.data) {
      setSuggestions(result.data)
    }
  }
  
  return <div>...</div>
}
```

### Backend API Route (Secure)
```tsx
import { getBackendConfig } from '@/lib/config'

export async function POST(request: NextRequest) {
  const config = getBackendConfig() // Server-side only
  const openai = new OpenAI({
    apiKey: config.openaiApiKey // Secret stays on server
  })
  
  // Process request...
}
```

## Security Benefits

1. **API Keys Protected**: OpenAI keys never exposed to frontend
2. **Input Validation**: All user input validated on backend
3. **Error Handling**: Sensitive error details not leaked to frontend
4. **Type Safety**: Compile-time checks for API contracts
5. **Environment Separation**: Clear distinction between public/private config

## Next Steps

1. **Update remaining components** to use the API client
2. **Add proper session management** with HTTP-only cookies
3. **Implement rate limiting** on API endpoints
4. **Add API documentation** with OpenAPI/Swagger
5. **Set up proper logging** and monitoring

## Migration Guide

To update existing components:

1. Replace direct `authService` calls with `apiClient` calls
2. Remove any hardcoded API keys or secrets
3. Use `getFrontendConfig()` for configuration
4. Handle API responses with proper error checking
5. Update imports to use the new API client

## Testing

- Frontend components can be tested with mocked API responses
- Backend APIs can be tested independently
- Integration tests verify API contracts
- No secrets in test files

This architecture ensures your V0 frontend remains clean and focused on UI/UX while all sensitive logic and secrets are properly secured in the backend.
