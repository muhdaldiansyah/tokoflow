# Supabase Client Structure

## Overview
This project uses separate Supabase clients for client-side and server-side operations to ensure proper Next.js compatibility.

## Client-side Usage
For client components, hooks, and browser-side code:
```javascript
import { createClient } from '@/lib/database/supabase/client';
```

## Server-side Usage
For Server Components, Route Handlers, Server Actions, and API routes:
```javascript
import { createClient } from '@/lib/database/supabase-server';
```

## Important Notes
- Never import server-side utilities in client components
- The server-side client uses `next/headers` which is only available in server contexts
- Always use the appropriate client based on your component type

## File Structure
```
lib/
├── database/
│   ├── supabase/          # Client-side utilities
│   │   ├── client.js      # Browser client
│   │   └── index.js       # Exports (if needed)
│   └── supabase-server/   # Server-side utilities
│       └── index.js       # Server client with cookies support
```

## Migration from Previous Structure
The previous `server.js` file has been moved to `supabase-server/index.js` to prevent Next.js build errors when using `next/headers` in non-server contexts.