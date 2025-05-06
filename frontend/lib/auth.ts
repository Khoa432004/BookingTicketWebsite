// Hàm utility cho việc quản lý authentication
import getApiBaseUrl from "@/services/env";
import { Environment, getCurrentEnvironment } from "@/services/env";

// For getting base URL without /api path
const getBaseUrl = (): string => {
  const currentEnv = getCurrentEnvironment();
  
  if (currentEnv === Environment.LOCAL) {
    return 'http://localhost:8080';
  } else if (currentEnv === Environment.VERCEL) {
    // Use CORS proxy for Vercel environment until backend CORS is fixed
    return 'https://cors-anywhere.herokuapp.com/https://bookingticketwebsite.onrender.com';
  } else {
    return 'https://bookingticketwebsite.onrender.com';
  }
};

/**
 * Kiểm tra xem người dùng đã đăng nhập hay chưa
 */
export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem("isLoggedIn") === "true";
};

/**
 * Lấy tên người dùng đã đăng nhập
 */
export const getUserName = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem("userName");
};

/**
 * Lấy loại tài khoản người dùng
 */
export const getUserType = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem("userType");
};

/**
 * Lấy ID người dùng đã đăng nhập
 */
export const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Kiểm tra từ cả sessionStorage và cookie
  const fromSession = sessionStorage.getItem("userId");
  
  // Nếu không có trong session, thử lấy từ cookie
  if (!fromSession) {
    return getCookie("userId");
  }
  
  return fromSession;
};

/**
 * Hàm trợ giúp để lấy giá trị cookie
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

/**
 * Hàm trợ giúp để đặt cookie
 */
const setCookie = (name: string, value: string, days: number = 1): void => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + value + expires + "; path=/";
};

/**
 * Lưu thông tin đăng nhập vào session
 */
export const saveLoginInfo = (userName: string, userType: string, userId: string): void => {
  if (typeof window === 'undefined') return;

  // Lưu vào sessionStorage
  sessionStorage.setItem("userName", userName);
  sessionStorage.setItem("userType", userType);
  sessionStorage.setItem("userId", userId);
  sessionStorage.setItem("isLoggedIn", "true");
  
  // Lưu thêm vào cookie (phòng trường hợp backend chưa lưu được cookie)
  setCookie("userId", userId);
  setCookie("userName", userName);
  
  console.log("Đã lưu userId vào cookie và session:", userId);
  
  // Kích hoạt event để thông báo cho các component khác
  window.dispatchEvent(new Event('storage'));
};

/**
 * Xóa thông tin đăng nhập khỏi session
 */
export const clearLoginInfo = (): void => {
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userType");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("isLoggedIn");
  
  // Xóa cookies
  setCookie("userId", "", -1);
  setCookie("userName", "", -1);
  
  // Kích hoạt event để thông báo cho các component khác
  window.dispatchEvent(new Event('storage'));
};

/**
 * Thực hiện đăng nhập
 */
export const login = async (
  userName: string, 
  password: string
): Promise<{success: boolean, message: string, userType?: string, userId?: string}> => {
  try {
    console.log("Đang đăng nhập với:", userName);
    
    const response = await fetch(`${getBaseUrl()}/dang-nhap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      credentials: "include", // Quan trọng để nhận cookies từ server
      body: new URLSearchParams({
        name: userName,
        password: password,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("Đăng nhập thành công, userId:", data.userId);
      saveLoginInfo(data.userName, data.userType, data.userId || "3"); // Mặc định là 3 nếu không có userId
      return {
        success: true,
        message: "Đăng nhập thành công",
        userType: data.userType,
        userId: data.userId
      };
    } else {
      return {
        success: false,
        message: data.error || "Đăng nhập thất bại"
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Không thể kết nối đến server"
    };
  }
};

/**
 * Thực hiện đăng xuất
 */
export const logout = async (): Promise<{success: boolean, message: string}> => {
  try {
    const response = await fetch(`${getBaseUrl()}/dang-xuat`, {
      method: "POST",
      credentials: "include",
    });
    
    clearLoginInfo();
    
    if (response.ok) {
      return {
        success: true,
        message: "Đăng xuất thành công"
      };
    } else {
      return {
        success: false,
        message: "Đăng xuất thất bại"
      };
    }
  } catch (error) {
    console.error("Logout error:", error);
    
    // Vẫn xóa dữ liệu ngay cả khi gọi API thất bại
    clearLoginInfo();
    
    return {
      success: false,
      message: "Không thể kết nối đến server"
    };
  }
}; 