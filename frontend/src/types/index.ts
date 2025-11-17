// User types
export enum UserRole {
  INTERVIEWER = 'interviewer',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  group?: string;
  team?: string;
  createdAt: string;
  updatedAt: string;
}

// Laptop types
export enum LaptopStatus {
  AVAILABLE = 'available',
  CHECKED_OUT = 'checked_out',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export interface Laptop {
  id: string;
  uniqueId: string;
  serialNumber: string;
  make: string;
  model: string;
  status: LaptopStatus;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Checkout types
export enum CheckoutStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Checkout {
  id: string;
  laptopId: string;
  userId: string;
  checkedOutAt: string;
  checkedInAt?: string;
  status: CheckoutStatus;
  laptop?: Laptop;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// Lost & Found Event types
export interface LostFoundEvent {
  id: string;
  laptopId: string;
  checkoutId: string;
  originalUserId: string;
  finderUserId: string;
  eventTimestamp: string;
  durationMinutes: number;
  laptop?: Laptop;
  originalUser?: User;
  finderUser?: User;
  createdAt: string;
}

// Dashboard types
export interface DashboardSummary {
  totalLaptops: number;
  availableLaptops: number;
  checkedOutLaptops: number;
  overdueLaptops: number;
  maintenanceLaptops: number;
  retiredLaptops: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}
