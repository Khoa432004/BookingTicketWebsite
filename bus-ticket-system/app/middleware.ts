import { NextRequest, NextResponse } from 'next/server';

     export function middleware(req: NextRequest) {
       const { pathname } = req.nextUrl;
       if (pathname.startsWith('/api/proxy/api')) {
         console.log(`Middleware detected request to: ${pathname}`);
         return NextResponse.next();
       }
     }

     export const config = {
       matcher: '/api/proxy/:path*',
     };