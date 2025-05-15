"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Globe, Menu, Phone, X, User, CreditCard, History, MapPin, Lock, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { isLoggedIn, getUserName, logout } from "@/lib/auth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import axios from "axios"

const navigation = [
  { name: "TRANG CHỦ", href: "/" },
  { name: "LỊCH TRÌNH", href: "/lich-trinh" },
  { name: "TRA CỨU VÉ", href: "/tra-cuu-ve" },
  { name: "TIN TỨC", href: "/tin-tuc" },
  { name: "HÓA ĐƠN", href: "/hoa-don" },
  { name: "LIÊN HỆ", href: "/lien-he" },
  { name: "VỀ CHÚNG TÔI", href: "/ve-chung-toi" },
  { name: "HƯỚNG DẪN ĐẶT VÉ", href: "/huong-dan-dat-ve" },
]

const userMenuItems = [
  { name: "FUTAPay", href: "/tai-khoan/futa-pay", icon: CreditCard, color: "bg-green-600" },
  { name: "Thông tin tài khoản", href: "/tai-khoan/thong-tin-chung", icon: User, color: "bg-yellow-500" },
  { name: "Lịch sử mua vé", href: "/tai-khoan/lich-su-mua-ve", icon: History, color: "bg-blue-400" },
  { name: "Địa chỉ của bạn", href: "/tai-khoan/dia-chi", icon: MapPin, color: "bg-pink-500" },
  { name: "Đặt lại mật khẩu", href: "/tai-khoan/dat-lai-mat-khau", icon: Lock, color: "bg-orange-500" },
  { name: "Đăng xuất", href: "#", icon: LogOut, color: "bg-red-500" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("TRANG CHỦ")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [userName, setUserName] = useState("Người dùng")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<
    {
      id: string
      title: string
      content: string
      time: string
      type: "booking" | "payment" | "system" | "support"
      read: boolean
    }[]
  >([])

  // Kiểm tra trạng thái đăng nhập từ session
  const checkLoginStatus = useCallback(() => {
    if (typeof window !== "undefined") {
      const loggedIn = isLoggedIn()
      const name = getUserName()

      setUserLoggedIn(loggedIn)
      if (name) {
        setUserName(name)
      }
    }
  }, [])

  // Check if user is logged in and get user name
  useEffect(() => {
    checkLoginStatus()

    const handleStorageChange = () => {
      checkLoginStatus()
    }

    window.addEventListener("storage", handleStorageChange)

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
    }

    const userCookie = getCookie("userName")
    if (userCookie && !userLoggedIn) {
      setUserName(userCookie)
      setUserLoggedIn(true)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [pathname, checkLoginStatus, userLoggedIn])

  // Set active tab based on current path
  useEffect(() => {
    const currentTab = navigation.find((item) => pathname === item.href)
    if (currentTab) {
      setActiveTab(currentTab.name)
    }
  }, [pathname])

  // Thêm cập nhật cứ mỗi 2 giây để đảm bảo đồng bộ
  useEffect(() => {
    const interval = setInterval(() => {
      checkLoginStatus()
    }, 2000)

    return () => clearInterval(interval)
  }, [checkLoginStatus])

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get<
          {
            id: string;
            title: string;
            content: string;
            target: string;
            createdAt: string;
            read: boolean;
          }[]
        >("https://bookingticketwebsite.onrender.com/api/notifications", {
          withCredentials: true,
        });

        // Kiểm tra dữ liệu trả về
        if (!Array.isArray(response.data)) {
          throw new Error("Dữ liệu trả về từ API không phải là mảng");
        }

        // Lọc chỉ lấy thông báo có target là "customer" && all
        const customerNotifications = response.data.filter(
          (item) => item.target.toLowerCase() === "customer" || item.target.toLowerCase() === "all"
        );

        // Ánh xạ dữ liệu từ API sang định dạng notifications của Header
        const fetchedNotifications = customerNotifications.map((item) => {
          // Ánh xạ target sang type (chỉ cần type "payment" vì đã lọc customer)
          const type = "payment" as const;

          return {
            id: item.id,
            title: item.title,
            content: item.content,
            time: new Date(item.createdAt).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            type,
            read: item.read || false,
          };
        });

        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (userLoggedIn) {
      fetchNotifications();
    }
  }, [userLoggedIn])

  const handleLogout = async () => {
    try {
      const result = await logout()
      setUserLoggedIn(false)
      setUserName("Người dùng")
      router.push("/dang-nhap")
    } catch (error) {
      console.error("Logout error:", error)
      setUserLoggedIn(false)
      setUserName("Người dùng")
      router.push("/dang-nhap")
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const typeMap = {
    booking: { label: "Đặt vé", variant: "default" },
    payment: { label: "Thanh toán", variant: "secondary" },
    system: { label: "Hệ thống", variant: "destructive" },
    support: { label: "Hỗ trợ", variant: "outline" },
  }

  const NotificationItem = ({
    notification,
    onMarkAsRead,
  }: {
    notification: {
      id: string
      title: string
      content: string
      time: string
      type: "booking" | "payment" | "system" | "support"
      read: boolean
    }
    onMarkAsRead: (id: string) => void
  }) => {
    const [expanded, setExpanded] = useState(false)

    return (
      <div className="p-4 hover:bg-muted/50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{notification.title}</p>
            </div>
            <p className={cn("text-xs text-muted-foreground", expanded ? "" : "line-clamp-2")}>
              {notification.content}
            </p>
            <p className="text-xs text-muted-foreground">{notification.time}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-gradient-to-r from-futa-orange to-orange-500">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Mở menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <div className="bg-futa-orange p-4 flex justify-between items-center">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <div className="relative h-10 w-32">
                      <Image
                        src="/placeholder.svg?height=40&width=128"
                        alt="FUTA Bus Lines"
                        width={128}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsMenuOpen(false)}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <nav className="flex flex-col p-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="py-3 text-lg font-medium border-b border-gray-200"
                      onClick={() => {
                        setActiveTab(item.name)
                        setIsMenuOpen(false)
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {userLoggedIn && (
                    <button
                      className="py-3 text-lg font-medium border-b border-gray-200 text-left text-red-500"
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                    >
                      ĐĂNG XUẤT
                    </button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5" />
              <span className="hidden md:inline">VI</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Phone className="h-5 w-5" />
              <span className="hidden md:inline">Tải ứng dụng</span>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="sr-only">FUTA Bus Lines</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {userLoggedIn ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-white">
                    <Bell className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 font-medium border-b">Thông báo</div>
                  {notifications.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex h-32 items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <Bell className="h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-muted-foreground">Không có thông báo nào</p>
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ) : null}

            {userLoggedIn ? (
              <div className="flex items-center gap-2" ref={dropdownRef}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span>{userName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-0">
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem key={item.name} asChild className="p-0">
                        {item.name === "Đăng xuất" ? (
                          <button onClick={handleLogout} className="w-full flex items-center px-2 py-2.5">
                            <div className={`${item.color} rounded-full p-2 mr-3`}>
                              <item.icon className="h-5 w-5 text-white" />
                            </div>
                            <span>{item.name}</span>
                          </button>
                        ) : (
                          <Link href={item.href} className="w-full flex items-center px-2 py-2.5">
                            <div className={`${item.color} rounded-full p-2 mr-3`}>
                              <item.icon className="h-5 w-5 text-white" />
                            </div>
                            <span>{item.name}</span>
                          </Link>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/dang-nhap">
                <Button variant="ghost" className="text-white">
                  <span className="hidden sm:inline">Đăng nhập/</span>Đăng ký
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="bg-futa-orange border-t border-white/20 hidden md:block">
        <div className="container overflow-x-auto">
          <ul className="flex justify-center whitespace-nowrap">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-block px-4 py-3 text-sm font-medium text-white hover:bg-white/10",
                    activeTab === item.name && "border-b-2 border-white",
                  )}
                  onClick={() => setActiveTab(item.name)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}