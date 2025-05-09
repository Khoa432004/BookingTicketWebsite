"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { Info, AlertCircle } from "lucide-react"
import { getAvailableSeats, checkSeatAvailability, getTripById } from "@/lib/api"
import type { Seat as SeatType } from "@/types/seat"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { tripApi } from "@/services/api"
import { use } from "react"
import getApiBaseUrl from "@/services/env"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

interface Seat {
  id: number;
  seatNumber: string;
  status: "AVAILABLE" | "BOOKED";
}

interface Trip {
  id: number
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  price: number
  busType: string
  availableSeats: number
  tripId: string
  busId?: number
  duration?: string
  bus?: {
    id: number
    busNumber: string
    busType: string
  }
}

interface BookingFormData {
  passengerName: string
  phoneNumber: string
  email: string
  selectedSeat: Seat | null
  trip: Trip
  agreeToTerms: boolean
}

export default function BookingPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripDetails, setTripDetails] = useState<Trip | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('TRANSFER')
  const [passengerInfo, setPassengerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([])

  // Define seat arrays for upper and lower decks
  const [upperDeckSeats, setUpperDeckSeats] = useState<Seat[]>([]);
  const [lowerDeckSeats, setLowerDeckSeats] = useState<Seat[]>([]);

  // Fetch initial trip and seat data
  useEffect(() => {
    const loadTripDetails = async () => {
      if (!resolvedParams?.id) return;
      
      try {
        setLoading(true);
        const backendUrl = getApiBaseUrl();
        console.log('Loading trip details from:', backendUrl);

        // Fetch trip details directly from backend
        const tripResponse = await fetch(`${backendUrl}/trips/${resolvedParams.id}`);
        if (!tripResponse.ok) {
          throw new Error('Không thể tải thông tin chuyến xe');
        }
        const tripData = await tripResponse.json();
        console.log('Trip data loaded:', tripData);

        // Extract busId from trip data
        const busId = tripData.bus?.id;
        if (!busId) {
          throw new Error('Không tìm thấy thông tin xe');
        }

        // Fetch seats for this specific trip/bus
        const seatsResponse = await fetch(`${backendUrl}/seats/trip/${busId}`);
        if (!seatsResponse.ok) {
          throw new Error('Không thể tải thông tin ghế');
        }
        const seatsData = await seatsResponse.json();
        console.log('Seats data loaded:', seatsData);

        // Filter seats into upper and lower deck based on seat number pattern
        const upper = seatsData.filter((seat: Seat) => /^B\d+/.test(seat.seatNumber));
        const lower = seatsData.filter((seat: Seat) => /^A\d+/.test(seat.seatNumber));
        
        setTripDetails({
          ...tripData,
          busId: busId // Add busId to tripDetails
        });
        setSeats(seatsData);
        setUpperDeckSeats(upper);
        setLowerDeckSeats(lower);

        setError(null);
      } catch (err) {
        console.error("Error loading trip details:", err);
        setError(err instanceof Error ? err.message : "Không thể tải thông tin chuyến xe");
      } finally {
        setLoading(false);
      }
    }

    loadTripDetails();
  }, [resolvedParams?.id]);

  const [activeTab, setActiveTab] = useState("seat")

  // Format price to VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ"
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "HH:mm dd/MM/yyyy", { locale: vi })
    } catch (error) {
      return dateString
    }
  }

  // Update mock trip data to use resolvedParams
  const mockTrip: Trip = {
    id: 1,
    origin: "Ho Chi Minh",
    destination: "Ha Noi",
    departureTime: "2024-03-20T08:00:00",
    arrivalTime: "2024-03-21T08:00:00",
    price: 500000,
    busType: "Sleeper",
    availableSeats: 30,
    tripId: "TRIP001",
    busId: 1,
    duration: "24h"
  }

  // Use real data if available, otherwise use mock data
  const displayTripData = tripDetails || mockTrip

  const handleSeatSelect = async (seat: Seat) => {
    try {
      // Check if seat is already booked locally
      if (seat.status === 'BOOKED') {
        throw new Error('Ghế này đã được đặt');
      }

      setLoading(true);
      setError(null);

      // Check seat availability in real-time
      const backendUrl = getApiBaseUrl();
      const response = await fetch(`${backendUrl}/seats/check/${seat.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Không thể kiểm tra trạng thái ghế');
      }

      // If seat is no longer available
      if (!data.available || data.status === 'BOOKED') {
        // Update local seat status with correct type
        const updatedSeats = seats.map(s => 
          s.id === seat.id ? { ...s, status: 'BOOKED' as const } : s
        );
        setSeats(updatedSeats);
        
        // Update deck arrays with correct types
        const upper = updatedSeats.filter(s => /^B\d+/.test(s.seatNumber));
        const lower = updatedSeats.filter(s => /^A\d+/.test(s.seatNumber));
        setUpperDeckSeats(upper);
        setLowerDeckSeats(lower);
        
        throw new Error('Ghế này vừa được đặt bởi người khác');
      }

      // Seat is available, proceed with selection
      setSelectedSeat(seat);
      setFormData(prev => ({
        ...prev,
        selectedSeat: seat
      }));
    } catch (error) {
      console.error('Seat selection error:', error);
      setError(error instanceof Error ? error.message : 'Không thể chọn ghế');
      setSelectedSeat(null);
    } finally {
      setLoading(false);
    }
  };

  const renderSeat = (seat: Seat) => {
    const isSelected = selectedSeat?.id === seat.id;
    const isBooked = seat.status === "BOOKED";
    const isLoading = loading && selectedSeat?.id === seat.id;

    return (
      <button
        key={seat.id}
        onClick={() => handleSeatSelect(seat)}
        disabled={isBooked || loading}
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
          ${!isSelected && !isBooked ? 'bg-green-100 hover:bg-green-200' : ''}
          ${isBooked ? 'bg-red-100 cursor-not-allowed' : ''}
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          transition-colors duration-200
        `}
      >
        {seat.seatNumber}
      </button>
    );
  };

  const renderSeats = (seatList: Seat[]) => {
    return (
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 rounded-lg">
        {seatList.map((seat) => renderSeat(seat))}
      </div>
    );
  };

  const SeatMap = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Tầng trên</h3>
        {renderSeats(upperDeckSeats)}
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Tầng dưới</h3>
        {renderSeats(lowerDeckSeats)}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded"></div>
          <span>Đã bán</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Đang chọn</span>
        </div>
      </div>
    </div>
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPassengerInfo((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Update formData with passenger information
    setFormData(prev => ({
      ...prev,
      passengerName: name === 'name' ? value : prev.passengerName,
      phoneNumber: name === 'phone' ? value : prev.phoneNumber,
      email: name === 'email' ? value : prev.email
    }))
  }

  const [formData, setFormData] = useState<BookingFormData>({
    passengerName: "",
    phoneNumber: "",
    email: "",
    selectedSeat: null,
    trip: displayTripData,
    agreeToTerms: false
  })

  const handlePayment = async () => {
    try {
      console.log('=== Validating booking info ===');
      
      // Validate required fields
      if (!selectedSeat) {
        throw new Error('Vui lòng chọn ghế');
      }
      if (!passengerInfo.name || !passengerInfo.phone || !passengerInfo.email) {
        throw new Error('Vui lòng điền đầy đủ thông tin hành khách');
      }
      if (!agreeToTerms) {
        throw new Error('Vui lòng đồng ý với điều khoản và điều kiện');
      }

      // Store booking info in session storage
      const pendingBooking = {
        tripId: displayTripData.id,
        seatId: selectedSeat.id,
        passengerName: passengerInfo.name,
        passengerPhone: passengerInfo.phone,
        passengerEmail: passengerInfo.email,
        amount: displayTripData.price,
        tripInfo: {
          origin: displayTripData.origin,
          destination: displayTripData.destination,
          departureTime: displayTripData.departureTime,
          busType: displayTripData.busType,
          seatNumber: selectedSeat.seatNumber
        }
      };
      console.log('Storing pending booking:', pendingBooking);
      sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

      // Redirect to payment page
      console.log('=== Redirecting to payment page ===');
      router.push(`/dat-ve/${displayTripData.id}/thanh-toan`);

    } catch (error) {
      console.error('=== Validation failed ===');
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  // Update agreeToTerms handler
  const handleAgreeToTerms = (checked: boolean) => {
    setAgreeToTerms(checked);
    setFormData(prev => ({
      ...prev,
      agreeToTerms: checked
    }));
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-futa-orange py-4 text-white">
          <div className="container">
            <h1 className="text-2xl font-bold text-center">
              {displayTripData.origin} - {displayTripData.destination}
            </h1>
            <p className="text-center text-sm">{formatDate(displayTripData.departureTime)}</p>
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

          <Tabs defaultValue="seat" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="seat">Chọn ghế</TabsTrigger>
              <TabsTrigger value="info">Thông tin xe</TabsTrigger>
            </TabsList>

            <TabsContent value="seat" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card className="p-4">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h2 className="font-medium">Chọn ghế</h2>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-300 rounded"></div>
                          <span className="text-sm">Đã bán</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-100 rounded"></div>
                          <span className="text-sm">Còn trống</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-sm">Đang chọn</span>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-futa-orange"></div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <SeatMap />
                      </div>
                    )}

                    <div className="mt-6">
                      <h3 className="font-medium mb-4">Thông tin khách hàng</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Họ và tên *</Label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="Nhập họ và tên"
                              value={passengerInfo.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Số điện thoại *</Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              placeholder="Nhập số điện thoại"
                              value={passengerInfo.phone}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Nhập email"
                            value={passengerInfo.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="terms"
                            checked={agreeToTerms}
                            onCheckedChange={(checked) => handleAgreeToTerms(checked as boolean)}
                          />
                          <label htmlFor="terms" className="text-sm">
                            Chấp nhận điều khoản đặt vé & chính sách bảo mật thông tin của FUTA Bus Lines
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card className="p-4">
                    <h2 className="font-medium mb-4">Thông tin lượt đi</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tuyến xe</span>
                        <span className="font-medium">
                          {displayTripData.origin} - {displayTripData.destination}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thời gian xuất bến</span>
                        <span className="font-medium">{formatDate(displayTripData.departureTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số lượng ghế</span>
                        <span className="font-medium">1 Ghế</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số ghế</span>
                        <span className="font-medium">{selectedSeat?.seatNumber || "Chưa chọn"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Điểm trả khách</span>
                        <span className="font-medium">Chưa chọn</span>
                      </div>
                    </div>

                    <div className="border-t mt-4 pt-4">
                      <h3 className="font-medium mb-2 flex items-center">
                        Chi tiết giá <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giá vé lượt đi</span>
                          <span className="font-medium text-futa-orange">{formatPrice(displayTripData.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phí thanh toán</span>
                          <span className="font-medium">0đ</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Tổng tiền</span>
                          <span className="text-futa-orange">{formatPrice(displayTripData.price)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full mt-4 bg-futa-orange hover:bg-futa-orange/90"
                    >
                      {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
                    </Button>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info">
              <Card className="p-4">
                <h2 className="font-medium mb-4">Thông tin xe</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Loại xe</h3>
                    <p>{displayTripData.busType}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Tiện ích</h3>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Wifi miễn phí</li>
                      <li>Nước uống miễn phí</li>
                      <li>Khăn lạnh</li>
                      <li>Tivi</li>
                      <li>Điều hòa</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium">Chính sách</h3>
                    <ul className="list-disc pl-5 mt-2">
                      <li>Có mặt tại bến xuất phát trước ít nhất 30 phút giờ xe khởi hành</li>
                      <li>Mang theo thông báo đã thanh toán vé thành công có chứa mã vé</li>
                      <li>Không mang thú cưng, thực phẩm có mùi lên xe</li>
                      <li>Không hút thuốc, uống rượu bia trên xe</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

