import { NextRequest, NextResponse } from 'next/server';

     export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
       const targetUrl = `https://bookingticketwebsite.onrender.com/api/${params.path.join('/')}`;
       console.log(`Proxying request to: ${targetUrl}`);

       try {
         const response = await fetch(targetUrl, {
           method: 'GET',
           headers: {
             'Content-Type': 'application/json',
             Cookie: req.headers.get('cookie') || '',
           },
           credentials: 'include',
         });

         if (!response.ok) {
           console.error(`Backend returned: ${response.status} - ${response.statusText}`);
           return new NextResponse(await response.text(), {
             status: response.status,
             statusText: response.statusText,
             headers: response.headers,
           });
         }

         const data = await response.text();
         return new NextResponse(data, {
           status: response.status,
           statusText: response.statusText,
           headers: response.headers,
         });
       } catch (error) {
         console.error('Proxy error:', error);
         return new NextResponse('Lỗi khi gọi backend', { status: 500 });
       }
     }

     export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
       const targetUrl = `https://bookingticketwebsite.onrender.com/api/${params.path.join('/')}`;
       console.log(`Proxying request to: ${targetUrl}`);

       try {
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

         if (!response.ok) {
           console.error(`Backend returned: ${response.status} - ${response.statusText}`);
           return new NextResponse(await response.text(), {
             status: response.status,
             statusText: response.statusText,
             headers: response.headers,
           });
         }

         const data = await response.text();
         return new NextResponse(data, {
           status: response.status,
           statusText: response.statusText,
           headers: response.headers,
         });
       } catch (error) {
         console.error('Proxy error:', error);
         return new NextResponse('Lỗi khi gọi backend', { status: 500 });
       }
     }