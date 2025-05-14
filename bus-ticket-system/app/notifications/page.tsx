'use client';

import { useState, useEffect } from 'react';
import { Edit, Eye, Plus, Search, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { NotificationForm } from '@/components/notifications/notification-form';
import { NotificationDetails } from '@/components/notifications/notification-details';
import { getBaseUrl } from '@/lib/auth';

interface Notification {
  id: string;
  title: string;
  content: string;
  target: string;
  createdAt: string;
  read?: boolean; // Thêm thuộc tính read nếu backend trả về
}

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getBaseUrl();
        console.log('Fetching from:', `${baseUrl}/notifications`); // Debug URL
        const userId = localStorage.getItem('userId'); // Lấy userId từ localStorage

        const response = await fetch('https://bookingticketwebsite.onrender.com/api/notifications', {
          method: 'GET',
          credentials: 'include', // Gửi cookie nếu có
          headers: userId ? { 'X-User-Id': userId } : {}, // Gửi userId qua header (tùy chọn)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Lỗi khi lấy danh sách thông báo: ${response.status} - ${response.statusText}`);
        }

        const data: Notification[] = await response.json();
        setNotifications(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
          // Nếu không có session, thử lấy thông báo công khai hoặc yêu cầu đăng nhập lại
          if (error.message.includes('Không tìm thấy phiên đăng nhập')) {
            setError('Vui lòng đăng nhập lại để xem thông báo.');
          }
        } else {
          setError('Đã xảy ra lỗi không xác định');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi khi xóa thông báo: ${response.status} - ${response.statusText}`);
      }

      setNotifications(notifications.filter((notification) => notification.id !== notificationId));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Đã xảy ra lỗi không xác định');
      }
    }
  };

  const handleCreateNotification = (newNotification: Notification) => {
    setNotifications([...notifications, newNotification]);
    setIsAddDialogOpen(false);
  };

  const handleUpdateNotification = (updatedNotification: Notification) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === updatedNotification.id ? updatedNotification : notification
      )
    );
    setIsEditDialogOpen(false);
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTarget = !targetFilter || notification.target === targetFilter;

    return matchesSearch && matchesTarget;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
  };

  const getTargetLabel = (target: string) => {
    switch (target.toLowerCase()) {
      case 'staff':
        return 'Nhân viên';
      case 'customer':
        return 'Khách hàng';
      case 'all':
        return 'Tất cả';
      default:
        return target;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý thông báo</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo thông báo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tạo thông báo mới</DialogTitle>
              <DialogDescription>Tạo thông báo mới để gửi đến nhân viên hoặc khách hàng</DialogDescription>
            </DialogHeader>
            <NotificationForm onSubmit={handleCreateNotification} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tiêu đề, nội dung..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Đối tượng nhận</Label>
              <Select value={targetFilter} onValueChange={setTargetFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_targets">Tất cả</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="all">Tất cả đối tượng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-500">Lỗi: {error}</p>}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Nội dung rút gọn</TableHead>
                <TableHead>Đối tượng nhận</TableHead>
                <TableHead>Thời gian tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell>
                    {notification.content.length > 50
                      ? `${notification.content.substring(0, 50)}...`
                      : notification.content}
                  </TableCell>
                  <TableCell>{getTargetLabel(notification.target)}</TableCell>
                  <TableCell>{formatDate(notification.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleView(notification)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Xem</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(notification)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Sửa</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(notification.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Xóa</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết thông báo</DialogTitle>
          </DialogHeader>
          {selectedNotification && <NotificationDetails notification={selectedNotification} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông báo</DialogTitle>
            <DialogDescription>Cập nhật thông tin thông báo</DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <NotificationForm
              notification={selectedNotification}
              onSubmit={handleUpdateNotification}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}