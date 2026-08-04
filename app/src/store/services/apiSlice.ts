import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { API_BASE_URL } from "@/src/lib/env";
import { authStorage } from "@/src/lib/storage";
import type {
  ApiEnvelope,
  AppUser,
  CategoryItem,
  ChatMessage,
  ClientDashboardData,
  ConversationSummary,
  DashboardData,
  FaqItem,
  GigAnalyticsResponse,
  PublicWebsiteReviewsResponse,
  PublicServiceCard,
  PublicServiceDetail,
  PublicProviderProfile,
  ServiceRequestSummary,
  ProviderAvailabilityBlock,
  WebsiteReviewPromptResponse,
  WithdrawalBalance,
  WithdrawalSummary,
} from "@/src/types/api";

type Paginated<T> = {
  items?: T[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  responseHandler: async (response) => {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message: `Server returned a non-JSON response from ${response.url}. Check EXPO_PUBLIC_API_URL and make sure the backend is running.`,
      };
    }
  },
  prepareHeaders: async (headers) => {
    const token = await authStorage.getAccessToken();
    headers.set("Accept", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = await authStorage.getRefreshToken();
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/api/auth/refresh-token",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      const refreshPayload = refreshResult.data as
        | ApiEnvelope<{ accessToken: string; refreshToken: string }>
        | undefined;

      if (refreshPayload?.success && refreshPayload.data?.accessToken) {
        const currentUser = await authStorage.getUser();
        await authStorage.setSession(
          refreshPayload.data.accessToken,
          refreshPayload.data.refreshToken || refreshToken,
          currentUser,
          authStorage.isPersistent()
        );
        return rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Profile", "Gigs", "Categories", "Orders", "Chats", "ServiceRequests", "Availability"],
  endpoints: (builder) => ({
    getMyProfile: builder.query<ApiEnvelope<{ user: AppUser }>, void>({
      query: () => "/api/profile/me",
      providesTags: ["Profile"],
    }),
    getFaqs: builder.query<ApiEnvelope<FaqItem[]>, void>({
      query: () => "/api/faqs",
    }),
    getCategories: builder.query<ApiEnvelope<CategoryItem[]>, void>({
      query: () => "/api/categories",
      providesTags: ["Categories"],
    }),
    getPublicServices: builder.query<
      ApiEnvelope<Paginated<PublicServiceCard>>,
      {
        page?: number;
        limit?: number;
        radiusKm?: number;
        requireCoverage?: boolean;
        categorySlug?: string;
        search?: string;
        zipCode?: string;
        lat?: number | null;
        lng?: number | null;
      }
    >({
      query: ({
        page = 1,
        limit = 9,
        radiusKm = 25,
        requireCoverage = false,
        categorySlug = "all",
        search = "",
        zipCode = "",
        lat = null,
        lng = null,
      }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("radiusKm", String(radiusKm));
        params.set("requireCoverage", String(requireCoverage));
        params.set("categorySlug", categorySlug || "all");
        if (search.trim()) params.set("search", search.trim());
        if (zipCode.trim()) params.set("zipCode", zipCode.trim());
        if (typeof lat === "number") params.set("lat", String(lat));
        if (typeof lng === "number") params.set("lng", String(lng));
        return `/api/gigs/public?${params.toString()}`;
      },
    }),
    getPublicServiceById: builder.query<ApiEnvelope<PublicServiceDetail>, string>({
      query: (id) => `/api/gigs/public/${id}`,
    }),
    getPublicProviderProfile: builder.query<ApiEnvelope<PublicProviderProfile>, string>({
      query: (providerId) => `/api/profile/provider/${providerId}/public`,
    }),
    getPublicProviderAvailabilityBlocks: builder.query<
      ApiEnvelope<{ items?: ProviderAvailabilityBlock[] }>,
      { providerId: string; from?: string; to?: string }
    >({
      query: ({ providerId, from = "", to = "" }) => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        return `/api/orders/availability/provider/${providerId}?${params.toString()}`;
      },
      providesTags: ["Availability"],
    }),
    getClientDashboard: builder.query<ApiEnvelope<ClientDashboardData>, void>({
      query: () => "/api/orders/client/dashboard",
      providesTags: ["Orders", "Chats", "Profile"],
    }),
    getProviderDashboard: builder.query<ApiEnvelope<DashboardData>, void>({
      query: () => "/api/orders/provider/dashboard",
      providesTags: ["Orders", "Profile"],
    }),
    getProviderRatings: builder.query<
      ApiEnvelope<{
        items?: any[];
        summary?: {
          averageRating?: number;
          reviewCount?: number;
        };
        pagination?: Paginated<any>["pagination"];
      }>,
      { page?: number; limit?: number } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        params.set("page", String(args?.page ?? 1));
        params.set("limit", String(args?.limit ?? 8));
        return `/api/orders/provider/ratings?${params.toString()}`;
      },
      providesTags: ["Orders", "Profile"],
    }),
    getProviderAvailabilityBlocks: builder.query<
      ApiEnvelope<{ items?: ProviderAvailabilityBlock[] }>,
      { from?: string; to?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.from) params.set("from", args.from);
        if (args?.to) params.set("to", args.to);
        return `/api/orders/provider/availability-blocks?${params.toString()}`;
      },
      providesTags: ["Availability"],
    }),
    createProviderAvailabilityBlock: builder.mutation<
      ApiEnvelope<{ block?: ProviderAvailabilityBlock }>,
      {
        dateKey: string;
        scope: "full_day" | "time_slot";
        startTime?: string;
        endTime?: string;
        note?: string;
        recurrence?: "none" | "weekly";
      }
    >({
      query: (payload) => ({
        url: "/api/orders/provider/availability-blocks",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Availability"],
    }),
    deleteProviderAvailabilityBlock: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/provider/availability-blocks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Availability"],
    }),
    getClientServiceRequests: builder.query<
      ApiEnvelope<Paginated<ServiceRequestSummary>>,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, status = "all", search = "" }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        return `/api/service-requests/client?${params.toString()}`;
      },
      providesTags: ["ServiceRequests"],
    }),
    getProviderServiceRequests: builder.query<
      ApiEnvelope<Paginated<ServiceRequestSummary>>,
      { page?: number; limit?: number; radiusKm?: number; search?: string }
    >({
      query: ({ page = 1, limit = 20, radiusKm = 30, search = "" }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("radiusKm", String(radiusKm));
        if (search.trim()) params.set("search", search.trim());
        return `/api/service-requests/provider?${params.toString()}`;
      },
      providesTags: ["ServiceRequests"],
    }),
    acceptServiceRequest: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/service-requests/provider/${id}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: ["ServiceRequests", "Orders"],
    }),
    respondToAdminServiceRequestInvitation: builder.mutation<
      ApiEnvelope<{ request?: ServiceRequestSummary; conversationId?: string }>,
      { id: string; action: "accept" | "decline" }
    >({
      query: ({ id, action }) => ({
        url: `/api/service-requests/provider/${id}/admin-invitation/respond`,
        method: "PATCH",
        body: { action },
      }),
      invalidatesTags: ["ServiceRequests", "Orders", "Chats"],
    }),
    ignoreServiceRequest: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/service-requests/provider/${id}/ignore`,
        method: "PATCH",
      }),
      invalidatesTags: ["ServiceRequests"],
    }),
    getClientOrders: builder.query<
      ApiEnvelope<Paginated<any>>,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, status = "all", search = "" }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        return `/api/orders/client?${params.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getProviderOrders: builder.query<
      ApiEnvelope<Paginated<any>>,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: ({ page = 1, limit = 20, status = "all", search = "" }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        return `/api/orders/provider?${params.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getClientOrderDetail: builder.query<ApiEnvelope<{ order: any }>, string>({
      query: (id) => `/api/orders/client/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),
    getProviderOrderDetail: builder.query<ApiEnvelope<{ order: any }>, string>({
      query: (id) => `/api/orders/provider/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),
    createOrder: builder.mutation<
      ApiEnvelope<{ order: any }>,
      {
        gigId: string;
        packageName: string;
        packageTitle: string;
        scheduledDate: string;
        scheduledTime: string;
        serviceAddress: string;
        specialInstructions?: string;
      }
    >({
      query: (payload) => ({
        url: "/api/orders",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Orders"],
    }),
    acceptProviderOrder: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/provider/${id}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),
    declineProviderOrder: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/provider/${id}/decline`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),
    submitProviderDelivery: builder.mutation<
      ApiEnvelope<{ order: any }>,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/api/orders/provider/${id}/deliver`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Orders"],
    }),
    respondProviderRevision: builder.mutation<
      ApiEnvelope<{ order: any }>,
      { id: string; action: "accept" | "decline"; note?: string }
    >({
      query: ({ id, action, note = "" }) => ({
        url: `/api/orders/provider/${id}/revision-response`,
        method: "PATCH",
        body: { action, note },
      }),
      invalidatesTags: ["Orders"],
    }),
    requestClientRevision: builder.mutation<
      ApiEnvelope<{ order: any }>,
      { id: string; note: string }
    >({
      query: ({ id, note }) => ({
        url: `/api/orders/client/${id}/request-revision`,
        method: "PATCH",
        body: { note },
      }),
      invalidatesTags: ["Orders"],
    }),
    cancelClientRevision: builder.mutation<ApiEnvelope<{ order: any }>, string>({
      query: (id) => ({
        url: `/api/orders/client/${id}/cancel-revision`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),
    sendClientResolutionMessage: builder.mutation<
      ApiEnvelope<{ conversationId?: string }>,
      { id: string; text: string }
    >({
      query: ({ id, text }) => ({
        url: `/api/orders/client/${id}/resolution-message`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Orders", "Chats"],
    }),
    createClientCheckoutSession: builder.mutation<
      ApiEnvelope<{ checkoutUrl?: string; sessionId?: string }>,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/api/orders/client/${id}/stripe-checkout`,
        method: "POST",
        headers: {
          "x-client-platform": "mobile",
        },
      }),
      invalidatesTags: ["Orders"],
    }),
    confirmClientCheckoutPayment: builder.mutation<
      ApiEnvelope<{ order: any }>,
      { id: string; sessionId: string }
    >({
      query: ({ id, sessionId }) => ({
        url: `/api/orders/client/${id}/stripe-confirm`,
        method: "POST",
        body: { sessionId },
      }),
      invalidatesTags: ["Orders"],
    }),
    submitClientOrderReview: builder.mutation<
      ApiEnvelope<{ order: any }>,
      { id: string; rating: number; review?: string }
    >({
      query: ({ id, rating, review }) => ({
        url: `/api/orders/client/${id}/review`,
        method: "POST",
        body: { rating, review },
      }),
      invalidatesTags: ["Orders"],
    }),
    finalizeClientOrder: builder.mutation<ApiEnvelope<{ order: any }>, string>({
      query: (id) => ({
        url: `/api/orders/client/${id}/finalize`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),
    getConversations: builder.query<ApiEnvelope<ConversationSummary[]>, void>({
      query: () => "/api/chats/conversations",
      providesTags: ["Chats"],
    }),
    ensureConversationByOrder: builder.mutation<ApiEnvelope<ConversationSummary>, string>({
      query: (orderId) => ({
        url: `/api/chats/conversations/order/${orderId}`,
        method: "POST",
      }),
      invalidatesTags: ["Chats"],
    }),
    startProviderConversation: builder.mutation<
      ApiEnvelope<{ conversation: ConversationSummary }>,
      { providerId: string; gigId: string }
    >({
      query: (payload) => ({
        url: "/api/chats/conversations/provider/start",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Chats"],
    }),
    startCustomOrderConversation: builder.mutation<
      ApiEnvelope<{ conversation: ConversationSummary; message: ChatMessage }>,
      { providerId: string; gigId: string }
    >({
      query: (payload) => ({
        url: "/api/chats/conversations/custom-order/start",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Chats"],
    }),
    startRepeatOrderConversation: builder.mutation<
      ApiEnvelope<{ conversation: ConversationSummary; message: ChatMessage }>,
      { sourceOrderId: string }
    >({
      query: (payload) => ({
        url: "/api/chats/conversations/repeat-order/start",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Chats"],
    }),
    getConversationMessages: builder.query<
      ApiEnvelope<Paginated<ChatMessage>>,
      { conversationId: string; page?: number; limit?: number }
    >({
      query: ({ conversationId, page = 1, limit = 100 }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/api/chats/conversations/${conversationId}/messages?${params.toString()}`;
      },
      providesTags: (_result, _error, arg) => [{ type: "Chats", id: arg.conversationId }],
    }),
    sendConversationMessage: builder.mutation<
      ApiEnvelope<ChatMessage>,
      { conversationId: string; formData: FormData }
    >({
      query: ({ conversationId, formData }) => ({
        url: `/api/chats/conversations/${conversationId}/messages`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Chats", id: arg.conversationId }, "Chats"],
    }),
    createCustomOrderProposal: builder.mutation<
      ApiEnvelope<ChatMessage>,
      {
        conversationId: string;
        gigId?: string;
        proposalType?: "custom" | "repeat_order";
        sourceOrderId?: string;
        title: string;
        description?: string;
        price: number;
        serviceAddress: string;
        scheduledDate: string;
        scheduledTime: string;
      }
    >({
      query: ({ conversationId, ...payload }) => ({
        url: `/api/chats/conversations/${conversationId}/custom-order-proposals`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Chats", id: arg.conversationId }, "Chats", "Orders"],
    }),
    respondToCustomOrderProposal: builder.mutation<
      ApiEnvelope<{ message: ChatMessage; order: { id: string; orderNumber: string } | null }>,
      { proposalId: string; action: "accept" | "decline" }
    >({
      query: ({ proposalId, action }) => ({
        url: `/api/chats/custom-order-proposals/${proposalId}/respond`,
        method: "PATCH",
        body: { action },
      }),
      invalidatesTags: ["Chats", "Orders"],
    }),
    markConversationMessagesAsRead: builder.mutation<
      ApiEnvelope<{ modifiedCount?: number }>,
      string
    >({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/read`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: "Chats", id: conversationId }, "Chats"],
    }),
    markAllMessagesAsRead: builder.mutation<ApiEnvelope<{ modifiedCount?: number }>, void>({
      query: () => ({
        url: "/api/chats/conversations/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Chats"],
    }),
    clearConversationHistory: builder.mutation<ApiEnvelope<{ deletedCount?: number }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/messages`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: "Chats", id: conversationId }, "Chats"],
    }),
    deleteConversations: builder.mutation<ApiEnvelope<{ modifiedCount?: number }>, string[]>({
      query: (conversationIds) => ({
        url: "/api/chats/conversations",
        method: "DELETE",
        body: { conversationIds },
      }),
      invalidatesTags: ["Chats"],
    }),
    blockConversationUser: builder.mutation<ApiEnvelope<{ blockedBy?: string }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/block`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: "Chats", id: conversationId }, "Chats"],
    }),
    unblockConversationUser: builder.mutation<ApiEnvelope<{ blockedBy?: string | null }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/block`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: "Chats", id: conversationId }, "Chats"],
    }),
    createServiceRequest: builder.mutation<
      ApiEnvelope<{ request?: ServiceRequestSummary; notifiedProviders?: number }>,
      FormData
    >({
      query: (formData) => ({
        url: "/api/service-requests",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ServiceRequests", "Orders"],
    }),
    updateProfile: builder.mutation<ApiEnvelope<{ user: AppUser }>, Partial<AppUser>>({
      query: (payload) => ({
        url: "/api/profile/me",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Profile"],
    }),
    uploadAvatar: builder.mutation<
      ApiEnvelope<{ avatarUrl?: string; user: AppUser }>,
      FormData
    >({
      query: (formData) => ({
        url: "/api/profile/avatar",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Profile"],
    }),
    changePassword: builder.mutation<
      ApiEnvelope<unknown>,
      { currentPassword: string; newPassword: string }
    >({
      query: (payload) => ({
        url: "/api/profile/change-password",
        method: "POST",
        body: payload,
      }),
    }),
    deleteAccount: builder.mutation<ApiEnvelope<unknown>, void>({
      query: () => ({
        url: "/api/profile/me",
        method: "DELETE",
      }),
    }),
    getSavedServices: builder.query<ApiEnvelope<{ items?: PublicServiceCard[] }>, void>({
      query: () => "/api/profile/me/saved-services",
      providesTags: ["Profile"],
    }),
    saveService: builder.mutation<ApiEnvelope<{ user?: AppUser }>, string>({
      query: (gigId) => ({
        url: `/api/profile/me/saved-services/${gigId}`,
        method: "POST",
      }),
      invalidatesTags: ["Profile"],
    }),
    removeSavedService: builder.mutation<ApiEnvelope<{ user?: AppUser }>, string>({
      query: (gigId) => ({
        url: `/api/profile/me/saved-services/${gigId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Profile"],
    }),
    getMyWithdrawals: builder.query<
      ApiEnvelope<{
        balance?: WithdrawalBalance;
        withdrawals?: WithdrawalSummary[];
        pagination?: Paginated<WithdrawalSummary>["pagination"];
      }>,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === "object") {
          params.set("page", String(args.page ?? 1));
          params.set("limit", String(args.limit ?? 8));
          if (args.status) params.set("status", args.status);
        } else {
          params.set("page", "1");
          params.set("limit", "8");
        }
        return `/api/withdrawals/me?${params.toString()}`;
      },
      providesTags: ["Profile"],
    }),
    requestWithdrawal: builder.mutation<ApiEnvelope<WithdrawalSummary>, { amount: number; note?: string }>({
      query: (payload) => ({
        url: "/api/withdrawals/me/request",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Profile"],
    }),
    createSupportMessage: builder.mutation<
      ApiEnvelope<unknown>,
      { fullName: string; email: string; subject: string; message: string }
    >({
      query: (payload) => ({
        url: "/api/support",
        method: "POST",
        body: payload,
      }),
    }),
    getMyGigs: builder.query<ApiEnvelope<{ publishedGigs?: any[]; pendingRequests?: any[] }>, void>({
      query: () => "/api/gigs/mine",
      providesTags: ["Gigs"],
    }),
    getGigAnalytics: builder.query<ApiEnvelope<GigAnalyticsResponse>, string>({
      query: (id) => `/api/gigs/${id}/analytics`,
    }),
    createGig: builder.mutation<ApiEnvelope<unknown>, FormData>({
      query: (formData) => ({
        url: "/api/gigs",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Gigs"],
    }),
    updateGig: builder.mutation<ApiEnvelope<unknown>, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/api/gigs/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Gigs"],
    }),
    deleteGig: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/gigs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Gigs"],
    }),
    deleteGigRequest: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/gigs/requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Gigs"],
    }),
    login: builder.mutation<
      ApiEnvelope<{ accessToken: string; refreshToken: string; user: AppUser }>,
      { email: string; password: string }
    >({
      query: (payload) => ({
        url: "/api/auth/login",
        method: "POST",
        body: payload,
      }),
    }),
    loginWithGoogle: builder.mutation<
      ApiEnvelope<{ accessToken: string; refreshToken: string; user: AppUser }>,
      { idToken: string; role?: "client" | "provider" }
    >({
      query: (payload) => ({
        url: "/api/auth/google",
        method: "POST",
        body: payload,
      }),
    }),
    logout: builder.mutation<ApiEnvelope<unknown>, { refreshToken: string }>({
      query: (payload) => ({
        url: "/api/auth/logout",
        method: "POST",
        body: payload,
      }),
    }),
    signup: builder.mutation<
      ApiEnvelope<{ email: string; otpExpiresInMinutes: number }>,
      { firstName: string; lastName: string; email: string; password: string; role: "client" | "provider" }
    >({
      query: (payload) => ({
        url: "/api/auth/signup",
        method: "POST",
        body: payload,
      }),
    }),
    verifySignupOtp: builder.mutation<
      ApiEnvelope<{ accessToken: string; refreshToken: string; user: AppUser }>,
      { email: string; otp: string }
    >({
      query: (payload) => ({
        url: "/api/auth/verify-signup-otp",
        method: "POST",
        body: payload,
      }),
    }),
    getWebsiteReviewPrompt: builder.query<
      ApiEnvelope<WebsiteReviewPromptResponse>,
      "client" | "provider"
    >({
      query: (context) => `/api/website-reviews/prompt?context=${context}`,
    }),
    submitWebsiteReview: builder.mutation<
      ApiEnvelope<unknown>,
      { context: "client" | "provider"; rating: number; reviewText?: string }
    >({
      query: (payload) => ({
        url: "/api/website-reviews",
        method: "POST",
        body: payload,
      }),
    }),
    remindWebsiteReviewLater: builder.mutation<
      ApiEnvelope<{ context: "client" | "provider"; deferredUntilOrderCount?: number }>,
      { context: "client" | "provider" }
    >({
      query: (payload) => ({
        url: "/api/website-reviews/remind-later",
        method: "POST",
        body: payload,
      }),
    }),
    getPublicWebsiteReviews: builder.query<ApiEnvelope<PublicWebsiteReviewsResponse>, void>({
      query: () => "/api/website-reviews/public",
    }),
    requestForgotPasswordOtp: builder.mutation<
      ApiEnvelope<{ email: string; otpExpiresInMinutes: number }>,
      { email: string }
    >({
      query: (payload) => ({
        url: "/api/auth/forgot-password/request-otp",
        method: "POST",
        body: payload,
      }),
    }),
    verifyForgotPasswordOtp: builder.mutation<
      ApiEnvelope<{ email: string; resetToken: string }>,
      { email: string; otp: string }
    >({
      query: (payload) => ({
        url: "/api/auth/forgot-password/verify-otp",
        method: "POST",
        body: payload,
      }),
    }),
    resetForgotPassword: builder.mutation<
      ApiEnvelope<unknown>,
      { email: string; otp: string; resetToken: string; newPassword: string; confirmPassword: string }
    >({
      query: (payload) => ({
        url: "/api/auth/forgot-password/reset",
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useGetFaqsQuery,
  useGetCategoriesQuery,
  useGetPublicServicesQuery,
  useGetPublicServiceByIdQuery,
  useGetPublicProviderProfileQuery,
  useGetPublicProviderAvailabilityBlocksQuery,
  useGetClientDashboardQuery,
  useGetProviderDashboardQuery,
  useGetProviderRatingsQuery,
  useGetProviderAvailabilityBlocksQuery,
  useCreateProviderAvailabilityBlockMutation,
  useDeleteProviderAvailabilityBlockMutation,
  useGetClientServiceRequestsQuery,
  useGetProviderServiceRequestsQuery,
  useAcceptServiceRequestMutation,
  useRespondToAdminServiceRequestInvitationMutation,
  useIgnoreServiceRequestMutation,
  useGetClientOrdersQuery,
  useGetProviderOrdersQuery,
  useGetClientOrderDetailQuery,
  useGetProviderOrderDetailQuery,
  useCreateOrderMutation,
  useAcceptProviderOrderMutation,
  useDeclineProviderOrderMutation,
  useSubmitProviderDeliveryMutation,
  useRespondProviderRevisionMutation,
  useRequestClientRevisionMutation,
  useCancelClientRevisionMutation,
  useSendClientResolutionMessageMutation,
  useCreateClientCheckoutSessionMutation,
  useConfirmClientCheckoutPaymentMutation,
  useSubmitClientOrderReviewMutation,
  useFinalizeClientOrderMutation,
  useGetConversationsQuery,
  useEnsureConversationByOrderMutation,
  useStartProviderConversationMutation,
  useStartCustomOrderConversationMutation,
  useStartRepeatOrderConversationMutation,
  useGetConversationMessagesQuery,
  useSendConversationMessageMutation,
  useCreateCustomOrderProposalMutation,
  useRespondToCustomOrderProposalMutation,
  useMarkConversationMessagesAsReadMutation,
  useMarkAllMessagesAsReadMutation,
  useClearConversationHistoryMutation,
  useDeleteConversationsMutation,
  useBlockConversationUserMutation,
  useUnblockConversationUserMutation,
  useCreateServiceRequestMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useGetSavedServicesQuery,
  useSaveServiceMutation,
  useRemoveSavedServiceMutation,
  useGetMyWithdrawalsQuery,
  useRequestWithdrawalMutation,
  useCreateSupportMessageMutation,
  useGetMyGigsQuery,
  useLazyGetGigAnalyticsQuery,
  useCreateGigMutation,
  useUpdateGigMutation,
  useDeleteGigMutation,
  useDeleteGigRequestMutation,
  useLoginMutation,
  useLoginWithGoogleMutation,
  useLogoutMutation,
  useSignupMutation,
  useVerifySignupOtpMutation,
  useLazyGetWebsiteReviewPromptQuery,
  useSubmitWebsiteReviewMutation,
  useRemindWebsiteReviewLaterMutation,
  useGetPublicWebsiteReviewsQuery,
  useRequestForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetForgotPasswordMutation,
} = apiSlice;
