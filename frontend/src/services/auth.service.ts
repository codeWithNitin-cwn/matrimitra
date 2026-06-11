import api from './api';
import { z } from 'zod';

// Zod schema for frontend form validation
export const loginCredentialsSchema = z.object({
  email: z.string().email('A valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

export interface User {
  id: string;
  agencyId: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthApiResponse {
  success: boolean;
  data: LoginResponse;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Safely parse and validate before hitting the network
    loginCredentialsSchema.parse(credentials);

    const response = await api.post<AuthApiResponse>('/auth/login', credentials);
    return response.data.data;
  }
}

export const authService = new AuthService();