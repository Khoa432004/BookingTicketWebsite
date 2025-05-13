'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBaseUrl } from "@/lib/auth";

// Định nghĩa interface cho Notification
interface Notification {
  id: string;
  title: string;
  content: string;
  target: string;
  createdAt: string;
}

interface NotificationFormProps {
  onSubmit: (newNotification: Notification) => void;
  notification?: Notification | null;
}

export function NotificationForm({ onSubmit, notification = null }: NotificationFormProps) {
  const [title, setTitle] = useState(notification?.title || '');
  const [content, setContent] = useState(notification?.content || '');
  const [target, setTarget] = useState(notification?.target || 'all');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title,
      content,
      target,
    };

    try {
      const isEditMode = notification !== null;
      const url = isEditMode
        ? `${getBaseUrl()}/notifications/${notification.id}`
        : `${getBaseUrl()}/notifications`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Gửi cookie để backend nhận session
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Lỗi khi ${isEditMode ? 'cập nhật' : 'tạo'} thông báo: ${response.statusText}`);
      }

      const updatedNotification: Notification = await response.json();
      onSubmit(updatedNotification); // Trả thông báo mới/cập nhật về để cập nhật danh sách
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Đã xảy ra lỗi không xác định');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">Lỗi: {error}</p>}
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Nội dung</Label>
        <Input
          id="content"
          value={content}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập nội dung..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Đối tượng nhận</Label>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn đối tượng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Nhân viên</SelectItem>
            <SelectItem value="customer">Khách hàng</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit">{notification ? "Cập nhật" : "Lưu"}</Button>
    </form>
  );
}