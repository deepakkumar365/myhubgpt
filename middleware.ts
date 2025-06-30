import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Since we can't access localStorage in middleware (server-side),
// we'll use a client-side approach for authentication redirection.
// This middleware will only handle initial page loads for SEO and performance.

export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/myhub-tools';
  
  // For API routes, we'll let the client handle authentication
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // For all other routes, we'll rely on client-side redirection
  // This is just a fallback for initial page loads
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /favicon.ico, /robots.txt (static files)
     */
    '/((?!api|_next|_static|favicon.ico|robots.txt).*)',
  ],
};