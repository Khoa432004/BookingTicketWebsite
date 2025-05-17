"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PaymentProps {
  params: {
    id: string
  }
}

interface PendingBooking {
  tripId: number
  seatId: number
  passengerName: string
  passengerPhone: string
  passengerEmail: string
  amount: number
  tripInfo: {
    origin: string
    destination: string
    departureTime: string
    busType: string
    seatNumber: string
  }
}

export default function PaymentPage({ params }: PaymentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'TRANSFER' | 'BY_CASH'>('TRANSFER')
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null)

  useEffect(() => {
    // Load pending booking from session storage
    const storedBooking = sessionStorage.getItem('pendingBooking')
    if (!storedBooking) {
      setError('Không tìm thấy thông tin đặt vé')
      return
    }

    try {
      const bookingData = JSON.parse(storedBooking)
      setPendingBooking(bookingData)
    } catch (err) {
      setError('Lỗi khi đọc thông tin đặt vé')
    }
  }, [])

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!pendingBooking) {
        throw new Error('Không tìm thấy thông tin đặt vé')
      }

      console.log('=== Starting payment process ===')
      console.log('Pending booking:', pendingBooking)

      // Create booking first
      console.log('Creating booking...')
      const bookingResponse = await fetch('/api/tickets/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seatId: pendingBooking.seatId,
          tripId: pendingBooking.tripId,
          passengerName: pendingBooking.passengerName,
          passengerPhone: pendingBooking.passengerPhone,
          passengerEmail: pendingBooking.passengerEmail,
          amount: pendingBooking.amount
        }),
      })

      console.log('Booking response status:', bookingResponse.status)
      const bookingData = await bookingResponse.json()
      console.log('Booking response data:', bookingData)

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json()
        throw new Error(error.error || 'Không thể đặt vé')
      }

      console.log('Booking created:', bookingData)

      // Create payment with correct method and status
      const paymentStatus = selectedMethod === 'TRANSFER' ? 'WAITING_TRANSFER' : 'WAITING_CASH'
      const paymentRequest = {
        bookingId: bookingData.ticket.id,
        amount: pendingBooking.amount,
        method: selectedMethod,
        status: paymentStatus
      }
      
      console.log('Creating payment with request:', paymentRequest)
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      })

      console.log('Payment response status:', paymentResponse.status)
      const paymentResponseText = await paymentResponse.text()
      console.log('Raw payment response:', paymentResponseText)

      let paymentData
      try {
        paymentData = JSON.parse(paymentResponseText)
        console.log('Parsed payment data:', paymentData)
      } catch (e) {
        console.error('Failed to parse payment response:', e)
        throw new Error('Invalid payment response format')
      }

      if (!paymentResponse.ok) {
        console.error('Payment failed with response:', paymentData)
        throw new Error(paymentData.error || 'Không thể tạo thanh toán')
      }

      console.log('Payment created successfully:', paymentData)

      // Store completed booking info
      const completedBooking = {
        bookingId: bookingData.ticket.id,
        paymentId: paymentData.data?.id,
        ...pendingBooking,
        paymentMethod: selectedMethod,
        paymentStatus: paymentStatus
      }
      console.log('Storing completed booking:', completedBooking)
      sessionStorage.setItem('lastBooking', JSON.stringify(completedBooking))
      sessionStorage.removeItem('pendingBooking')

      // Handle different payment methods
      if (selectedMethod === 'TRANSFER') {
        console.log('Preparing VNPay payment...')
        
        try {
          // Call prepare payment API to get VNPay URL
          const preparePaymentRequest = {
            bookingId: bookingData.ticket.id,
            amount: pendingBooking.amount,
            method: selectedMethod
          }
          
          const prepareResponse = await fetch('/api/payments/prepare', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(preparePaymentRequest),
          })
          
          const prepareData = await prepareResponse.json()
          
          if (prepareResponse.ok && prepareData.data) {
            // Redirect to VNPay website
            console.log('Redirecting to VNPay payment page:', prepareData.data)
            window.location.href = prepareData.data
          } else {
            // If VNPay integration fails, just complete the booking
            console.log('VNPay preparation failed, completing booking without online payment')
            alert('Đặt vé thành công! Vui lòng thanh toán tại quầy.')
            router.push('/lich-su-dat-ve')
          }
        } catch (error) {
          console.error('VNPay preparation error:', error)
          alert('Đặt vé thành công! Tuy nhiên cổng thanh toán đang gặp sự cố. Vui lòng thanh toán tại quầy.')
          router.push('/lich-su-dat-ve')
        }
      } else {
        console.log('COD payment completed')
        alert('Đặt vé thành công! Vui lòng đến quầy để thanh toán và nhận vé.')
        router.push('/')
      }

    } catch (error) {
      console.error('Payment error:', error)
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    sessionStorage.removeItem('pendingBooking')
    router.back()
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dat-ve')} className="mt-4">
              Quay lại trang đặt vé
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!pendingBooking) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-futa-orange py-4 text-white">
          <div className="container">
            <h1 className="text-2xl font-bold text-center">Thanh toán</h1>
          </div>
        </div>

        <div className="container py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="p-4">
                <h2 className="font-medium mb-4">Chọn phương thức thanh toán</h2>
                <RadioGroup value={selectedMethod} onValueChange={(value: 'TRANSFER' | 'BY_CASH') => setSelectedMethod(value)}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TRANSFER" id="transfer" />
                      <Label htmlFor="transfer">
                        <div>
                          <div className="font-medium">Thanh toán qua VNPay</div>
                          <div className="text-sm text-gray-500">Thanh toán online qua VNPay</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="BY_CASH" id="cash" />
                      <Label htmlFor="cash">
                        <div>
                          <div className="font-medium">Thanh toán tại quầy (COD)</div>
                          <div className="text-sm text-gray-500">Thanh toán trực tiếp tại quầy vé</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </Card>
            </div>

            <div>
              <Card className="p-4">
                <h2 className="font-medium mb-4">Thông tin thanh toán</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuyến xe</span>
                    <span className="font-medium">
                      {pendingBooking.tripInfo.origin} - {pendingBooking.tripInfo.destination}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian</span>
                    <span className="font-medium">{pendingBooking.tripInfo.departureTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại xe</span>
                    <span className="font-medium">{pendingBooking.tripInfo.busType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số ghế</span>
                    <span className="font-medium">{pendingBooking.tripInfo.seatNumber}</span>
                  </div>
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá vé</span>
                      <span className="font-medium text-futa-orange">
                        {new Intl.NumberFormat('vi-VN').format(pendingBooking.amount)}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí thanh toán</span>
                      <span className="font-medium">0đ</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Tổng tiền</span>
                      <span className="text-futa-orange">
                        {new Intl.NumberFormat('vi-VN').format(pendingBooking.amount)}đ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={loading}>
                    Hủy
                  </Button>
                  <Button
                    className="flex-1 bg-futa-orange hover:bg-futa-orange/90"
                    onClick={handlePayment}
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Thanh toán"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

