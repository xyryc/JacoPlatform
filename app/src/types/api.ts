export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "client" | "provider" | "superAdmin";
  avatar?: string;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  businessBio?: string;
  experienceLevel?: string;
  serviceCity?: string;
  serviceLocationLat?: number | null;
  serviceLocationLng?: number | null;
  sellerLevel?: string;
  averageRating?: number;
  reviewCount?: number;
  payoutVerificationStatus?: string;
  savedServiceIds?: string[];
  walletBalance?: number;
  totalEarnings?: number;
  totalWithdrawn?: number;
  payoutInfo?: {
    accountHolderName?: string;
    bankAccountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountType?: "checking" | "savings" | "";
    nidFrontImageUrl?: string;
    nidBackImageUrl?: string;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: string;
  };
};

export type LoginResponse = ApiEnvelope<{
  accessToken: string;
  refreshToken: string;
  user: AppUser;
}>;

export type WebsiteReviewContext = "client" | "provider";

export type WebsiteReviewPromptResponse = {
  context: WebsiteReviewContext;
  currentOrderCount: number;
  submittedAt?: string | null;
  deferredOrderCount?: number;
  shouldPrompt: boolean;
};

export type PublicWebsiteReviewsResponse = {
  providerReviews?: {
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
  }[];
  clientReviews?: {
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
  }[];
};

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export type PublicServiceCard = {
  id: string;
  slug?: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  expertType: "solo" | "team";
  image: string;
  videos?: string[];
  baseCity: string;
  zipCode?: string;
  avgPackagePrice: number;
  distanceKm?: number | null;
  providerTravelRadiusKm?: number | null;
  provider: {
    id: string;
    name: string;
    avatar?: string;
    level?: string;
    sellerLevel?: string;
    rating?: number;
    reviewCount?: number;
  };
};

export type PublicServiceDetail = {
  id: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  requirements: string;
  images: string[];
  videos?: string[];
  baseCity: string;
  avgPackagePrice: number;
  packages: {
    name: string;
    title: string;
    description: string;
    deliveryTime: string;
    deliveryTimeUnit?: string;
    price: number;
  }[];
  provider: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
    level?: string;
    rating?: number;
    reviewCount?: number;
  };
  reviews: {
    id: string;
    rating: number;
    review: string;
    createdAt?: string | null;
    client: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
};

export type ProviderAvailabilityBlock = {
  id: string;
  providerId?: string;
  scope: "full_day" | "time_slot";
  dateKey: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  recurrence?: "none" | "weekly";
  status?: "active" | "cancelled";
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PublicProviderProfile = {
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
  gigs?: {
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
  }[];
  reviews?: {
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
  }[];
  performance?: {
    responseRate?: number;
    deliveredOnTime?: number;
    orderCompletion?: number;
  };
  skills?: string[];
};

export type GigAnalyticsResponse = {
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
  detailViewSeries?: {
    date?: string;
    label?: string;
    earnings?: number;
  }[];
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  conversationId?: string | null;
  repeatRootOrderId?: string | null;
  repeatSourceOrderId?: string | null;
  repeatIteration?: number;
  repeatOrderCount?: number;
  canRequestRepeatOrder?: boolean;
  orderName: string;
  categoryName: string;
  status: string;
  packageName?: string;
  packageTitle?: string;
  packagePrice: number;
  scheduledDate?: string | null;
  scheduledTime?: string;
  serviceAddress?: string;
  specialInstructions?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  platformFeeAmount?: number;
  providerEarningsAmount?: number;
  listedPrice?: number;
  customerPaidAmount?: number;
  adminFeeAmount?: number;
  providerNetAmount?: number;
  deliveryImages?: string[];
  deliveryNote?: string;
  revisionRequestNote?: string;
  clientRating?: number | null;
  clientReview?: string;
  revisionResponseNote?: string;
  revisionRequestedAt?: string | null;
  revisionRespondedAt?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  isRequestedOrder?: boolean;
  client: {
    id: string;
    name: string;
    avatar?: string;
    address?: string;
    phone?: string;
  };
  provider: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    sellerLevel?: string;
  };
  gig: {
    id: string;
    title: string;
    images: string[];
  };
};

export type DashboardData = {
  revenue?: {
    totalEarnings?: number;
    walletBalance?: number;
    totalWithdrawn?: number;
  };
  sellerLevel?: string;
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
  earningsAnalytics?: {
    name?: string;
    earnings?: number;
  }[];
  pendingRequests?: Record<string, unknown>[];
};

export type ClientDashboardData = {
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
  recentOrders?: Record<string, unknown>[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WithdrawalSummary = {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  note?: string;
  requestedAt?: string | null;
  reviewedAt?: string | null;
  processedAt?: string | null;
};

export type WithdrawalBalance = {
  availableBalance?: number;
  pendingWithdrawalAmount?: number;
  totalEarnings?: number;
  totalWithdrawn?: number;
};

export type SupportMessage = {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  resolvedAt?: string | null;
};

export type ServiceRequestSummary = {
  id: string;
  requestNumber: string;
  categorySlug: string;
  categoryName: string;
  requestSource?: "existing_category" | "custom_category";
  requestType?: "custom" | "matched";
  customCategoryName?: string;
  customCategoryDescription?: string;
  customCategoryApprovalStatus?: "not_requested" | "pending" | "approved" | "rejected";
  customCategoryRequestedAt?: string | null;
  customCategoryReviewedAt?: string | null;
  customCategoryRejectionReason?: string;
  pendingAdminCategoryApproval?: boolean;
  serviceAddress: string;
  serviceLocationLat?: number | null;
  serviceLocationLng?: number | null;
  description: string;
  preferredDate?: string | null;
  preferredTime: string;
  budget: number;
  imageUrls?: string[];
  status: "open" | "accepted" | "cancelled";
  acceptedAt?: string | null;
  acceptedVia?: "direct" | "admin_invitation" | "";
  distanceKm?: number | null;
  adminRequestedForViewer?: boolean;
  adminInvitationStatus?: "pending" | "accepted" | "declined" | "expired" | "unavailable" | "";
  adminInvitedAt?: string | null;
  assignedToOtherProvider?: boolean;
  pendingInvitationCount?: number;
  client: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  acceptedProvider?: {
    id: string;
    name: string;
    avatar?: string;
    sellerLevel?: string;
    rating?: number;
  } | null;
  linkedOrderId?: string | null;
  linkedOrderNumber?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ConversationSummary = {
  id: string;
  orderId?: string | null;
  gigId?: string | null;
  serviceRequestId?: string | null;
  orderNumber?: string;
  orderName?: string;
  orderStatus?: string;
  packageTitle?: string;
  categoryName?: string;
  blockedBy?: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  otherUser: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
};

export type CustomOrderProposal = {
  id: string;
  conversationId?: string | null;
  serviceRequestId?: string | null;
  gigId?: string | null;
  clientId?: string | null;
  providerId?: string | null;
  proposalType?: "custom" | "repeat_order";
  sourceOrderId?: string | null;
  repeatRootOrderId?: string | null;
  repeatIteration?: number;
  title: string;
  description?: string;
  price: number;
  serviceAddress: string;
  scheduledDate?: string | null;
  scheduledTime: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  respondedAt?: string | null;
  createdOrderId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  orderId?: string | null;
  senderId: string;
  receiverId: string;
  text: string;
  messageType?: "text" | "custom_order_proposal" | "system";
  attachments: {
    url: string;
    fileName?: string;
    mimeType?: string;
    resourceType?: string;
  }[];
  customOrderProposal?: CustomOrderProposal | null;
  createdAt: string;
  readAt?: string | null;
};
