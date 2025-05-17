"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Get all URL parameters
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
          params.append(key, value);
        });

        // Verify payment with backend
        const response = await fetch(`/api/payments/verify?${params.toString()}`, {
          method: 'GET',
        });

        const result = await response.json();

        if (response.ok) {
          setSuccess(true);
          
          // Get booking ID from session storage
          const bookingId = sessionStorage.getItem('pendingPaymentBookingId');
          if (bookingId) {
            // Clear after use
            sessionStorage.removeItem('pendingPaymentBookingId');
          }
        } else {
          setSuccess(false);
          setError(result.error || 'Thanh toán thất bại');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setSuccess(false);
        setError('Có lỗi xảy ra khi xác minh thanh toán');
      } finally {
        setLoading(false);
      }
    }

    if (searchParams) {
      verifyPayment();
    }
  }, [searchParams]);

  const handleViewTickets = () => {
    router.push('/lich-su-dat-ve');
  };

  const handleNewBooking = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-futa-orange mx-auto"></div>
            <p className="mt-4 text-lg">Đang xử lý kết quả thanh toán...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className={`py-8 ${success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="container">
            <h1 className="text-2xl font-bold text-center">
              {success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
            </h1>
          </div>
        </div>

        <div className="container py-10">
          <Card className="max-w-lg mx-auto p-6">
            <div className="text-center mb-6">
              {success ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              )}
              
              <h2 className="text-xl font-medium mt-4">
                {success ? 'Giao dịch hoàn tất' : 'Giao dịch không thành công'}
              </h2>
              
              {!success && error && (
                <p className="mt-2 text-red-600">{error}</p>
              )}
              
              {success && (
                <p className="mt-2 text-gray-600">
                  Cảm ơn bạn đã sử dụng dịch vụ của FUTA Bus Lines
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-3 mt-6">
              {success ? (
                <Button onClick={handleViewTickets} className="bg-futa-orange hover:bg-futa-orange/90">
                  Xem vé của tôi
                </Button>
              ) : (
                <Button onClick={handleNewBooking} className="bg-futa-orange hover:bg-futa-orange/90">
                  Đặt vé mới
                </Button>
              )}
              
              <Button variant="outline" onClick={() => router.push('/')}>
                Về trang chủ
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
} 