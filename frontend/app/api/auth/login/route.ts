import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const username = formData.get('name') as string;
    const password = formData.get('password') as string;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Build the URLSearchParams for the backend request
    const params = new URLSearchParams();
    params.append('name', username);
    params.append('password', password);
    
    // Forward the request to the backend
    const response = await fetch('https://bookingticketwebsite.onrender.com/dang-nhap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params,
      credentials: 'include',
    });
    
    // Try to parse as JSON, fallback to text if not valid JSON
    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If not valid JSON, handle the response differently
      console.error('Invalid JSON response:', responseText);
      data = { 
        success: response.ok,
        message: response.ok ? 'Đăng nhập thành công' : 'Đăng nhập thất bại',
        userType: 'USER',  // Default user type if not provided by backend
        userId: '3'        // Default user ID if not provided by backend
      };
    }
    
    // Create a response with appropriate status and headers
    return NextResponse.json(data, {
      status: response.ok ? 200 : 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Server error during login'
      },
      { status: 500 }
    );
  }
} 