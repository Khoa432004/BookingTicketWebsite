import { NextResponse } from "next/server"
import type { Payment } from "../../payments/prepare/route"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function POST(request: Request, { params }: { params: { paymentId: string } }) {
  try {
    const paymentId = params.paymentId

    // Call the Spring Boot API to process payment
    const response = await fetch(`${backendUrl}/api/payments/process/${paymentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error processing payment: ${response.statusText}`)
    }

    const payment: Payment = await response.json()
    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}

