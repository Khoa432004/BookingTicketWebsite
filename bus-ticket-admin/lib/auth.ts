// Hàm utility cho việc quản lý authentication
  import { Environment, getCurrentEnvironment, getApiBaseUrl } from "@/services/env";

  // For getting base URL
  export const getBaseUrl = (): string => {
    const currentEnv = getCurrentEnvironment();
    const baseUrl = getApiBaseUrl();
    
    console.log('Current environment in auth:', currentEnv);
    console.log('Adjusted base URL in auth:', baseUrl);
    return baseUrl;
  };

  // For login URL based on environment
  const getLoginUrl = (): string => {
    const baseUrl = getBaseUrl();
    const loginUrl = `${baseUrl}/admin/dang-nhap`;
    console.log('Login URL:', loginUrl);
    return loginUrl;
  };

  // For logout URL based on environment
  const getLogoutUrl = (): string => {
    const baseUrl = getBaseUrl();
    const logoutUrl = `${baseUrl}/admin/dang-xuat`;
    console.log('Logout URL:', logoutUrl);
    return logoutUrl;
  };

  /**
   * Kiểm tra xem người dùng đã đăng nhập hay chưa
   */
  export const isLoggedIn = (): boolean => {
    if (typeof window === 'undefined') return false;
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn") === "true";
    console.log('Is logged in:', isLoggedIn);
    return isLoggedIn;
  };

  /**
   * Lấy tên người dùng đã đăng nhập
   */
  export const getUserName = (): string | null => {
    if (typeof window === 'undefined') return null;
    const userName = sessionStorage.getItem("adminUserName");
    console.log('User name:', userName);
    return userName;
  };

  /**
   * Lấy loại tài khoản người dùng
   */
  export const getUserType = (): string | null => {
    if (typeof window === 'undefined') return null;
    const userType = sessionStorage.getItem("adminUserType");
    console.log('User type:', userType);
    return userType;
  };

  /**
   * Lấy ID người dùng đã đăng nhập
   */
  export const getUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    // Kiểm tra từ sessionStorage
    const fromSession = sessionStorage.getItem("adminUserId");
    
    // Nếu không có trong session, thử lấy từ cookie
    if (!fromSession) {
      const fromCookie = getCookie("adminUserId");
      console.log('User ID from cookie:', fromCookie);
      return fromCookie;
    }
    
    console.log('User ID from session:', fromSession);
    return fromSession;
  };

  /**
   * Hàm trợ giúp để lấy giá trị cookie
   */
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift() || null;
      console.log(`Cookie ${name}:`, cookieValue);
      return cookieValue;
    }
    console.log(`Cookie ${name} not found`);
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
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
    console.log(`Set cookie ${name}:`, value);
  };

  /**
   * Lưu thông tin đăng nhập vào session
   */
  export const saveLoginInfo = (userName: string, userType: string, userId: string): void => {
    if (typeof window === 'undefined') return;

    // Lưu vào sessionStorage
    sessionStorage.setItem("adminUserName", userName);
    sessionStorage.setItem("adminUserType", userType);
    sessionStorage.setItem("adminUserId", userId);
    sessionStorage.setItem("isAdminLoggedIn", "true");
    
    // Lưu thêm vào cookie
    setCookie("adminUserId", userId);
    setCookie("adminUserName", userName);
    
    console.log("Đã lưu thông tin đăng nhập vào cookie và session:", { userName, userType, userId });
    
    // Kích hoạt event để thông báo cho các component khác
    window.dispatchEvent(new Event('storage'));
  };

  /**
   * Xóa thông tin đăng nhập khỏi session
   */
  export const clearLoginInfo = (): void => {
    sessionStorage.removeItem("adminUserName");
    sessionStorage.removeItem("adminUserType");
    sessionStorage.removeItem("adminUserId");
    sessionStorage.removeItem("isAdminLoggedIn");
    
    // Xóa cookies
    setCookie("adminUserId", "", -1);
    setCookie("adminUserName", "", -1);
    
    console.log("Đã xóa thông tin đăng nhập khỏi session và cookie");
    
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
      console.log("Đang đăng nhập admin với:", userName);
      
      const response = await fetch(getLoginUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        credentials: "include",
        body: new URLSearchParams({
          name: userName,
          password: password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log("Đăng nhập admin thành công, response data:", data);
        const userId = data.userId || "1";
        const userType = data.userType || "admin";
        const userNameFromResponse = data.userName || userName;
        
        saveLoginInfo(userNameFromResponse, userType, userId);
        
        return {
          success: true,
          message: "Đăng nhập thành công",
          userType: userType,
          userId: userId
        };
      } else {
        console.log("Đăng nhập thất bại, response data:", data);
        return {
          success: false,
          message: data.error || "Đăng nhập thất bại"
        };
      }
    } catch (error) {
      console.error("Admin login error:", error);
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
      const response = await fetch(getLogoutUrl(), {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        clearLoginInfo();
        console.log("Đăng xuất thành công");
        return {
          success: true,
          message: "Đăng xuất thành công"
        };
      } else {
        console.log("Đăng xuất thất bại, response status:", response.status);
        return {
          success: false,
          message: "Đăng xuất thất bại"
        };
      }
    } catch (error) {
      console.error("Admin logout error:", error);
      
      // Vẫn xóa dữ liệu ngay cả khi gọi API thất bại
      clearLoginInfo();
      
      return {
        success: false,
        message: "Không thể kết nối đến server"
      };
    }
  };