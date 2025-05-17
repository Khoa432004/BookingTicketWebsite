"use client";

import { useState, useEffect } from 'react';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup } from "@/components/ui/radio-group";
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { BookTicketRequest } from "@/app/api/tickets/book/route";

export interface PreparePaymentRequest {
  bookingId: number;
  amount: number;
  method: PaymentMethod;
}

export type PaymentMethod = "TRANSFER" | "BY_CASH";

interface PaymentInfo {
  seatId: number;
  seatNumber: string;
  tripId: number;
  customerId: number;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  amount: number;
  tripDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    busType: string;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("TRANSFER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const paymentMethods = [
    {
      id: "TRANSFER" as PaymentMethod,
      title: "Chuyển khoản (VNPay)",
      description: "Thanh toán qua cổng VNPay",
    },
    {
      id: "BY_CASH" as PaymentMethod,
      title: "Thanh toán khi nhận vé (COD)",
      description: "Thanh toán trực tiếp tại quầy vé",
    },
  ];

  // Load booking info from session storage
  useEffect(() => {
    const bookingInfo = JSON.parse(sessionStorage.getItem("pendingBooking") || "{}");
    console.log("Loaded booking info:", bookingInfo);

    if (bookingInfo && Object.keys(bookingInfo).length > 0) {
      setPaymentInfo(bookingInfo);
    } else {
      router.push('/');
    }
  }, [router]);

  const handleCancel = () => {
    router.back();
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // Get booking info from session storage
      const bookingInfoStr = sessionStorage.getItem('pendingBooking');
      if (!bookingInfoStr) {
        throw new Error('Không tìm thấy thông tin đặt vé');
      }

      const bookingInfo = JSON.parse(bookingInfoStr);
      console.log('Payment info before booking:', bookingInfo);

      // Create booking request
      const bookingRequest = {
        seatId: bookingInfo.seatId,
        tripId: bookingInfo.tripId,
        passengerName: bookingInfo.passengerName,
        passengerPhone: bookingInfo.passengerPhone,
        passengerEmail: bookingInfo.passengerEmail
      };

      // Book the ticket
      const bookingResponse = await fetch('/api/tickets/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest)
      });

      const bookingData = await bookingResponse.json();
      console.log('Booking response:', {
        status: bookingResponse.status,
        ok: bookingResponse.ok,
        data: bookingData
      });

      if (!bookingResponse.ok) {
        throw new Error(bookingData.error || 'Không thể đặt vé');
      }

      // If payment method is TRANSFER, redirect to VNPay
      if (selectedMethod === 'TRANSFER') {
        const paymentRequest: PreparePaymentRequest = {
          bookingId: bookingData.ticket.id,
          amount: bookingInfo.amount,
          method: selectedMethod
        };

        const paymentResponse = await fetch('/api/payments/prepare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentRequest)
        });

        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Không thể tạo URL thanh toán');
        }

        // Store booking reference for after payment return
        sessionStorage.setItem('pendingPaymentBookingId', bookingData.ticket.id.toString());
        
        // Redirect to VNPay payment page
        window.location.href = paymentData.data;
        return;
      }

      // If COD or other payment method
      // Clear booking info from session storage
      sessionStorage.removeItem('pendingBooking');

      // Store booking history
      const historyData = {
        bookingId: bookingData.ticket.id,
        seatNumber: bookingData.ticket.seatNumber,
        tripInfo: bookingData.ticket.tripInfo,
        passengerName: bookingData.ticket.passengerName,
        passengerPhone: bookingData.ticket.passengerPhone,
        passengerEmail: bookingData.ticket.passengerEmail,
        bookingTime: bookingData.ticket.bookingTime,
        amount: bookingInfo.amount,
        status: 'SUCCESS',
        paymentMethod: selectedMethod
      };

      sessionStorage.setItem('lastBooking', JSON.stringify(historyData));

      // Show success message and redirect
      alert('Đặt vé thành công!');
      router.push('/lich-su-dat-ve');

    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  if (!paymentInfo) {
    return <div>Loading...</div>;
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
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="p-4">
                <h2 className="font-medium mb-4">Chọn phương thức thanh toán</h2>

                <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`${
                          selectedMethod === method.id ? "bg-blue-50 border-blue-500" : "border-gray-200"
                        } relative border rounded-lg px-5 py-4 cursor-pointer focus:outline-none`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-sm">
                              <p className="font-medium">{method.title}</p>
                              <span className="text-gray-500">{method.description}</span>
                            </div>
                          </div>
                          {selectedMethod === method.id && (
                            <div className="flex-shrink-0 text-blue-500">
                              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                                <circle cx={12} cy={12} r={12} fill="currentColor" opacity="0.2" />
                                <path
                                  d="M7 13l3 3 7-7"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {selectedMethod === 'TRANSFER' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Thông tin chuyển khoản</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Ngân hàng:</strong> VietcomBank</p>
                      <p><strong>Số tài khoản:</strong> 1234567890</p>
                      <p><strong>Chủ tài khoản:</strong> FUTA Bus Lines</p>
                      <p><strong>Nội dung:</strong> {paymentInfo.seatNumber} {paymentInfo.passengerName}</p>
                    </div>
                    <p className="mt-4 text-sm text-blue-600">Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch</p>
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card className="p-4">
                <h2 className="font-medium mb-4">Thông tin thanh toán</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuyến xe</span>
                    <span className="font-medium">
                      {paymentInfo.tripDetails.origin} - {paymentInfo.tripDetails.destination}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thời gian xuất bến</span>
                    <span className="font-medium">
                      {new Date(paymentInfo.tripDetails.departureTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số ghế</span>
                    <span className="font-medium">{paymentInfo.seatNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hành khách</span>
                    <span className="font-medium">{paymentInfo.passengerName}</span>
                  </div>
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá vé lượt đi</span>
                      <span className="font-medium text-futa-orange">
                        {paymentInfo.amount.toLocaleString()}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí thanh toán</span>
                      <span className="font-medium">0đ</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Tổng tiền</span>
                      <span className="text-futa-orange">
                        {paymentInfo.amount.toLocaleString()}đ
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
  );
} 