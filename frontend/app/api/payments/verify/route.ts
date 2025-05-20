import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get URL and search parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Construct query parameters to send to backend
    const queryString = Array.from(searchParams.entries())
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:8080';
    console.log('Backend URL:', backendUrl);
    console.log('Query string:', queryString);

    // Call backend API to verify payment
    const backendResponse = await fetch(
      `${backendUrl}/api/payments/vnpay-return?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: 'Thanh toán thất bại' };
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: errorData.message || 'Thanh toán thất bại' 
        },
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    return NextResponse.json({
      success: true,
      message: responseData.message || 'Thanh toán thành công',
      data: responseData.data
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Có lỗi xảy ra khi xác minh thanh toán' 
      },
      { status: 500 }
    );
  }
} 