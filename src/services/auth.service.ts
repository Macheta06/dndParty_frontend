import { LoginDto, LoginResponse, RegisterDto } from "@/types/auth";
import { api } from "./api";

export const authService = {
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);

    if (data) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
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
  },

  getUser() {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};
