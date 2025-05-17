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

    // Call backend API to verify payment
    const backendResponse = await fetch(
      `${process.env.BACKEND_API_URL}/api/payments/vnpay-return?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false,
          error: responseData.message || 'Thanh toán thất bại' 
        },
        { status: backendResponse.status }
      );
    }

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