"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState({
    bookingId: '',
    amount: '',
    txnRef: ''
  })

  useEffect(() => {
    // Get payment details from URL
    const bookingId = searchParams.get('bookingId') || ''
    const amount = searchParams.get('amount') || ''
    const txnRef = searchParams.get('txnRef') || ''

    setPaymentDetails({
      bookingId,
      amount,
      txnRef
    })

    // Store payment success in session storage
    sessionStorage.setItem('paymentSuccess', JSON.stringify({
      bookingId,
      amount,
      txnRef,
      paymentTime: new Date().toISOString()
    }))

  }, [searchParams])

  const handleViewTickets = () => {
    router.push('/lich-su-dat-ve')
  }

  const handleHome = () => {
    router.push('/')
  }

  return (
    <div className="container py-10">
      <Card className="max-w-lg mx-auto p-6">
        <div className="text-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          
          <h2 className="text-xl font-medium mt-4">
            Giao dịch hoàn tất
          </h2>
          
          <p className="mt-2 text-gray-600">
            Cảm ơn bạn đã sử dụng dịch vụ của FUTA Bus Lines
          </p>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Mã đặt vé:</span>
            <span className="font-medium">{paymentDetails.bookingId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Số tiền:</span>
            <span className="font-medium">{parseInt(paymentDetails.amount || '0').toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mã giao dịch:</span>
            <span className="font-medium">{paymentDetails.txnRef}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={handleViewTickets} className="bg-futa-orange hover:bg-futa-orange/90">
            Xem vé của tôi
          </Button>
          
          <Button variant="outline" onClick={handleHome}>
            Về trang chủ
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Loading fallback for Suspense
function PaymentSuccessLoading() {
  return (
    <div className="container py-10">
      <Card className="max-w-lg mx-auto p-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full border-4 border-t-futa-orange border-futa-orange/20 animate-spin mx-auto"></div>
          <p className="mt-4">Đang tải thông tin thanh toán...</p>
        </div>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-green-50 py-8">
          <div className="container">
            <h1 className="text-2xl font-bold text-center">Thanh toán thành công</h1>
          </div>
        </div>

        <Suspense fallback={<PaymentSuccessLoading />}>
          <PaymentSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
} 