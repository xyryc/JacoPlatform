import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface LiveNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  unread: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
}

type NotificationState = {
  items: LiveNotification[];
  socketConnected: boolean;
};

const initialState: NotificationState = {
  items: [],
  socketConnected: false,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    hydrateNotifications: (state, action: PayloadAction<LiveNotification[]>) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },
    addNotification: (state, action: PayloadAction<LiveNotification>) => {
      state.items = [
        action.payload,
        ...state.items.filter((item) => item.id !== action.payload.id),
      ];
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      state.items = state.items.map((item) =>
        item.id === action.payload ? { ...item, unread: false } : item
      );
    },
    markAllNotificationsAsRead: (state) => {
      state.items = state.items.map((item) => ({ ...item, unread: false }));
    },
    clearNotifications: (state) => {
      state.items = [];
    },
    setSocketConnectedState: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
  },
});

export const {
  hydrateNotifications,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setSocketConnectedState,
} = notificationSlice.actions;
export default notificationSlice.reducer;
