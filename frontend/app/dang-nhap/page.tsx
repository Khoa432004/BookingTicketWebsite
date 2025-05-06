"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import dynamic from "next/dynamic"
import { login } from "@/lib/auth"

const LoginPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loginData, setLoginData] = useState({
    password: "",
    name: "",
  })
  const [registerData, setRegisterData] = useState({
    phone: "",
    name: "",
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
  
    try {
      const result = await login(loginData.name, loginData.password);
      
      if (result.success) {
        setTimeout(() => {
          switch(result.userType) {
            case "OWNER":
              window.location.href = "http://localhost:3001";
              break;
            case "STAFF":
              window.location.href = "http://localhost:3002";
              break;
            default:
              router.push("/");
          }
        }, 300);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Register with:", registerData)
    router.push("/dang-ky/xac-thuc")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-orange-50">
        <div className="container py-12">
          <div className="max-w-md mx-auto">
            <Card className="border-none shadow-lg">
              <CardContent className="p-0">
                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="py-4">
                      Đăng nhập tài khoản
                    </TabsTrigger>
                    <TabsTrigger value="register" className="py-4">
                      Tạo tài khoản
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="p-6">
                    <div className="flex justify-center mb-6">
                      <div className="relative w-full max-w-[300px] h-[120px]">
                        <Image
                          src="/placeholder.svg?height=120&width=300"
                          alt="FUTA Bus Lines"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Tên người dùng</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Nhập tên người dùng"
                          value={loginData.name}
                          onChange={handleLoginChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Nhập mật khẩu"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                      <Button 
                        type="submit" 
                        className="w-full bg-futa-orange hover:bg-futa-orange/90"
                        disabled={isLoading}
                      >
                        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                      </Button>

                      <div className="text-center">
                        <Link href="/quen-mat-khau" className="text-sm text-futa-orange hover:underline">
                          Quên mật khẩu?
                        </Link>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="p-6">
                    <div className="flex justify-center mb-6">
                      <div className="relative w-full max-w-[300px] h-[120px]">
                        <Image
                          src="/images/login.svg"
                          alt="FUTA Bus Lines"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Tên người dùng</Label>
                        <Input
                          id="register-name"
                          name="name"
                          type="text"
                          placeholder="Nhập tên người dùng"
                          value={registerData.name}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Số điện thoại</Label>
                        <Input
                          id="register-phone"
                          name="phone"
                          type="tel"
                          placeholder="Nhập số điện thoại"
                          value={registerData.phone}
                          onChange={handleRegisterChange}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full bg-futa-orange hover:bg-futa-orange/90">
                        Tiếp tục
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Vô hiệu hóa SSR cho trang này
export default dynamic(() => Promise.resolve(LoginPage), { ssr: false })