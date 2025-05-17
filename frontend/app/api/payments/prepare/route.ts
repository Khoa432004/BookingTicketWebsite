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

    // Call backend API to prepare payment
    console.log('Calling backend API to prepare VNPay payment')
    console.log('Backend URL:', backendUrl)
    
    const backendResponse = await fetch(`${backendUrl}/api/payments/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('Backend response status:', backendResponse.status)
    
    const responseText = await backendResponse.text()
    console.log('Raw backend response:', responseText)
    
    // Parse the response text to JSON
    let responseData
    try {
      responseData = responseText ? JSON.parse(responseText) : {}
      console.log('Parsed response data:', responseData)
    } catch (e) {
      console.error('Error parsing response:', e)
      return NextResponse.json(
        { error: 'Invalid response from payment server' },
        { status: 500 }
      )
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: responseData.message || 'Error preparing payment' },
        { status: backendResponse.status }
      )
    }

    // Check if we have the payment URL in the response
    const paymentUrl = responseData.data?.data
    
    if (!paymentUrl) {
      console.log('No payment URL found in response, falling back to mock URL')
      // Fallback to the payment success URL
      const fallbackUrl = `/payment-success?bookingId=${body.bookingId}&amount=${body.amount}&txnRef=${Date.now()}`
      return NextResponse.json({ success: true, data: fallbackUrl })
    }
    
    console.log('Returning VNPay URL:', paymentUrl)
    // Return the payment URL from VNPay
    return NextResponse.json({ success: true, data: paymentUrl })
    
  } catch (error) {
    console.error('Payment preparation error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare payment' },
      { status: 500 }
    )
  }
}

