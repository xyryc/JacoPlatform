import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import authReducer from "@/src/store/slices/authSlice";
import locationReducer from "@/src/store/slices/locationSlice";
import notificationReducer from "@/src/store/slices/notificationSlice";
import { apiSlice } from "@/src/store/services/apiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    notifications: notificationReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
