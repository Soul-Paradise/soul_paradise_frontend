/**
 * API Client for Soul Paradise Backend
 * Handles all HTTP requests with proper error handling and token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * A real Error subclass so failures always carry a message + stack and never
 * serialize to "{}" in the console. Consumers can read `.statusCode`/`.error`
 * or use `instanceof ApiError`.
 */
export class ApiError extends Error {
  statusCode: number;
  error?: string;

  constructor(message: string, statusCode: number, error?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    // Restore the prototype chain (needed when targeting ES5/older runtimes).
    Object.setPrototypeOf(this, ApiError.prototype);
  }
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
  role: 'USER' | 'ADMIN';
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
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data.error
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        // Re-throw API errors
        throw error;
      }
      // Network or other errors (fetch rejected, non-JSON body, etc.)
      throw new ApiError('Network error. Please check your connection.', 0);
    }
  }

  // De-duplicate concurrent refreshes: if several authenticated calls 401 at
  // once, they all await the same in-flight refresh instead of each hitting
  // /auth/refresh (which would rotate the stored refresh token repeatedly).
  private refreshInFlight: Promise<boolean> | null = null;

  private async tryRefresh(): Promise<boolean> {
    if (!this.getRefreshToken()) return false;
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.refreshToken()
        .then(() => true)
        .catch(() => {
          // Refresh token is gone/expired — the session is truly dead.
          this.clearTokens();
          return false;
        })
        .finally(() => {
          this.refreshInFlight = null;
        });
    }
    return this.refreshInFlight;
  }

  /**
   * Authenticated request with access token.
   * Transparently recovers from an expired access token: on a 401 it refreshes
   * the token once and retries the request a single time. This is what keeps a
   * user signed in across the (long-lived) refresh-token window instead of
   * being logged out the moment the short-lived access token expires.
   */
  private async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      throw new ApiError('Not authenticated', 401);
    }

    const withAuth = (token: string): RequestInit => ({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      return await this.request<T>(endpoint, withAuth(accessToken));
    } catch (err) {
      // Only an expired/invalid access token is retryable here.
      if (!(err instanceof ApiError) || err.statusCode !== 401) {
        throw err;
      }

      const refreshed = await this.tryRefresh();
      if (!refreshed) {
        throw err;
      }

      const newToken = this.getAccessToken();
      if (!newToken) {
        throw err;
      }

      // Retry exactly once with the fresh access token.
      return this.request<T>(endpoint, withAuth(newToken));
    }
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
      throw new ApiError('No refresh token available', 401);
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
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

/**
 * Returns Authorization headers for authenticated requests.
 * Returns an empty object on the server or when no token is present.
 */
export function authHeaders(): Record<string, string> {
  const token = api.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// De-duplicate concurrent refreshes: if several requests 401 at once, they all
// await the same in-flight refresh instead of hammering /auth/refresh.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = api
      .refreshToken()
      .then(() => true)
      .catch(() => {
        // Refresh token is gone/expired — the session is truly dead.
        api.clearTokens();
        return false;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * fetch() wrapper for authenticated calls that transparently recovers from an
 * expired access token: on a 401 it refreshes the token once and retries the
 * request a single time. If the refresh fails, it clears the session and sends
 * the user to /login. Always attaches the current Authorization header itself —
 * callers should NOT spread authHeaders() into the request.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const build = (): RequestInit => ({
    ...init,
    headers: { ...(init.headers || {}), ...authHeaders() },
  });

  const res = await fetch(input, build());
  if (res.status !== 401) return res;

  // Access token likely expired — try one refresh + retry.
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login';
    }
    return res; // still 401; caller surfaces the error
  }
  return fetch(input, build());
}
