import { authStorage } from "@/src/lib/storage";
import { API_BASE_URL } from "@/src/lib/env";
import type {
  ApiEnvelope,
  AppUser,
  ClientDashboardData,
  CategoryItem,
  ChatMessage,
  ConversationSummary,
  DashboardData,
  FaqItem,
  OrderSummary,
  PublicServiceCard,
  PublicServiceDetail,
  ServiceRequestSummary,
  SupportMessage,
  WithdrawalBalance,
  WithdrawalSummary,
} from "@/src/types/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> => {
  const token = options.token ?? (await authStorage.getAccessToken());
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
      : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || "Request failed.", response.status);
  }

  return payload;
};

const requestWithFriendlyErrors = async <T>(endpoint: string, options: RequestOptions = {}) => {
  try {
    return await request<T>(endpoint, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(
        `Network request failed. Mobile app tried ${API_BASE_URL || "an empty API URL"}. Set EXPO_PUBLIC_API_URL if needed.`,
        0
      );
    }
    throw error;
  }
};

const mapCategory = (item: any): CategoryItem => ({
  id: String(item?._id || item?.id || ""),
  name: String(item?.name || ""),
  slug: String(item?.slug || ""),
  description: String(item?.description || ""),
});

export const mobileApi = {
  request: requestWithFriendlyErrors,
  login: (body: { email: string; password: string }) =>
    requestWithFriendlyErrors<{ accessToken: string; refreshToken: string; user: AppUser }>("/api/auth/login", {
      method: "POST",
      body,
    }),
  refreshToken: (body: { refreshToken: string }) =>
    requestWithFriendlyErrors<{ accessToken: string; refreshToken: string }>("/api/auth/refresh-token", {
      method: "POST",
      body,
    }),
  logout: (body: { refreshToken: string }) =>
    requestWithFriendlyErrors<unknown>("/api/auth/logout", {
      method: "POST",
      body,
    }),
  signup: (body: { firstName: string; lastName: string; email: string; password: string; role: "client" | "provider" }) =>
    requestWithFriendlyErrors<{ email: string; otpExpiresInMinutes: number }>("/api/auth/signup", { method: "POST", body }),
  verifySignupOtp: (body: { email: string; otp: string }) =>
    requestWithFriendlyErrors<{ id: string; firstName: string; lastName: string; email: string; role: string }>("/api/auth/verify-signup-otp", {
      method: "POST",
      body,
    }),
  getMyProfile: () => requestWithFriendlyErrors<{ user: AppUser }>("/api/profile/me"),
  getCategories: async () => {
    const payload = await requestWithFriendlyErrors<any[]>("/api/categories");
    return {
      ...payload,
      data: Array.isArray(payload.data) ? payload.data.map(mapCategory) : [],
    };
  },
  getPublicServices: (query = "") =>
    requestWithFriendlyErrors<Paginated<PublicServiceCard>>(`/api/gigs/public${query ? `?${query}` : ""}`),
  getPublicServiceById: (id: string) => requestWithFriendlyErrors<PublicServiceDetail>(`/api/gigs/public/${id}`),
  getProviderProfile: (providerId: string) =>
    requestWithFriendlyErrors<any>(`/api/profile/provider/${providerId}/public`),
  getFaqs: () => requestWithFriendlyErrors<FaqItem[]>("/api/faqs"),
  getClientDashboard: () =>
    requestWithFriendlyErrors<ClientDashboardData>("/api/orders/client/dashboard"),
  getProviderDashboard: () =>
    requestWithFriendlyErrors<DashboardData>("/api/orders/provider/dashboard"),
  createServiceRequest: (body: FormData) =>
    requestWithFriendlyErrors<{ request?: ServiceRequestSummary; notifiedProviders?: number }>("/api/service-requests", { method: "POST", body }),
  getClientServiceRequests: (query = "page=1&limit=8&status=all") =>
    requestWithFriendlyErrors<{
      items?: ServiceRequestSummary[];
      pagination?: Paginated<ServiceRequestSummary>["pagination"];
    }>(`/api/service-requests/client?${query}`),
  getProviderServiceRequests: (query = "page=1&limit=8&radiusKm=30") =>
    requestWithFriendlyErrors<{
      items?: ServiceRequestSummary[];
      pagination?: Paginated<ServiceRequestSummary>["pagination"];
    }>(`/api/service-requests/provider?${query}`),
  acceptServiceRequest: (id: string) =>
    requestWithFriendlyErrors<{ request?: ServiceRequestSummary; order?: { id?: string; orderNumber?: string } }>(
      `/api/service-requests/provider/${id}/accept`,
      { method: "PATCH" }
    ),
  ignoreServiceRequest: (id: string) =>
    requestWithFriendlyErrors<{ requestId?: string }>(`/api/service-requests/provider/${id}/ignore`, { method: "PATCH" }),
  getClientOrders: (query = "page=1&limit=8&status=all") =>
    requestWithFriendlyErrors<Paginated<OrderSummary>>(`/api/orders/client?${query}`),
  getProviderOrders: (query = "page=1&limit=8&status=all") =>
    requestWithFriendlyErrors<Paginated<OrderSummary>>(`/api/orders/provider?${query}`),
  getClientOrderDetail: (id: string) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/client/${id}`),
  getProviderOrderDetail: (id: string) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/provider/${id}`),
  createOrder: (body: {
    gigId: string;
    packageName: string;
    packageTitle: string;
    scheduledDate: string;
    scheduledTime: string;
    serviceAddress: string;
    specialInstructions?: string;
  }) => requestWithFriendlyErrors<{ order: OrderSummary }>("/api/orders", { method: "POST", body }),
  acceptProviderOrder: (id: string) => requestWithFriendlyErrors<unknown>(`/api/orders/provider/${id}/accept`, { method: "PATCH" }),
  declineProviderOrder: (id: string) => requestWithFriendlyErrors<unknown>(`/api/orders/provider/${id}/decline`, { method: "PATCH" }),
  submitProviderDelivery: (id: string, body: FormData) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/provider/${id}/deliver`, { method: "PATCH", body }),
  respondProviderRevision: (id: string, body: { action: "accept" | "decline"; note?: string }) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/provider/${id}/revision-response`, { method: "PATCH", body }),
  requestClientRevision: (id: string, body: { note: string }) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/client/${id}/request-revision`, { method: "PATCH", body }),
  cancelClientRevision: (id: string) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/client/${id}/cancel-revision`, { method: "PATCH" }),
  sendClientResolutionMessage: (id: string, body: { text?: string }) =>
    requestWithFriendlyErrors<{ conversationId?: string }>(`/api/orders/client/${id}/resolution-message`, { method: "POST", body }),
  createClientCheckoutSession: (id: string) =>
    requestWithFriendlyErrors<{ checkoutUrl?: string; sessionId?: string }>(`/api/orders/client/${id}/stripe-checkout`, { method: "POST" }),
  confirmClientCheckoutPayment: (id: string, body: { sessionId: string; clientRating?: number; clientReview?: string }) =>
    requestWithFriendlyErrors<{ order: OrderSummary; providerEarningsAmount?: number; platformFeeAmount?: number }>(
      `/api/orders/client/${id}/stripe-confirm`,
      { method: "POST", body }
    ),
  submitClientOrderReview: (id: string, body: { rating: number; review?: string }) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/client/${id}/review`, { method: "POST", body }),
  finalizeClientOrder: (id: string) =>
    requestWithFriendlyErrors<{ order: OrderSummary }>(`/api/orders/client/${id}/finalize`, { method: "PATCH" }),
  getMyGigs: () => requestWithFriendlyErrors<{ publishedGigs?: any[]; pendingRequests?: any[] }>("/api/gigs/mine"),
  createGig: (body: FormData) => requestWithFriendlyErrors<unknown>("/api/gigs", { method: "POST", body }),
  updateGig: (id: string, body: FormData) => requestWithFriendlyErrors<unknown>(`/api/gigs/${id}`, { method: "PUT", body }),
  deleteGig: (id: string) => requestWithFriendlyErrors<unknown>(`/api/gigs/${id}`, { method: "DELETE" }),
  getSavedServices: () => requestWithFriendlyErrors<{ items: PublicServiceCard[] }>("/api/profile/me/saved-services"),
  saveService: (gigId: string) =>
    requestWithFriendlyErrors<{ user: AppUser }>(`/api/profile/me/saved-services/${gigId}`, { method: "POST" }),
  removeSavedService: (gigId: string) =>
    requestWithFriendlyErrors<{ user: AppUser }>(`/api/profile/me/saved-services/${gigId}`, { method: "DELETE" }),
  updateProfile: (body: Partial<AppUser>) =>
    requestWithFriendlyErrors<{ user: AppUser }>("/api/profile/me", { method: "PUT", body }),
  uploadAvatar: (body: FormData) =>
    requestWithFriendlyErrors<{ avatarUrl?: string; user: AppUser }>("/api/profile/avatar", { method: "POST", body }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    requestWithFriendlyErrors<unknown>("/api/profile/change-password", { method: "POST", body }),
  submitProviderPayoutInfo: (body: FormData) =>
    requestWithFriendlyErrors<{ user: AppUser }>("/api/profile/provider/payout-info", { method: "POST", body }),
  getMyWithdrawals: (query = "page=1&limit=8") =>
    requestWithFriendlyErrors<{
      balance?: WithdrawalBalance;
      withdrawals?: WithdrawalSummary[];
      pagination?: Paginated<WithdrawalSummary>["pagination"];
    }>(`/api/withdrawals/me?${query}`),
  requestWithdrawal: (body: { amount: number; note?: string }) =>
    requestWithFriendlyErrors<WithdrawalSummary>("/api/withdrawals/me/request", { method: "POST", body }),
  createSupportMessage: (body: { fullName: string; email: string; subject: string; message: string }) =>
    requestWithFriendlyErrors<SupportMessage>("/api/support", { method: "POST", body }),
  getConversations: () => requestWithFriendlyErrors<ConversationSummary[]>("/api/chats/conversations"),
  ensureConversationByOrder: (orderId: string) =>
    requestWithFriendlyErrors<ConversationSummary>(`/api/chats/conversations/order/${orderId}`, { method: "POST" }),
  getConversationMessages: (conversationId: string, query = "page=1&limit=50") =>
    requestWithFriendlyErrors<Paginated<ChatMessage>>(`/api/chats/conversations/${conversationId}/messages?${query}`),
  sendConversationMessage: (conversationId: string, body: FormData) =>
    requestWithFriendlyErrors<ChatMessage>(`/api/chats/conversations/${conversationId}/messages`, { method: "POST", body }),
  markConversationRead: (conversationId: string) =>
    requestWithFriendlyErrors<{ modifiedCount?: number }>(`/api/chats/conversations/${conversationId}/read`, { method: "POST" }),
  clearConversationHistory: (conversationId: string) =>
    requestWithFriendlyErrors<{ deletedCount?: number }>(`/api/chats/conversations/${conversationId}/messages`, { method: "DELETE" }),
  blockConversationUser: (conversationId: string) =>
    requestWithFriendlyErrors<{ blockedBy?: string }>(`/api/chats/conversations/${conversationId}/block`, { method: "POST" }),
  unblockConversationUser: (conversationId: string) =>
    requestWithFriendlyErrors<{ blockedBy?: string | null }>(`/api/chats/conversations/${conversationId}/block`, { method: "DELETE" }),
  markAllMessagesRead: () =>
    requestWithFriendlyErrors<{ modifiedCount?: number }>("/api/chats/conversations/read-all", { method: "POST" }),
};

export { ApiError };

