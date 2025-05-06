import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the backend
    const response = await fetch('https://bookingticketwebsite.onrender.com/dang-xuat', {
      method: 'POST',
      credentials: 'include',
    });
    
    // Try to parse as JSON if possible, otherwise create a simple response
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = {
        success: response.ok,
        message: response.ok ? 'Đăng xuất thành công' : 'Đăng xuất thất bại'
      };
    }
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Server error during logout'
      },
      { status: 500 }
    );
  }
} 