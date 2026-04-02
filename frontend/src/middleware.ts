import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/chat')) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.replace(/^\/chat/, '/agent');
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: '/chat/:path*',
};
