import { NextRequest, NextResponse } from 'next/server';

     export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
       const targetUrl = `https://bookingticketwebsite.onrender.com/api/${params.path.join('/')}`;
       console.log(`Proxying request to: ${targetUrl}`);

       const response = await fetch(targetUrl, {
         method: 'GET',
         headers: {
           'Content-Type': 'application/json',
           Cookie: req.headers.get('cookie') || '',
         },
         credentials: 'include',
       });

       const data = await response.text();
       return new NextResponse(data, {
         status: response.status,
         statusText: response.statusText,
         headers: response.headers,
       });
     }

     export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
       const targetUrl = `https://bookingticketwebsite.onrender.com/api/${params.path.join('/')}`;
       console.log(`Proxying request to: ${targetUrl}`);

       const body = await req.json();
       const response = await fetch(targetUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Cookie: req.headers.get('cookie') || '',
         },
         credentials: 'include',
         body: JSON.stringify(body),
       });

       const data = await response.text();
       return new NextResponse(data, {
         status: response.status,
         statusText: response.statusText,
         headers: response.headers,
       });
     }