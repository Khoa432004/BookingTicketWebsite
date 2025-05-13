"use client"

import { useEffect, useState } from "react"
import { Eye, Search, Filter, Lock, Unlock, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getBaseUrl } from "@/lib/auth"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  gender: "male" | "female" | "other"
  status: "active" | "inactive" | "blocked"
  registeredDate: string
  lastActivity: string
  totalBookings: number
}

const statusMap = {
  active: { label: "Hoạt động", variant: "success" },
  inactive: { label: "Không hoạt động", variant: "warning" },
  blocked: { label: "Đã khóa", variant: "destructive" },
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const fetchCustomers = () => {
    let url = `${getBaseUrl()}/api/staff/customers`

    if (searchQuery.trim()) {
      url = `${getBaseUrl()}/api/staff/customers/search?keyword=${encodeURIComponent(searchQuery)}`
    } else if (statusFilter !== "all") {
      url = `${getBaseUrl()}/api/staff/customers/search?keyword=${encodeURIComponent(statusFilter)}`
    }

    fetch(url)
      .then(res => res.json())
      .then((data) => {
        const mapped: Customer[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          gender: item.gender?.toLowerCase() || "other",
          status: item.status?.toLowerCase() || "inactive",
          registeredDate: "-",
          lastActivity: "-",
          totalBookings: 0
        }))
        setCustomers(mapped)
      })
      .catch((err) => console.error("Error fetching customers:", err))
  }

  useEffect(() => {
    fetchCustomers()
  }, [searchQuery, statusFilter])

  const handleToggleStatus = (customer: Customer) => {
    fetch(`${getBaseUrl()}/api/staff/customers/${customer.id}/toggle-status`, {
      method: "PUT",
    })
      .then((res) => {
        if (res.ok) {
          toast({
            title: "Cập nhật thành công",
            description: `Tài khoản ${customer.name} đã được thay đổi trạng thái.`,
          })
          fetchCustomers()
        } else {
          throw new Error("Cập nhật thất bại")
        }
      })
      .catch(() =>
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật trạng thái tài khoản",
        })
      )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
        <p className="text-muted-foreground">Xem và quản lý thông tin khách hàng</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-[300px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="blocked">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/placeholder.svg?height=32&width=32&text=${customer.name.charAt(0)}`} alt={customer.name} />
                            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.gender === "male" ? "Nam" : customer.gender === "female" ? "Nữ" : "Khác"}</TableCell>
                      <TableCell>
                        <Badge variant={(statusMap[customer.status]?.variant ?? "secondary") as "success" | "warning" | "destructive" | "default" | "secondary" | "outline"}>
                          {statusMap[customer.status]?.label ?? customer.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Mở menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(customer)}>
                              {customer.status === "blocked" ? (
                                <>
                                  <Unlock className="mr-2 h-4 w-4" />
                                  <span>Mở khóa tài khoản</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="mr-2 h-4 w-4" />
                                  <span>Khóa tài khoản</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Không tìm thấy khách hàng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết khách hàng</DialogTitle>
            <DialogDescription>Thông tin chi tiết về khách hàng và lịch sử giao dịch</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/placeholder.svg?height=64&width=64&text=${selectedCustomer.name.charAt(0)}`} alt={selectedCustomer.name} />
                  <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.id}</p>
                  <Badge variant={statusMap[selectedCustomer.status].variant as any} className="mt-1">
                    {statusMap[selectedCustomer.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-2 font-medium">Thông tin liên hệ</h3>
                  <p className="text-sm">Email: {selectedCustomer.email}</p>
                  <p className="text-sm">SĐT: {selectedCustomer.phone}</p>
                  <p className="text-sm">Giới tính: {selectedCustomer.gender === "male" ? "Nam" : selectedCustomer.gender === "female" ? "Nữ" : "Khác"}</p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Thông tin tài khoản</h3>
                  <p className="text-sm">Ngày đăng ký: {selectedCustomer.registeredDate}</p>
                  <p className="text-sm">Hoạt động gần nhất: {selectedCustomer.lastActivity}</p>
                  <p className="text-sm">Tổng số vé đã đặt: {selectedCustomer.totalBookings}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}