import { LoginDto, LoginResponse, RegisterDto } from "@/types/auth";
import { api } from "./api";

export const authService = {
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);

    if (data) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
    }

    return data;
  },

  async register(userData: RegisterDto) {
    const { data } = await api.post("auth/register", userData);
    return data;
  },

  logOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  },

  getUser() {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (!token || !user) return null;
      try {
        return JSON.parse(user);
      } catch {
        return null;
      }
    }
    return null;
  },
};
