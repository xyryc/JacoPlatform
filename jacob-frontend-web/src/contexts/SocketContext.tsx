'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addNotification,
  clearNotifications as clearNotificationsAction,
  hydrateNotifications,
  LiveNotification,
  markAllNotificationsAsRead as markAllNotificationsAsReadAction,
  setSocketConnectedState,
} from '@/store/slices/notificationSlice';
import { getAccessToken, getActiveAuthStorageKind } from '@/lib/authStorage';

type SocketContextValue = {
  socketConnected: boolean;
  notifications: LiveNotification[];
  unreadCount: number;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);
const LEGACY_NOTIFICATIONS_STORAGE_KEY = 'live_notifications';
const PENDING_INCOMING_CALL_STORAGE_KEY = 'pending_incoming_call';

type CallInvite = {
  conversationId: string;
  targetUserId?: string;
  callType: 'voice' | 'video';
  offer?: RTCSessionDescriptionInit;
  senderId?: string;
  senderRole?: string;
  senderName?: string;
  senderAvatar?: string;
};

const getNotificationsStorageKey = (userId?: string) =>
  userId ? `live_notifications:${userId}` : null;

const getNotificationStorage = () => {
  if (typeof window === 'undefined') return null;
  return getActiveAuthStorageKind() === 'local' ? window.localStorage : window.sessionStorage;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, updateProfile, user } = useAuth();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications.items);
  const socketConnected = useAppSelector((state) => state.notifications.socketConnected);
  const walletBalanceRef = useRef(0);
  const totalEarningsRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const incomingCallRef = useRef<CallInvite | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallInvite | null>(null);

  useEffect(() => {
    walletBalanceRef.current = Number(user?.walletBalance || 0);
    totalEarningsRef.current = Number(user?.totalEarnings || 0);
  }, [user?.totalEarnings, user?.walletBalance]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = getNotificationsStorageKey(user?.id);
    const storage = getNotificationStorage();

    if (!isAuthenticated || !storageKey) {
      dispatch(clearNotificationsAction());
      window.localStorage.removeItem(LEGACY_NOTIFICATIONS_STORAGE_KEY);
      window.sessionStorage.removeItem(LEGACY_NOTIFICATIONS_STORAGE_KEY);
      return;
    }

    try {
      dispatch(clearNotificationsAction());
      window.localStorage.removeItem(LEGACY_NOTIFICATIONS_STORAGE_KEY);
      window.sessionStorage.removeItem(LEGACY_NOTIFICATIONS_STORAGE_KEY);
      const raw = storage?.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LiveNotification[];
      if (!Array.isArray(parsed)) return;
      dispatch(hydrateNotifications(parsed));
    } catch {
      storage?.removeItem(storageKey);
    }
  }, [dispatch, isAuthenticated, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = getNotificationsStorageKey(user?.id);
    const storage = getNotificationStorage();
    if (!isAuthenticated || !storageKey || !storage) return;
    storage.setItem(storageKey, JSON.stringify(notifications));
  }, [isAuthenticated, notifications, user?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated) return;

    const token = getAccessToken();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!token || !socketUrl) return;

    const socket: Socket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: `Bearer ${token}`,
      },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch(setSocketConnectedState(true));
    });

    socket.on('disconnect', () => {
      dispatch(setSocketConnectedState(false));
    });

    socket.on('notification:new', (notification: LiveNotification) => {
      const normalized: LiveNotification = {
        ...notification,
        id: notification.id || `NTF-${Date.now()}`,
        type: notification.type || 'system',
        unread: true,
        createdAt: notification.createdAt || new Date().toISOString(),
      };

      dispatch(addNotification(normalized));
      const notificationData = (normalized.data || {}) as {
        notificationType?: string;
        targetPath?: string;
      };

      if (notificationData.notificationType === 'provider_verification_approved') {
        updateProfile({
          payoutVerificationStatus: 'verified',
          payoutInfo: {
            rejectionReason: '',
            reviewedAt: normalized.createdAt,
          },
        });
      }

      if (notificationData.notificationType === 'provider_verification_rejected') {
        updateProfile({
          payoutVerificationStatus: 'rejected',
          payoutInfo: {
            rejectionReason: normalized.description || '',
            reviewedAt: normalized.createdAt,
          },
        });
      }

      if (notificationData.notificationType === 'order_paid') {
        const earnings = Number((notificationData as { providerEarningsAmount?: number }).providerEarningsAmount || 0);
        if (earnings > 0) {
          updateProfile({
            walletBalance: walletBalanceRef.current + earnings,
            totalEarnings: totalEarningsRef.current + earnings,
          });
        }
      }

      toast.info(normalized.title, {
        description: normalized.description,
        action:
          typeof notificationData.targetPath === 'string' && notificationData.targetPath
            ? {
                label: 'Open',
                onClick: () => {
                  if (typeof window !== 'undefined') {
                    window.location.href = notificationData.targetPath as string;
                  }
                },
              }
            : undefined,
      });
    });

    socket.on('call:invite', (payload: CallInvite) => {
      if (payload?.senderId) {
        socket.emit('call:end', {
          conversationId: payload.conversationId,
          targetUserId: payload.senderId,
          callType: payload.callType,
          reason: 'unavailable',
        });
      }
    });

    socket.on('call:end', (payload: { conversationId?: string }) => {
      if (payload?.conversationId && payload.conversationId === incomingCallRef.current?.conversationId) {
        setIncomingCall(null);
        toast.info('Call ended');
      }
    });

    socket.on('call:blocked', (payload: { reason?: string }) => {
      setIncomingCall(null);
      toast.info(payload?.reason || 'Audio and video calls are not available with admin support.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      dispatch(setSocketConnectedState(false));
    };
  }, [dispatch, isAuthenticated, updateProfile]);

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall || typeof window === 'undefined') return;
    window.sessionStorage.setItem(PENDING_INCOMING_CALL_STORAGE_KEY, JSON.stringify(incomingCall));
    setIncomingCall(null);
    window.location.href = `/messages?conversationId=${encodeURIComponent(incomingCall.conversationId)}&incomingCall=1`;
  }, [incomingCall]);

  const declineIncomingCall = useCallback(() => {
    if (incomingCall?.senderId && socketRef.current) {
      socketRef.current.emit('call:end', {
        conversationId: incomingCall.conversationId,
        targetUserId: incomingCall.senderId,
        callType: incomingCall.callType,
        reason: 'declined',
      });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);

  const markAllNotificationsAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsReadAction());
  }, [dispatch]);

  const clearNotifications = useCallback(() => {
    dispatch(clearNotificationsAction());
    const storageKey = getNotificationsStorageKey(user?.id);
    const storage = getNotificationStorage();
    if (storageKey && storage) {
      storage.removeItem(storageKey);
    }
  }, [dispatch, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socketConnected,
        notifications,
        unreadCount,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketNotifications() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketNotifications must be used within SocketProvider');
  }
  return context;
}
