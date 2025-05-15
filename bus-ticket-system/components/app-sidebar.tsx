"use client"

import { BarChart3, Bell, Bus, Home, LogOut, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/",
    },
    {
      title: "Quản lý chuyến đi",
      icon: Bus,
      href: "/trips",
    },
    {
      title: "Quản lý nhân viên",
      icon: Users,
      href: "/staff",
    },
    {
      title: "Quản lý thông báo",
      icon: Bell,
      href: "/notifications",
    },
    {
      title: "Báo cáo kinh doanh",
      icon: BarChart3,
      href: "/reports",
    },
  ]

  const handleLogout = () => {
    window.location.href = "https://booking-ticket-website-silk.vercel.app/dang-nhap"
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <Bus className="h-6 w-6" />
          <h1 className="text-xl font-bold">BusBooking</h1>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="Avatar" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Đăng xuất</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}