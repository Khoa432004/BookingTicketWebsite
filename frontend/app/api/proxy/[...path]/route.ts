import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `https://bookingticketwebsite.onrender.com/${path}`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `https://bookingticketwebsite.onrender.com/${path}`;
  
  try {
    // Get content type to handle different types of requests
    const contentType = request.headers.get('content-type') || '';
    
    // Get the request body in the appropriate format
    let body: string;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // For login requests using form data
      const formData = await request.formData();
      const urlParams = new URLSearchParams();
      
      // Convert FormData to URLSearchParams
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          urlParams.append(key, value);
        }
      });
      
      body = urlParams.toString();
    } else {
      // For JSON requests
      body = await request.text();
    }
    
    // Forward the request to the backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: body,
      credentials: 'include',
    });

    // Try to parse as JSON, fallback to text if not valid JSON
    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText || 'Success' };
    }
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to post data to API' },
      { status: 500 }
    );
  }
} 