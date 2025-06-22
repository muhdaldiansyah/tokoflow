// app/api/test/route.js
import { successResponse } from '@/lib/utils/api-response';

/**
 * GET /api/test - Test endpoint to verify API is working
 * No authentication required
 */
export async function GET() {
  return successResponse({
    message: 'TokoFlow API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/products',
      sales: '/api/sales',
      inventory: '/api/inventory',
      process: '/api/process',
      dashboard: '/api/dashboard',
      documentation: 'See API_DOCUMENTATION.md'
    }
  });
}

/**
 * POST /api/test - Echo test for debugging
 * Returns whatever is sent in the body
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    return successResponse({
      message: 'Echo test successful',
      received: body,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return successResponse({
      message: 'Echo test - invalid JSON',
      error: error.message
    });
  }
}
