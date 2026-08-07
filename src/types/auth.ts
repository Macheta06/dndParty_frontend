export interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
  token: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}
