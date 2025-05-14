'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface TripFormProps {
  trip?: any;
  onSubmit: () => void;
}

interface Bus {
  id: number;
  busNumber: string;
  busType: string;
  totalSeats: number;
}

export function TripForm({ trip, onSubmit }: TripFormProps) {
  const isEditing = !!trip;

  const [formData, setFormData] = useState({
    tripId: trip?.tripId || '',
    busId: trip?.bus?.id?.toString() || '',
    busType: trip?.busType || '',
    seats: trip?.availableSeats?.toString() || '',
    departure: trip?.origin || '',
    destination: trip?.destination || '',
    date: trip ? new Date(trip.departureTime) : new Date(),
    time: trip ? format(new Date(trip.departureTime), 'HH:mm') : '08:00',
    price: trip?.price?.toString() || '',
    arrivalTime: trip ? new Date(trip.arrivalTime) : new Date(),
  });

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch('https://bookingticketwebsite.onrender.com/api/trips/buses', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }
        const data: Bus[] = await response.json();
        setBuses(data);
      } catch (error: any) {
        console.error('Error fetching buses:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách xe bus',
          variant: 'destructive',
        });
      }
    };

    fetchBuses();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.tripId ||
      !formData.busId ||
      !formData.busType ||
      !formData.seats ||
      !formData.departure ||
      !formData.destination ||
      !formData.price
    ) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const departureDateTime = new Date(formData.date);
      departureDateTime.setHours(hours, minutes, 0, 0);

      const arrivalDateTime = new Date(departureDateTime);
      arrivalDateTime.setHours(arrivalDateTime.getHours() + 5);

      const tripData = {
        tripId: formData.tripId,
        origin: formData.departure,
        destination: formData.destination,
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        busType: formData.busType,
        price: parseFloat(formData.price),
        availableSeats: parseInt(formData.seats, 10),
      };

      if (isEditing) {
        const response = await fetch(`https://bookingticketwebsite.onrender.com/api/trips/${trip.id}?busId=${formData.busId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripData),
          credentials: 'include',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Lỗi: ${response.status} - ${response.statusText}`);
        }
      } else {
        const response = await fetch(`https://bookingticketwebsite.onrender.com/api/trips?busId=${formData.busId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripData),
          credentials: 'include',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Lỗi: ${response.status} - ${response.statusText}`);
        }
      }

      toast({
        title: isEditing ? 'Cập nhật thành công' : 'Thêm mới thành công',
        description: `Chuyến xe ${formData.tripId} đã được ${isEditing ? 'cập nhật' : 'thêm'} vào hệ thống`,
      });

      onSubmit();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi lưu chuyến xe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const busTypes = ['Limousine', 'Giường nằm', 'Ghế ngồi'];
  const locations = ['Hà Nội', 'Hải Phòng', 'Nam Định', 'Thanh Hóa', 'Ninh Bình', 'Quảng Ninh'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tripId">Mã chuyến xe</Label>
            <Input
              id="tripId"
              value={formData.tripId}
              onChange={(e) => handleChange('tripId', e.target.value)}
              disabled={isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="busId">Mã xe</Label>
            <Select value={formData.busId} onValueChange={(value) => handleChange('busId', value)}>
              <SelectTrigger id="busId">
                <SelectValue placeholder="Chọn xe" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id.toString()}>
                    {bus.busNumber} ({bus.busType}, {bus.totalSeats} chỗ)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="busType">Loại xe</Label>
            <Select value={formData.busType} onValueChange={(value) => handleChange('busType', value)}>
              <SelectTrigger id="busType">
                <SelectValue placeholder="Chọn loại xe" />
              </SelectTrigger>
              <SelectContent>
                {busTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats">Số chỗ</Label>
            <Input
              id="seats"
              type="number"
              value={formData.seats}
              onChange={(e) => handleChange('seats', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departure">Bến đi</Label>
            <Select value={formData.departure} onValueChange={(value) => handleChange('departure', value)}>
              <SelectTrigger id="departure">
                <SelectValue placeholder="Chọn bến đi" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Bến đến</Label>
            <Select value={formData.destination} onValueChange={(value) => handleChange('destination', value)}>
              <SelectTrigger id="destination">
                <SelectValue placeholder="Chọn bến đến" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ngày khởi hành</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, 'dd/MM/yyyy', { locale: vi }) : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => handleChange('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Giờ khởi hành</Label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                className="pl-8"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Giá vé (VNĐ)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogFooter>
    </form>
  );
}