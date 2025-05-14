'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface TripFormProps {
  onSubmit: (trip: any) => void;
  trip?: Trip | null;
}

export function TripForm({ onSubmit, trip = null }: TripFormProps) {
  const [origin, setOrigin] = useState(trip?.origin || '');
  const [destination, setDestination] = useState(trip?.destination || '');
  const [departureTime, setDepartureTime] = useState(trip?.departureTime || '');
  const [bus, setBus] = useState(trip?.bus || { id: 0 });
  const [price, setPrice] = useState(trip?.price || 0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      id: trip?.id, // Thêm id vào payload
      origin,
      destination,
      departureTime,
      bus,
      price,
    };

    try {
      onSubmit(payload); // Gửi dữ liệu về TripsPage
    } catch (error: any) {
      setError(error.message || 'Đã xảy ra lỗi không xác định');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">Lỗi: {error}</p>}
      <div className="space-y-2">
        <Label htmlFor="origin">Bến đi</Label>
        <Input
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Nhập bến đi..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="destination">Bến đến</Label>
        <Input
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Nhập bến đến..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="departureTime">Thời gian khởi hành</Label>
        <Input
          id="departureTime"
          type="datetime-local"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Giá vé</Label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Nhập giá vé..."
          required
        />
      </div>
      <Button type="submit">{trip ? 'Cập nhật' : 'Lưu'}</Button>
    </form>
  );
}