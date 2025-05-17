import { NextResponse } from "next/server"

export type PaymentMethod = "TRANSFER" | "BY_CASH"

export interface PreparePaymentRequest {
  bookingId: number
  amount: number
  method: PaymentMethod
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: Request) {
  try {
    const body: PreparePaymentRequest = await request.json()
    console.log('Payment preparation request:', body)

    // Validate required fields
    if (!body.bookingId || !body.amount || !body.method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a mock VNPay URL for testing
    // In production, this would come from your backend after calling VNPay API
    const mockVnpayUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?amount=${body.amount * 100}&bookingId=${body.bookingId}&vnp_TxnRef=${Date.now()}`
    
    console.log('Generated mock VNPay URL:', mockVnpayUrl)
    
    return NextResponse.json({ 
      success: true,
      data: mockVnpayUrl
    })

    /* Commenting out actual backend call for now
    // Call backend API to prepare payment
    const backendResponse = await fetch(`${process.env.BACKEND_API_URL}/api/payments/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: responseData.message || 'Error preparing payment' },
        { status: backendResponse.status }
      )
    }

    // Return the payment URL
    return NextResponse.json({ data: responseData.data.data })
    */
  } catch (error) {
    console.error('Payment preparation error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare payment' },
      { status: 500 }
    )
  }
}

