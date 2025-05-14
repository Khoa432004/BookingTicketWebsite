'use client'

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import axios from "axios"

type Notification = {
  id: string
  title: string
  content: string
  time: string
  read: boolean
  fullContent?: string
  target: string
  createdAt: Date
}

type ApiNotification = {
  id: string;
  title: string;
  content: string;
  target: string;
  createdAt: string;
  read: boolean;
};

// Hàm cắt ngắn nội dung
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [timeFilter, setTimeFilter] = useState("all")
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Gọi API để lấy danh sách thông báo
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiNotification[]>("https://bookingticketwebsite.onrender.com/notifications", {
          withCredentials: true,
        });

        // Kiểm tra dữ liệu trả về
        if (!Array.isArray(response.data)) {
          throw new Error("Dữ liệu trả về từ API không phải là mảng");
        }

        // Chuyển đổi dữ liệu từ API thành định dạng Notification
        const fetchedNotifications: Notification[] = response.data.map((item: ApiNotification) => {
          const createdAtDate = new Date(item.createdAt);
          return {
            id: item.id,
            title: item.title,
            content: item.content,
            time: createdAtDate.toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            read: item.read || false,
            fullContent: item.content,
            target: item.target.toLowerCase(),
            createdAt: createdAtDate,
          };
        });

        setNotifications(fetchedNotifications);
      } catch (err: any) {
        if (err.code === "ERR_NETWORK") {
          setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra xem backend có đang chạy không.");
        } else if (err.response?.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError("Không thể tải thông báo. Vui lòng thử lại sau.");
        }
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const isTargetMatch = notification.target === "staff" || notification.target === "all";
    const isReadMatch = showUnreadOnly ? !notification.read : true;

    const now = new Date();
    let isTimeMatch = true;

    if (timeFilter !== "all") {
      const notificationDate = notification.createdAt;

      if (timeFilter === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        isTimeMatch = notificationDate >= todayStart;
      } else if (timeFilter === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        isTimeMatch = notificationDate >= weekStart;
      } else if (timeFilter === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        isTimeMatch = notificationDate >= monthStart;
      }
    }

    return isTargetMatch && isReadMatch && isTimeMatch;
  });

  const handleReadFull = async (notification: Notification) => {
    setSelectedNotification(notification);

    // Gọi API để đánh dấu thông báo là đã đọc
    try {
      await axios.put(
        `https://bookingticketwebsite.onrender.com/notifications/${notification.id}/read`,
        {},
        { withCredentials: true }
      );

      // Cập nhật trạng thái read trong state
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 md:items-center md:justify-center"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-auto bg-background p-4 shadow-lg md:h-auto md:max-h-[80vh] md:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-semibold">Thông báo</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Đóng</span>
          </Button>
        </div>

        <div className="my-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="unread-only"
              checked={showUnreadOnly}
              onCheckedChange={(checked) => setShowUnreadOnly(!!checked)}
            />
            <Label htmlFor="unread-only">Chỉ hiển thị chưa đọc</Label>
          </div>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Lọc theo thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {loading ? (
            <p className="py-4 text-center text-muted-foreground">Đang tải thông báo...</p>
          ) : error ? (
            <p className="py-4 text-center text-destructive">{error}</p>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors hover:bg-muted/50",
                  !notification.read && "border-l-4 border-l-primary",
                )}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {truncateText(notification.content, 40)}
                </p>
                <div className="mt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleReadFull(notification)}>
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">Không có thông báo nào</p>
          )}
        </div>

        {/* Dialog for full notification content */}
        <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedNotification?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto pr-1 flex-grow">
              <p className="break-words">{selectedNotification?.fullContent}</p>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{selectedNotification?.time}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end pt-2 border-t">
              <DialogClose asChild>
                <Button>Đóng</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}