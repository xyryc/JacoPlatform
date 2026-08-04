export const formatCurrency = (value?: number | null) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDateLabel = (value?: string | null) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const parseScheduleTime = (value?: string | null) => {
  const time = String(value || "").trim().toUpperCase();
  if (!time) return null;

  const amPmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = Number(amPmMatch[2]);
    const period = amPmMatch[3];
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }
    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;
    return { hours, minutes };
  }

  const twentyFourHourMatch = time.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    return { hours, minutes };
  }

  return null;
};

export const formatTimeLabel = (value?: string | null) => {
  const parsedTime = parseScheduleTime(value);
  if (!parsedTime) return "Time not set";

  const period = parsedTime.hours >= 12 ? "PM" : "AM";
  const hour12 = parsedTime.hours % 12 || 12;
  const minutes = String(parsedTime.minutes).padStart(2, "0");
  return `${hour12}:${minutes} ${period}`;
};

export const getScheduledDateTimeMs = (scheduledDate?: string | null, scheduledTime?: string | null) => {
  const date = new Date(String(scheduledDate || ""));
  const time = parseScheduleTime(scheduledTime);
  if (Number.isNaN(date.getTime()) || !time) return Number.MAX_SAFE_INTEGER;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  ).getTime();
};

const UPCOMING_ORDER_STATUSES = new Set([
  "pending",
  "accepted",
  "accepting_delivery",
  "revision_requested",
  "under_revision",
  "after_sell_revision_requested",
  "under_after_sell_revision",
]);

export const sortOrdersByScheduledAppointment = <
  T extends {
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    status?: string | null;
    createdAt?: string | null;
    id?: string | null;
    orderNumber?: string | null;
  },
>(
  orders: T[]
) => {
  const nowMs = Date.now();
  return [...orders].sort((left, right) => {
    const leftScheduledAt = getScheduledDateTimeMs(left.scheduledDate, left.scheduledTime);
    const rightScheduledAt = getScheduledDateTimeMs(right.scheduledDate, right.scheduledTime);
    const leftUpcoming = leftScheduledAt >= nowMs && UPCOMING_ORDER_STATUSES.has(String(left.status || ""));
    const rightUpcoming = rightScheduledAt >= nowMs && UPCOMING_ORDER_STATUSES.has(String(right.status || ""));

    if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1;
    if (leftScheduledAt !== rightScheduledAt) {
      return leftUpcoming ? leftScheduledAt - rightScheduledAt : rightScheduledAt - leftScheduledAt;
    }

    const leftCreatedAt = new Date(String(left.createdAt || 0)).getTime() || 0;
    const rightCreatedAt = new Date(String(right.createdAt || 0)).getTime() || 0;
    if (leftCreatedAt !== rightCreatedAt) return rightCreatedAt - leftCreatedAt;

    return String(left.orderNumber || left.id || "").localeCompare(String(right.orderNumber || right.id || ""));
  });
};

export const formatStatusLabel = (value?: string | null) => {
  const raw = String(value || "").trim().toLowerCase();
  const statusMap: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    accepting_delivery: "Accepting Delivery",
    revision_requested: "Request Revision",
    under_revision: "Under Revision",
    after_sell_revision_requested: "After-Sale Revision",
    under_after_sell_revision: "Under After-Sale Revision",
    done_after_sell_revision: "Done After-Sale Revision",
    completed: "Completed",
    declined: "Declined",
    cancelled: "Cancelled",
    open: "Open",
  };

  if (statusMap[raw]) return statusMap[raw];

  const normalized = raw.replace(/_/g, " ").trim();

  if (!normalized) return "Unknown";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const getInitials = (name?: string | null) => {
  const parts = String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "NA";
};
