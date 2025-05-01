"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Edit, Plus, Search, Trash } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { TripForm } from "@/components/trips/trip-form"
import { toast } from "@/hooks/use-toast"

// Định nghĩa interface cho Trip dựa trên dữ liệu từ backend (TripDTO)
interface Trip {
  id: number;
  tripId: string;
  origin: string;
  destination: string;
  departureTime: string;
  bus: { id: number; busNumber: string; busType: string; totalSeats: number };
  price: number;
  availableSeats: number;
}

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [filterDeparture, setFilterDeparture] = useState("")
  const [filterDestination, setFilterDestination] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)

  // Lấy danh sách chuyến đi từ backend
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      try {
        const response = await axios.get<Trip[]>("/api/trips") // Sử dụng proxy
        setTrips(response.data)
        if (response.data.length === 0) {
          toast({
            title: "Thông báo",
            description: "Không có chuyến đi nào trong hệ thống",
            variant: "default",
          })
        }
      } catch (error: any) {
        console.error("Error fetching trips:", error)
        toast({
          title: "Lỗi",
          description: error.response?.status === 404
            ? "Không tìm thấy API /api/trips. Vui lòng kiểm tra backend và cấu hình proxy."
            : error.response?.data?.message || "Không thể tải danh sách chuyến đi",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  
    fetchTrips()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "HH:mm - dd/MM/yyyy", { locale: vi })
  }

  const handleEdit = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (tripId: number) => {
    try {
      await axios.delete(`/api/${tripId}`)
      setTrips(trips.filter((trip) => trip.id !== tripId))
      toast({
        title: "Xóa thành công",
        description: `Chuyến xe ${tripId} đã được xóa`,
      })
    } catch (error: any) {
      console.error("Error deleting trip:", error)
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể xóa chuyến xe",
        variant: "destructive",
      })
    }
  }

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.tripId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${trip.origin} - ${trip.destination}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDate = !filterDate || new Date(trip.departureTime).toDateString() === filterDate.toDateString()

    const matchesDeparture = !filterDeparture || trip.origin === filterDeparture

    const matchesDestination = !filterDestination || trip.destination === filterDestination

    return matchesSearch && matchesDate && matchesDeparture && matchesDestination
  })

  // Lấy danh sách các địa điểm khởi hành và đích đến duy nhất
  const departureLocations = Array.from(new Set(trips.map((trip) => trip.origin)))
  const destinationLocations = Array.from(new Set(trips.map((trip) => trip.destination)))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý chuyến đi</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm chuyến đi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Thêm chuyến đi mới</DialogTitle>
              <DialogDescription>Điền đầy đủ thông tin để tạo chuyến đi mới</DialogDescription>
            </DialogHeader>
            <TripForm onSubmit={() => {
              setIsAddDialogOpen(false)
              // Làm mới danh sách sau khi thêm
              const fetchTrips = async () => {
                try {
                  const response = await axios.get<Trip[]>("/api/trips")
                  setTrips(response.data)
                } catch (error) {
                  console.error("Error fetching trips:", error)
                }
              }
              fetchTrips()
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Mã chuyến, tuyến đường..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ngày khởi hành</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Bến đi</Label>
              <Select value={filterDeparture} onValueChange={(value) => setFilterDeparture(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {departureLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bến đến</Label>
              <Select value={filterDestination} onValueChange={(value) => setFilterDestination(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {destinationLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã chuyến</TableHead>
                  <TableHead>Mã xe - Loại xe - Số chỗ</TableHead>
                  <TableHead>Bến đi - Bến đến</TableHead>
                  <TableHead>Thời gian khởi hành</TableHead>
                  <TableHead>Giá vé</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.tripId}</TableCell>
                    <TableCell>
                      {trip.bus.busNumber} - {trip.bus.busType} - {trip.bus.totalSeats} chỗ
                    </TableCell>
                    <TableCell>
                      {trip.origin} - {trip.destination}
                    </TableCell>
                    <TableCell>{formatDate(trip.departureTime)}</TableCell>
                    <TableCell>{trip.price.toLocaleString()}đ</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(trip)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Sửa</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(trip.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Xóa</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chuyến đi</DialogTitle>
            <DialogDescription>Cập nhật thông tin chuyến đi</DialogDescription>
          </DialogHeader>
          {selectedTrip && <TripForm trip={selectedTrip} onSubmit={() => {
            setIsEditDialogOpen(false)
            // Làm mới danh sách sau khi chỉnh sửa
            const fetchTrips = async () => {
              try {
                const response = await axios.get<Trip[]>("/api/trips")
                setTrips(response.data)
              } catch (error) {
                console.error("Error fetching trips:", error)
              }
            }
            fetchTrips()
          }} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}