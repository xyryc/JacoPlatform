import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isPersistentAuthSession,
  setAuthSession,
  updateStoredTokens,
} from '@/lib/authStorage';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type ProfilePayload = Record<string, unknown>;

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type GoogleLoginPayload = {
  idToken: string;
  role?: 'client' | 'provider';
};

type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'client' | 'provider';
};

type VerifySignupOtpPayload = {
  email: string;
  otp: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type VerifyForgotPasswordOtpPayload = {
  email: string;
  otp: string;
};

type ResetForgotPasswordPayload = {
  email: string;
  otp: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};

type WebsiteReviewContext = 'client' | 'provider';

type WebsiteReviewPromptResponse = {
  context: WebsiteReviewContext;
  currentOrderCount: number;
  submittedAt?: string | null;
  deferredOrderCount?: number;
  shouldPrompt: boolean;
};

type PublicWebsiteReviewsResponse = {
  stats?: {
    totalProviderWithdrawable?: number;
    activeVerifiedProviders?: number;
    sixMonthIncomeGrowthPercent?: number;
  };
  providerReviews?: Array<{
    id: string;
    reviewText?: string;
    websiteRating?: number;
    reviewer?: {
      id?: string;
      name?: string;
      avatar?: string;
      location?: string;
      sellerLevel?: string;
      providerRating?: number;
      monthlyIncome?: number;
    };
  }>;
  clientReviews?: Array<{
    id: string;
    reviewText?: string;
    websiteRating?: number;
    reviewer?: {
      id?: string;
      name?: string;
      avatar?: string;
      location?: string;
      monthlySpending?: number;
    };
  }>;
};

type CreateOrderPayload = {
  gigId: string;
  packageName: string;
  packageTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddress: string;
  specialInstructions?: string;
};

type ServiceRequestPayload = {
  categorySlug: string;
  categoryName: string;
  serviceAddress: string;
  description: string;
  preferredDate?: string;
  preferredTime: string;
  budget: number;
};

type ServiceRequestQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  radiusKm?: number;
};

type ProviderOrdersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

type ProviderAvailabilityBlock = {
  id: string;
  providerId?: string;
  scope: 'full_day' | 'time_slot';
  dateKey: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  recurrence?: 'none' | 'weekly';
  status?: 'active' | 'cancelled';
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ProviderPagedQuery = {
  page?: number;
  limit?: number;
};

type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type WithdrawalRequestPayload = {
  amount: number;
  note?: string;
};

type ClientOrdersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

type ProviderDashboardResponse = {
  revenue?: {
    totalEarnings?: number;
    walletBalance?: number;
    totalWithdrawn?: number;
  };
  orders?: {
    totalOrders?: number;
    pendingOrders?: number;
    activeOrders?: number;
    completedOrders?: number;
    completionRate?: number;
  };
  ratings?: {
    averageRating?: number;
    reviewCount?: number;
  };
  earningsAnalytics?: Array<{
    name?: string;
    earnings?: number;
  }>;
  pendingRequests?: Array<Record<string, unknown>>;
};

type ClientDashboardResponse = {
  orders?: {
    totalOrders?: number;
    activeOrders?: number;
    pendingOrders?: number;
    inProgressOrders?: number;
    underReviewOrders?: number;
    completedOrders?: number;
    completionRate?: number;
  };
  inbox?: {
    unreadMessages?: number;
  };
  recentOrders?: Array<Record<string, unknown>>;
};

type PublicProviderProfileResponse = {
  provider?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    email?: string;
    phone?: string;
    address?: string;
    bio?: string;
    experienceLevel?: string;
    sellerLevel?: string;
    level?: string;
    rating?: number;
    reviewCount?: number;
    completedOrders?: number;
    totalOrders?: number;
    completionRate?: number;
    recommendRate?: number;
    location?: string;
    joinedAt?: string;
  };
  gigs?: Array<{
    id?: string;
    title?: string;
    categoryName?: string;
    categorySlug?: string;
    images?: string[];
    startingPrice?: number;
    avgPackagePrice?: number;
    provider?: {
      id?: string;
      name?: string;
      avatar?: string;
      rating?: number;
      sellerLevel?: string;
      level?: string;
    };
  }>;
  reviews?: Array<{
    id?: string;
    orderId?: string;
    gigId?: string | null;
    gigName?: string;
    rating?: number;
    review?: string;
    createdAt?: string | null;
    client?: {
      id?: string;
      name?: string;
      avatar?: string;
    };
  }>;
  performance?: {
    responseRate?: number;
    deliveredOnTime?: number;
    orderCompletion?: number;
  };
  skills?: string[];
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  isActive?: boolean;
  sortOrder?: number;
};

type ServiceRequestPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type GigAnalyticsResponse = {
  gig?: {
    id?: string;
    title?: string;
    status?: string;
  };
  summary?: {
    totalIncome?: number;
    completedPaidOrders?: number;
    periodDays?: number;
  };
  detailViewSeries?: Array<{
    date?: string;
    label?: string;
    earnings?: number;
  }>;
};

const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    headers.set('Accept', 'application/json');
    headers.set('ngrok-skip-browser-warning', 'true');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        const refreshResult = await rawBaseQuery(
          {
            url: '/api/auth/refresh-token',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        const refreshPayload = refreshResult.data as
          | ApiEnvelope<{ accessToken: string; refreshToken: string }>
          | undefined;

        if (refreshPayload?.success && refreshPayload.data?.accessToken) {
          const currentUser = getStoredUser();
          if (currentUser) {
            setAuthSession({
              accessToken: refreshPayload.data.accessToken,
              refreshToken: refreshPayload.data.refreshToken || refreshToken,
              user: currentUser,
              persistent: isPersistentAuthSession(),
            });
          } else {
            updateStoredTokens({
              accessToken: refreshPayload.data.accessToken,
              refreshToken: refreshPayload.data.refreshToken || refreshToken,
            });
          }
          return rawBaseQuery(args, api, extraOptions);
        }
      }

      clearAuthSession();
    }

    return result;
  },
  tagTypes: ['Profile', 'Gigs', 'Categories', 'Orders', 'Chats', 'ServiceRequests', 'Availability'],
  endpoints: (builder) => ({
    getFaqs: builder.query<ApiEnvelope<FaqItem[]>, void>({
      query: () => '/api/faqs',
    }),
    getCategories: builder.query<ApiEnvelope<unknown[]>, void>({
      query: () => '/api/categories',
      providesTags: ['Categories'],
    }),
    getMyGigs: builder.query<ApiEnvelope<{ publishedGigs?: unknown[]; pendingRequests?: unknown[] }>, void>({
      query: () => '/api/gigs/mine',
      providesTags: ['Gigs'],
    }),
    getPublicServices: builder.query<
      ApiEnvelope<{
        items?: unknown[];
        pagination?: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>,
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
        categorySlug = 'all',
        search = '',
        zipCode = '',
        lat = null,
        lng = null,
      }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('radiusKm', String(radiusKm));
        params.set('requireCoverage', String(requireCoverage));
        params.set('categorySlug', categorySlug || 'all');
        if (search.trim()) params.set('search', search.trim());
        if (zipCode.trim()) params.set('zipCode', zipCode.trim());
        if (typeof lat === 'number') params.set('lat', String(lat));
        if (typeof lng === 'number') params.set('lng', String(lng));
        return `/api/gigs/public?${params.toString()}`;
      },
    }),
    getPublicServiceById: builder.query<ApiEnvelope<unknown>, string>({
      query: (id) => `/api/gigs/public/${id}`,
    }),
    trackGigImpressions: builder.mutation<ApiEnvelope<{ trackedGigIds?: string[] }>, string[]>({
      query: (gigIds) => ({
        url: '/api/gigs/analytics/impressions',
        method: 'POST',
        body: { gigIds },
      }),
    }),
    trackGigDetailView: builder.mutation<ApiEnvelope<{ tracked?: boolean }>, string>({
      query: (id) => ({
        url: `/api/gigs/public/${id}/view`,
        method: 'POST',
      }),
    }),
    getGigAnalytics: builder.query<ApiEnvelope<GigAnalyticsResponse>, string>({
      query: (id) => `/api/gigs/${id}/analytics`,
    }),
    getPublicProviderProfile: builder.query<ApiEnvelope<PublicProviderProfileResponse>, string>({
      query: (providerId) => `/api/profile/provider/${providerId}/public`,
    }),
    getPublicProviderAvailabilityBlocks: builder.query<
      ApiEnvelope<{ items?: ProviderAvailabilityBlock[] }>,
      { providerId: string; from?: string; to?: string }
    >({
      query: ({ providerId, from = '', to = '' }) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return `/api/orders/availability/provider/${providerId}?${params.toString()}`;
      },
      providesTags: ['Availability'],
    }),
    createOrder: builder.mutation<ApiEnvelope<{ order?: Record<string, unknown> }>, CreateOrderPayload>({
      query: (payload) => ({
        url: '/api/orders',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Orders'],
    }),
    createServiceRequest: builder.mutation<ApiEnvelope<{ request?: Record<string, unknown> }>, FormData>({
      query: (formData) => ({
        url: '/api/service-requests',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ServiceRequests', 'Orders'],
    }),
    getClientServiceRequests: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        pagination?: ServiceRequestPagination;
      }>,
      ServiceRequestQuery
    >({
      query: ({ page = 1, limit = 6, search = '', status = 'all' }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('status', status || 'all');
        if (search.trim()) params.set('search', search.trim());
        return `/api/service-requests/client?${params.toString()}`;
      },
      providesTags: ['ServiceRequests'],
    }),
    getProviderServiceRequests: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        pagination?: ServiceRequestPagination;
      }>,
      ServiceRequestQuery
    >({
      query: ({ page = 1, limit = 6, search = '', radiusKm = 30 }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('radiusKm', String(radiusKm));
        if (search.trim()) params.set('search', search.trim());
        return `/api/service-requests/provider?${params.toString()}`;
      },
      providesTags: ['ServiceRequests'],
    }),
    acceptServiceRequest: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/service-requests/provider/${id}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: ['ServiceRequests', 'Orders'],
    }),
    respondToAdminServiceRequestInvitation: builder.mutation<
      ApiEnvelope<{ request?: Record<string, unknown>; conversationId?: string }>,
      { id: string; action: 'accept' | 'decline' }
    >({
      query: ({ id, action }) => ({
        url: `/api/service-requests/provider/${id}/admin-invitation/respond`,
        method: 'PATCH',
        body: { action },
      }),
      invalidatesTags: ['ServiceRequests', 'Orders', 'Chats'],
    }),
    ignoreServiceRequest: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/service-requests/provider/${id}/ignore`,
        method: 'PATCH',
      }),
      invalidatesTags: ['ServiceRequests'],
    }),
    getProviderOrders: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        pagination?: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>,
      ProviderOrdersQuery
    >({
      query: ({ page = 1, limit = 8, search = '', status = 'all' }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('status', status || 'all');
        if (search.trim()) params.set('search', search.trim());
        return `/api/orders/provider?${params.toString()}`;
      },
      providesTags: ['Orders'],
    }),
    getProviderDashboard: builder.query<ApiEnvelope<ProviderDashboardResponse>, void>({
      query: () => '/api/orders/provider/dashboard',
      providesTags: ['Orders', 'Profile'],
    }),
    getProviderRevenueHistory: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        summary?: {
          totalEarnings?: number;
          totalPaid?: number;
          totalPlatformFees?: number;
          paidOrders?: number;
        };
        pagination?: Pagination;
      }>,
      ProviderPagedQuery | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        params.set('page', String(args?.page ?? 1));
        params.set('limit', String(args?.limit ?? 8));
        return `/api/orders/provider/revenue?${params.toString()}`;
      },
      providesTags: ['Orders', 'Profile'],
    }),
    getProviderRatings: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        summary?: {
          averageRating?: number;
          reviewCount?: number;
        };
        pagination?: Pagination;
      }>,
      ProviderPagedQuery | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        params.set('page', String(args?.page ?? 1));
        params.set('limit', String(args?.limit ?? 8));
        return `/api/orders/provider/ratings?${params.toString()}`;
      },
      providesTags: ['Orders', 'Profile'],
    }),
    getProviderAvailabilityBlocks: builder.query<
      ApiEnvelope<{ items?: ProviderAvailabilityBlock[] }>,
      { from?: string; to?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.from) params.set('from', args.from);
        if (args?.to) params.set('to', args.to);
        return `/api/orders/provider/availability-blocks?${params.toString()}`;
      },
      providesTags: ['Availability'],
    }),
    createProviderAvailabilityBlock: builder.mutation<
      ApiEnvelope<{ block?: ProviderAvailabilityBlock }>,
      {
        dateKey: string;
        scope: 'full_day' | 'time_slot';
        startTime?: string;
        endTime?: string;
        note?: string;
        recurrence?: 'none' | 'weekly';
      }
    >({
      query: (payload) => ({
        url: '/api/orders/provider/availability-blocks',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Availability'],
    }),
    deleteProviderAvailabilityBlock: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/provider/availability-blocks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Availability'],
    }),
    getClientDashboard: builder.query<ApiEnvelope<ClientDashboardResponse>, void>({
      query: () => '/api/orders/client/dashboard',
      providesTags: ['Orders', 'Chats', 'Profile'],
    }),
    getClientOrders: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        pagination?: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>,
      ClientOrdersQuery
    >({
      query: ({ page = 1, limit = 8, search = '', status = 'all' }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        params.set('status', status || 'all');
        if (search.trim()) params.set('search', search.trim());
        return `/api/orders/client?${params.toString()}`;
      },
      providesTags: ['Orders'],
    }),
    getClientOrderDetail: builder.query<ApiEnvelope<{ order?: Record<string, unknown> }>, string>({
      query: (id) => `/api/orders/client/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
    }),
    getProviderOrderDetail: builder.query<ApiEnvelope<{ order?: Record<string, unknown> }>, string>({
      query: (id) => `/api/orders/provider/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
    }),
    acceptProviderOrder: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/provider/${id}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Orders'],
    }),
    declineProviderOrder: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/provider/${id}/decline`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Orders'],
    }),
    submitProviderDelivery: builder.mutation<ApiEnvelope<unknown>, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/api/orders/provider/${id}/deliver`,
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: ['Orders'],
    }),
    respondProviderRevision: builder.mutation<
      ApiEnvelope<unknown>,
      { id: string; action: 'accept' | 'decline'; note?: string }
    >({
      query: ({ id, action, note = '' }) => ({
        url: `/api/orders/provider/${id}/revision-response`,
        method: 'PATCH',
        body: { action, note },
      }),
      invalidatesTags: ['Orders'],
    }),
    requestClientRevision: builder.mutation<ApiEnvelope<unknown>, { id: string; note: string }>({
      query: ({ id, note }) => ({
        url: `/api/orders/client/${id}/request-revision`,
        method: 'PATCH',
        body: { note },
      }),
      invalidatesTags: ['Orders'],
    }),
    cancelClientRevision: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/client/${id}/cancel-revision`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Orders'],
    }),
    sendClientResolutionMessage: builder.mutation<ApiEnvelope<{ conversationId?: string }>, { id: string; text?: string }>({
      query: ({ id, text = '' }) => ({
        url: `/api/orders/client/${id}/resolution-message`,
        method: 'POST',
        body: { text },
      }),
    }),
    createClientCheckoutSession: builder.mutation<
      ApiEnvelope<{ checkoutUrl?: string; sessionId?: string }>,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/api/orders/client/${id}/stripe-checkout`,
        method: 'POST',
      }),
      invalidatesTags: ['Orders'],
    }),
    confirmClientCheckoutPayment: builder.mutation<
      ApiEnvelope<{ order?: Record<string, unknown>; providerEarningsAmount?: number; platformFeeAmount?: number }>,
      { id: string; sessionId: string; clientRating?: number; clientReview?: string }
    >({
      query: ({ id, sessionId, clientRating, clientReview }) => ({
        url: `/api/orders/client/${id}/stripe-confirm`,
        method: 'POST',
        body: { sessionId, clientRating, clientReview },
      }),
      invalidatesTags: ['Orders', 'Profile'],
    }),
    submitClientOrderReview: builder.mutation<
      ApiEnvelope<{ order?: Record<string, unknown> }>,
      { id: string; rating: number; review?: string }
    >({
      query: ({ id, rating, review }) => ({
        url: `/api/orders/client/${id}/review`,
        method: 'POST',
        body: { rating, review },
      }),
      invalidatesTags: ['Orders', 'Profile'],
    }),
    getMyWithdrawals: builder.query<
      ApiEnvelope<{
        balance?: {
          availableBalance?: number;
          pendingWithdrawalAmount?: number;
          totalEarnings?: number;
          totalWithdrawn?: number;
        };
        withdrawals?: Record<string, unknown>[];
        pagination?: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && typeof args === 'object') {
          params.set('page', String(args.page ?? 1));
          params.set('limit', String(args.limit ?? 8));
          if (args.status) params.set('status', args.status);
        } else {
          params.set('page', '1');
          params.set('limit', '8');
        }
        return `/api/withdrawals/me?${params.toString()}`;
      },
      providesTags: ['Profile'],
    }),
    requestWithdrawal: builder.mutation<ApiEnvelope<unknown>, WithdrawalRequestPayload>({
      query: (payload) => ({
        url: '/api/withdrawals/me/request',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Profile'],
    }),
    finalizeClientOrder: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/orders/client/${id}/finalize`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Orders'],
    }),
    getConversations: builder.query<ApiEnvelope<Record<string, unknown>[]>, void>({
      query: () => '/api/chats/conversations',
      providesTags: ['Chats'],
    }),
    ensureConversationByOrder: builder.mutation<ApiEnvelope<Record<string, unknown>>, string>({
      query: (orderId) => ({
        url: `/api/chats/conversations/order/${orderId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Chats'],
    }),
    startProviderConversation: builder.mutation<
      ApiEnvelope<{ conversation?: Record<string, unknown> }>,
      { providerId: string; gigId: string }
    >({
      query: (payload) => ({
        url: '/api/chats/conversations/provider/start',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Chats'],
    }),
    startCustomOrderConversation: builder.mutation<
      ApiEnvelope<{ conversation?: Record<string, unknown>; message?: Record<string, unknown> }>,
      { providerId: string; gigId: string }
    >({
      query: (payload) => ({
        url: '/api/chats/conversations/custom-order/start',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Chats'],
    }),
    startRepeatOrderConversation: builder.mutation<
      ApiEnvelope<{ conversation?: Record<string, unknown>; message?: Record<string, unknown> }>,
      { sourceOrderId: string }
    >({
      query: (payload) => ({
        url: '/api/chats/conversations/repeat-order/start',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Chats'],
    }),
    getConversationMessages: builder.query<
      ApiEnvelope<{
        items?: Record<string, unknown>[];
        pagination?: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>,
      { conversationId: string; page?: number; limit?: number }
    >({
      query: ({ conversationId, page = 1, limit = 100 }) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        return `/api/chats/conversations/${conversationId}/messages?${params.toString()}`;
      },
      providesTags: (_result, _error, arg) => [{ type: 'Chats', id: arg.conversationId }],
    }),
    sendConversationMessage: builder.mutation<
      ApiEnvelope<Record<string, unknown>>,
      { conversationId: string; text?: string; attachments?: File[] }
    >({
      query: ({ conversationId, text = '', attachments = [] }) => {
        const formData = new FormData();
        formData.append('text', text);
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });
        return {
          url: `/api/chats/conversations/${conversationId}/messages`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, arg) => [{ type: 'Chats', id: arg.conversationId }, 'Chats'],
    }),
    createCustomOrderProposal: builder.mutation<
      ApiEnvelope<Record<string, unknown>>,
      {
        conversationId: string;
        gigId?: string;
        proposalType?: 'custom' | 'repeat_order';
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
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: 'Chats', id: arg.conversationId }, 'Chats', 'Orders'],
    }),
    respondToCustomOrderProposal: builder.mutation<
      ApiEnvelope<{ message?: Record<string, unknown>; order?: { id?: string; orderNumber?: string } | null }>,
      { proposalId: string; action: 'accept' | 'decline' }
    >({
      query: ({ proposalId, action }) => ({
        url: `/api/chats/custom-order-proposals/${proposalId}/respond`,
        method: 'PATCH',
        body: { action },
      }),
      invalidatesTags: ['Chats', 'Orders'],
    }),
    clearConversationHistory: builder.mutation<ApiEnvelope<{ deletedCount?: number }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/messages`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: 'Chats', id: conversationId }, 'Chats'],
    }),
    deleteConversations: builder.mutation<ApiEnvelope<{ modifiedCount?: number }>, string[]>({
      query: (conversationIds) => ({
        url: '/api/chats/conversations',
        method: 'DELETE',
        body: { conversationIds },
      }),
      invalidatesTags: ['Chats'],
    }),
    blockConversationUser: builder.mutation<ApiEnvelope<{ blockedBy?: string }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/block`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: 'Chats', id: conversationId }, 'Chats'],
    }),
    unblockConversationUser: builder.mutation<ApiEnvelope<{ blockedBy?: string | null }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/block`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: 'Chats', id: conversationId }, 'Chats'],
    }),
    markConversationMessagesAsRead: builder.mutation<ApiEnvelope<{ modifiedCount?: number }>, string>({
      query: (conversationId) => ({
        url: `/api/chats/conversations/${conversationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, conversationId) => [{ type: 'Chats', id: conversationId }, 'Chats'],
    }),
    markAllMessagesAsRead: builder.mutation<ApiEnvelope<{ modifiedCount?: number }>, void>({
      query: () => ({
        url: '/api/chats/conversations/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Chats'],
    }),
    createGig: builder.mutation<ApiEnvelope<unknown>, FormData>({
      query: (formData) => ({
        url: '/api/gigs',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Gigs'],
    }),
    updateGig: builder.mutation<ApiEnvelope<unknown>, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/api/gigs/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Gigs'],
    }),
    deleteGig: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/gigs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gigs'],
    }),
    deleteGigRequest: builder.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/api/gigs/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gigs'],
    }),
    updateProfile: builder.mutation<ApiEnvelope<{ user?: Record<string, unknown> }>, ProfilePayload>({
      query: (payload) => ({
        url: '/api/profile/me',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Profile'],
    }),
    uploadAvatar: builder.mutation<ApiEnvelope<{ avatarUrl?: string; user?: Record<string, unknown> }>, FormData>({
      query: (formData) => ({
        url: '/api/profile/avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Profile'],
    }),
    changePassword: builder.mutation<ApiEnvelope<unknown>, ChangePasswordPayload>({
      query: (payload) => ({
        url: '/api/profile/change-password',
        method: 'POST',
        body: payload,
      }),
    }),
    getSavedServices: builder.query<ApiEnvelope<{ items?: Record<string, unknown>[] }>, void>({
      query: () => '/api/profile/me/saved-services',
      providesTags: ['Profile'],
    }),
    saveService: builder.mutation<ApiEnvelope<{ user?: Record<string, unknown> }>, string>({
      query: (gigId) => ({
        url: `/api/profile/me/saved-services/${gigId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Profile'],
    }),
    removeSavedService: builder.mutation<ApiEnvelope<{ user?: Record<string, unknown> }>, string>({
      query: (gigId) => ({
        url: `/api/profile/me/saved-services/${gigId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Profile'],
    }),
    submitProviderPayoutInfo: builder.mutation<ApiEnvelope<{ user?: Record<string, unknown> }>, FormData>({
      query: (formData) => ({
        url: '/api/profile/provider/payout-info',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Profile'],
    }),
    login: builder.mutation<ApiEnvelope<unknown>, LoginPayload>({
      query: (payload) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: payload,
      }),
    }),
    deleteAccount: builder.mutation<ApiEnvelope<unknown>, void>({
      query: () => ({
        url: '/api/profile/me',
        method: 'DELETE',
      }),
    }),
    loginWithGoogle: builder.mutation<ApiEnvelope<unknown>, GoogleLoginPayload>({
      query: (payload) => ({
        url: '/api/auth/google',
        method: 'POST',
        body: payload,
      }),
    }),
    signup: builder.mutation<ApiEnvelope<unknown>, SignupPayload>({
      query: (payload) => ({
        url: '/api/auth/signup',
        method: 'POST',
        body: payload,
      }),
    }),
    verifySignupOtp: builder.mutation<ApiEnvelope<unknown>, VerifySignupOtpPayload>({
      query: (payload) => ({
        url: '/api/auth/verify-signup-otp',
        method: 'POST',
        body: payload,
      }),
    }),
    getWebsiteReviewPrompt: builder.query<ApiEnvelope<WebsiteReviewPromptResponse>, WebsiteReviewContext>({
      query: (context) => `/api/website-reviews/prompt?context=${context}`,
    }),
    submitWebsiteReview: builder.mutation<
      ApiEnvelope<unknown>,
      { context: WebsiteReviewContext; rating: number; reviewText?: string }
    >({
      query: (payload) => ({
        url: '/api/website-reviews',
        method: 'POST',
        body: payload,
      }),
    }),
    remindWebsiteReviewLater: builder.mutation<
      ApiEnvelope<{ context: WebsiteReviewContext; deferredUntilOrderCount?: number }>,
      { context: WebsiteReviewContext }
    >({
      query: (payload) => ({
        url: '/api/website-reviews/remind-later',
        method: 'POST',
        body: payload,
      }),
    }),
    getPublicWebsiteReviews: builder.query<ApiEnvelope<PublicWebsiteReviewsResponse>, void>({
      query: () => '/api/website-reviews/public',
    }),
    requestForgotPasswordOtp: builder.mutation<
      ApiEnvelope<{ email: string; otpExpiresInMinutes: number }>,
      ForgotPasswordPayload
    >({
      query: (payload) => ({
        url: '/api/auth/forgot-password/request-otp',
        method: 'POST',
        body: payload,
      }),
    }),
    verifyForgotPasswordOtp: builder.mutation<
      ApiEnvelope<{ email: string; resetToken: string }>,
      VerifyForgotPasswordOtpPayload
    >({
      query: (payload) => ({
        url: '/api/auth/forgot-password/verify-otp',
        method: 'POST',
        body: payload,
      }),
    }),
    resetForgotPassword: builder.mutation<ApiEnvelope<unknown>, ResetForgotPasswordPayload>({
      query: (payload) => ({
        url: '/api/auth/forgot-password/reset',
        method: 'POST',
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetFaqsQuery,
  useGetCategoriesQuery,
  useLazyGetPublicServicesQuery,
  useLazyGetMyGigsQuery,
  useGetPublicServicesQuery,
  useGetPublicServiceByIdQuery,
  useTrackGigImpressionsMutation,
  useTrackGigDetailViewMutation,
  useLazyGetGigAnalyticsQuery,
  useGetPublicProviderProfileQuery,
  useGetPublicProviderAvailabilityBlocksQuery,
  useCreateOrderMutation,
  useCreateServiceRequestMutation,
  useGetClientServiceRequestsQuery,
  useGetProviderServiceRequestsQuery,
  useAcceptServiceRequestMutation,
  useRespondToAdminServiceRequestInvitationMutation,
  useIgnoreServiceRequestMutation,
  useGetProviderOrdersQuery,
  useGetProviderDashboardQuery,
  useGetProviderRevenueHistoryQuery,
  useGetProviderRatingsQuery,
  useGetProviderAvailabilityBlocksQuery,
  useCreateProviderAvailabilityBlockMutation,
  useDeleteProviderAvailabilityBlockMutation,
  useGetClientDashboardQuery,
  useGetClientOrdersQuery,
  useGetClientOrderDetailQuery,
  useGetProviderOrderDetailQuery,
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
  useGetMyWithdrawalsQuery,
  useRequestWithdrawalMutation,
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
  useClearConversationHistoryMutation,
  useDeleteConversationsMutation,
  useBlockConversationUserMutation,
  useUnblockConversationUserMutation,
  useMarkConversationMessagesAsReadMutation,
  useMarkAllMessagesAsReadMutation,
  useCreateGigMutation,
  useUpdateGigMutation,
  useDeleteGigMutation,
  useDeleteGigRequestMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useGetSavedServicesQuery,
  useSaveServiceMutation,
  useRemoveSavedServiceMutation,
  useSubmitProviderPayoutInfoMutation,
  useLoginMutation,
  useLoginWithGoogleMutation,
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
