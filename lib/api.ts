/**
 * API Client for Soul Paradise Backend
 * Handles all HTTP requests with proper error handling and token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture: string | null;
    emailVerified?: boolean;
    provider?: string;
    createdAt?: string;
    lastLoginAt?: string | null;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture: string | null;
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface ContactFormRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    createdAt: string;
  };
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  service: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialRequest {
  name: string;
  review: string;
  rating: number;
  service: string;
}

export interface TestimonialResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    createdAt: string;
  };
}

export interface TestimonialsListResponse {
  success: boolean;
  data: Testimonial[];
  count: number;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Backend returns error in format: { message, statusCode, error }
        throw {
          message: data.message || 'An error occurred',
          statusCode: response.status,
          error: data.error,
        } as ApiError;
      }

      return data as T;
    } catch (error) {
      if ((error as ApiError).statusCode) {
        // Re-throw API errors
        throw error;
      }
      // Network or other errors
      throw {
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      } as ApiError;
    }
  }

  /**
   * Authenticated request with access token
   */
  private async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      throw {
        message: 'Not authenticated',
        statusCode: 401,
      } as ApiError;
    }

    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // Token Management
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Auth Endpoints

  /**
   * Register a new user
   * POST /auth/register
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Save tokens after successful registration
    this.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Save tokens after successful login
    this.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Google OAuth login/register
   * POST /auth/google-auth
   */
  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/google-auth', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    // Save tokens after successful authentication
    this.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Logout current session
   * POST /auth/logout
   */
  async logout(): Promise<{ message: string }> {
    const response = await this.authenticatedRequest<{ message: string }>(
      '/auth/logout',
      {
        method: 'POST',
      }
    );

    // Clear tokens after logout
    this.clearTokens();

    return response;
  }

  /**
   * Logout from all devices
   * POST /auth/logout-all
   */
  async logoutAll(): Promise<{ message: string }> {
    const response = await this.authenticatedRequest<{ message: string }>(
      '/auth/logout-all',
      {
        method: 'POST',
      }
    );

    // Clear tokens after logout
    this.clearTokens();

    return response;
  }

  /**
   * Get user profile
   * GET /auth/profile
   */
  async getProfile(): Promise<User> {
    return this.authenticatedRequest<User>('/auth/profile');
  }

  /**
   * Get current user
   * GET /auth/me
   */
  async getCurrentUser(): Promise<User> {
    return this.authenticatedRequest<User>('/auth/me');
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw {
        message: 'No refresh token available',
        statusCode: 401,
      } as ApiError;
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    // Update tokens
    this.setTokens(response.accessToken, response.refreshToken);

    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Email Verification Endpoints

  /**
   * Verify email with token
   * POST /auth/verify-email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Resend verification email
   * POST /auth/resend-verification
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Send verification email (authenticated)
   * POST /auth/send-verification
   */
  async sendVerification(): Promise<{ message: string }> {
    return this.authenticatedRequest<{ message: string }>('/auth/send-verification', {
      method: 'POST',
    });
  }

  /**
   * Request password reset email
   * POST /auth/forgot-password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Contact Form Endpoints

  /**
   * Submit contact form
   * POST /contacts
   */
  async submitContactForm(data: ContactFormRequest): Promise<ContactFormResponse> {
    return this.request<ContactFormResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Testimonials Endpoints

  /**
   * Get latest approved testimonials
   * GET /testimonials?limit=6
   */
  async getLatestTestimonials(limit: number = 6): Promise<TestimonialsListResponse> {
    return this.request<TestimonialsListResponse>(`/testimonials?limit=${limit}`);
  }

  /**
   * Submit a new testimonial
   * POST /testimonials
   */
  async submitTestimonial(data: CreateTestimonialRequest): Promise<TestimonialResponse> {
    return this.request<TestimonialResponse>('/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
