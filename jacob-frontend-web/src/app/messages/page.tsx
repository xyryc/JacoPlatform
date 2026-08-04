'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { Search, MoreVertical, Send, Paperclip, Phone, Video, Info, ArrowLeft, CheckCheck, Smile, User, Trash2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/lib/authStorage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import {
  useCreateCustomOrderProposalMutation,
  useEnsureConversationByOrderMutation,
  useClearConversationHistoryMutation,
  useBlockConversationUserMutation,
  useUnblockConversationUserMutation,
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useMarkAllMessagesAsReadMutation,
  useMarkConversationMessagesAsReadMutation,
  useRespondToCustomOrderProposalMutation,
  useSendConversationMessageMutation,
  useDeleteConversationsMutation,
} from '@/store/services/apiSlice';

type Conversation = {
  id: string;
  orderId?: string;
  gigId?: string;
  orderNumber?: string;
  orderName?: string;
  orderStatus?: string;
  packageTitle?: string;
  categoryName?: string;
  blockedBy?: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  otherUser?: {
    id?: string;
    name?: string;
    avatar?: string;
    role?: string;
  };
};

type CustomOrderProposal = {
  id: string;
  proposalType?: 'custom' | 'repeat_order';
  sourceOrderId?: string | null;
  repeatIteration?: number;
  title: string;
  description?: string;
  price: number;
  serviceAddress: string;
  scheduledDate?: string;
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdOrderId?: string | null;
};

type ApiMessage = {
  id: string;
  conversationId: string;
  orderId?: string | null;
  senderId: string;
  receiverId?: string;
  text: string;
  messageType?: 'text' | 'custom_order_proposal' | 'system';
  attachments?: Array<{
    url?: string;
    fileName?: string;
    mimeType?: string;
    resourceType?: string;
  }>;
  customOrderProposal?: CustomOrderProposal | null;
  createdAt: string;
};

const EMOJI_OPTIONS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🎉', '❤️', '😢', '😎', '🤝', '💯'];

const EXTERNAL_LINK_REGEX = /((?:https?:\/\/|www\.)[^\s]+)/gi;
const PENDING_INCOMING_CALL_STORAGE_KEY = 'pending_incoming_call';

const getMessageLinks = (text = '') => {
  const matches = text.match(EXTERNAL_LINK_REGEX);
  return matches ? matches.filter(Boolean) : [];
};

const normalizeExternalUrl = (value: string) => {
  if (!value) return '#';
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
};

const renderMessageText = (text: string) => {
  const matches = Array.from(text.matchAll(EXTERNAL_LINK_REGEX));
  if (!matches.length) return text;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const url = match[0] || '';
    const startIndex = match.index ?? 0;

    if (startIndex > lastIndex) {
      nodes.push(<React.Fragment key={`text-${index}`}>{text.slice(lastIndex, startIndex)}</React.Fragment>);
    }

    nodes.push(
      <a
        key={`link-${index}`}
        href={normalizeExternalUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline underline-offset-2"
      >
        {url}
      </a>
    );

    lastIndex = startIndex + url.length;
  });

  if (lastIndex < text.length) {
    nodes.push(<React.Fragment key="text-tail">{text.slice(lastIndex)}</React.Fragment>);
  }

  return nodes;
};

const formatOfferTime = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/\b(?:AM|PM)\b/i.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmed;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return trimmed;

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
};

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

type CallSignal = {
  conversationId: string;
  targetUserId?: string;
  signalType?: 'offer' | 'answer' | 'candidate';
  signal?: RTCSessionDescriptionInit | RTCIceCandidateInit;
  senderId?: string;
};

const createPeerConnection = () =>
  new RTCPeerConnection({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ],
  });

const acquireCallMedia = async (callType: 'voice' | 'video') => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
  } catch (error) {
    if (callType === 'video') {
      return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }
    throw error;
  }
};

export default function MessagesPage() {
  const { role: userRole, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId') || '';
  const conversationIdParam = searchParams.get('conversationId') || '';
  const sourceOrderIdParam = searchParams.get('sourceOrderId') || '';
  const proposalTypeParam = searchParams.get('proposalType') || '';

  const [search, setSearch] = useState('');
  const [manualConversationId, setManualConversationId] = useState('');
  const [ensuredConversationId, setEnsuredConversationId] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);
  const [liveMessages, setLiveMessages] = useState<ApiMessage[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showProposalComposer, setShowProposalComposer] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalAddress, setProposalAddress] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalTime, setProposalTime] = useState('');
  const [incomingCall, setIncomingCall] = useState<CallInvite | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'active'>('idle');
  const [callError, setCallError] = useState('');
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const activeCallRef = useRef<{ conversationId: string; targetUserId: string; callType: 'voice' | 'video' } | null>(null);
  const pendingIncomingCallLoadedRef = useRef(false);

  const { data: conversationResponse, refetch: refetchConversations } = useGetConversationsQuery();
  const [ensureConversationByOrder] = useEnsureConversationByOrderMutation();
  const [sendConversationMessage, { isLoading: isSending }] = useSendConversationMessageMutation();
  const [createCustomOrderProposal, { isLoading: isCreatingProposal }] = useCreateCustomOrderProposalMutation();
  const [respondToCustomOrderProposal, { isLoading: isRespondingProposal }] = useRespondToCustomOrderProposalMutation();
  const [clearConversationHistory] = useClearConversationHistoryMutation();
  const [deleteConversations, { isLoading: deletingConversations }] = useDeleteConversationsMutation();
  const [blockConversationUser] = useBlockConversationUserMutation();
  const [unblockConversationUser] = useUnblockConversationUserMutation();
  const [markAllMessagesAsRead] = useMarkAllMessagesAsReadMutation();
  const [markConversationMessagesAsRead] = useMarkConversationMessagesAsReadMutation();

  const conversations = useMemo(
    () => ((conversationResponse?.data || []) as Conversation[]).filter((item) => item?.id),
    [conversationResponse]
  );

  const selectedConversationId = useMemo(() => {
    if (manualConversationId) return manualConversationId;
    if (conversationIdParam) return conversationIdParam;
    if (ensuredConversationId) return ensuredConversationId;
    return conversations[0]?.id || '';
  }, [manualConversationId, conversationIdParam, ensuredConversationId, conversations]);

  const { data: messagesResponse, refetch: refetchMessages } = useGetConversationMessagesQuery(
    { conversationId: selectedConversationId, page: 1, limit: 200 },
    { skip: !selectedConversationId }
  );

  const apiMessages = useMemo(
    () => ((messagesResponse?.data?.items || []) as ApiMessage[]).filter(Boolean),
    [messagesResponse]
  );

  const mergedMessages = useMemo(() => {
    const map = new Map<string, ApiMessage>();
    [...apiMessages, ...liveMessages]
      .filter((item) => item.conversationId === selectedConversationId)
      .forEach((item) => map.set(item.id, item));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [apiMessages, liveMessages, selectedConversationId]);
  const latestMessageId = mergedMessages[mergedMessages.length - 1]?.id || '';

  useEffect(() => {
    if (!selectedConversationId) return;

    const scrollToLatest = (behavior: ScrollBehavior = 'auto') => {
      messagesEndRef.current?.scrollIntoView({ block: 'end', behavior });
    };

    scrollToLatest('auto');
    const shortTimer = window.setTimeout(() => scrollToLatest('auto'), 80);
    const mediaTimer = window.setTimeout(() => scrollToLatest('smooth'), 260);

    return () => {
      window.clearTimeout(shortTimer);
      window.clearTimeout(mediaTimer);
    };
  }, [latestMessageId, mergedMessages.length, selectedConversationId]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = conversations.map((conv) => ({
      id: conv.id,
      otherUserId: conv.otherUser?.id || '',
      name: conv.otherUser?.name || 'User',
      avatar: conv.otherUser?.avatar || '',
      role: conv.otherUser?.role || '',
      lastMessage: conv.lastMessage || 'No messages yet',
      time: conv.lastMessageAt
        ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      unread: 0,
        online: true,
        packageLabel: conv.packageTitle || conv.orderName || 'Package',
        orderLabel: conv.orderNumber || '',
        categoryLabel: conv.categoryName || conv.packageTitle || conv.orderName || 'Category',
        blockedBy: conv.blockedBy || null,
      }));

    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q) || c.orderLabel.toLowerCase().includes(q));
  }, [conversations, search]);

  const selectedContact = useMemo(
    () => filteredContacts.find((c) => c.id === selectedConversationId) || filteredContacts[0] || null,
    [filteredContacts, selectedConversationId]
  );

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const isAdminConversation =
    selectedContact?.role === 'superAdmin' || selectedConversation?.otherUser?.role === 'superAdmin';
  const canStartCalls = !isAdminConversation;
  const blockedBy = selectedConversation?.blockedBy || null;
  const selectedGigId = String(selectedConversation?.gigId || '');
  const isBlockedByMe = Boolean(blockedBy && String(blockedBy) === String(user?.id || ''));
  const isBlockedByOther = Boolean(blockedBy && String(blockedBy) !== String(user?.id || ''));
  const canSendMessage = !blockedBy;
  const canSendCurrentMessage = canSendMessage && (Boolean(newMessage.trim()) || selectedAttachments.length > 0);
  const selectedDeleteCount = selectedConversationIds.length;
  const toggleSelectedConversation = useCallback((conversationId: string) => {
    setSelectedConversationIds((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId]
    );
  }, []);
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedConversationIds([]);
  }, []);
  const handleDeleteSelectedConversations = useCallback(async () => {
    if (!selectionMode) {
      setSelectionMode(true);
      return;
    }

    if (!selectedDeleteCount) {
      toast.error('Select one or more conversations first.');
      return;
    }

    try {
      await deleteConversations(selectedConversationIds).unwrap();
      if (selectedConversationIds.includes(selectedConversationId)) {
        setManualConversationId('');
        setEnsuredConversationId('');
        router.replace('/messages');
      }
      exitSelectionMode();
      refetchConversations();
      toast.success(`${selectedDeleteCount} conversation${selectedDeleteCount === 1 ? '' : 's'} deleted from inbox.`);
    } catch {
      toast.error('Could not delete selected conversations.');
    }
  }, [
    deleteConversations,
    exitSelectionMode,
    refetchConversations,
    router,
    selectedConversationId,
    selectedConversationIds,
    selectedDeleteCount,
    selectionMode,
  ]);
  const canSendQuickEtaMessage =
    !isAdminConversation &&
    userRole === 'provider' &&
    Boolean(selectedConversation?.orderId) &&
    Boolean(selectedConversationId) &&
    canSendMessage;
  const repeatSourceOrderId =
    sourceOrderIdParam ||
    (selectedConversation?.orderStatus === 'completed' && selectedConversation?.orderId
      ? String(selectedConversation.orderId)
      : '');
  const isRepeatProposalMode = proposalTypeParam === 'repeat_order' || Boolean(repeatSourceOrderId);
  const canCreateProposal = !isAdminConversation && userRole === 'provider' && Boolean(selectedConversationId);
  const canCreateCustomProposal = canCreateProposal && !selectedConversation?.orderId;
  const canCreateRepeatProposal = canCreateProposal && Boolean(repeatSourceOrderId);
  const canOpenProposalComposer = canCreateCustomProposal || canCreateRepeatProposal;
  const attachmentPreviews = useMemo(
    () => selectedAttachments.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : '')),
    [selectedAttachments]
  );

  const formatCallDuration = useCallback((totalSeconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    if (hours > 0) {
      return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
    }
    return [minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
  }, []);
  const callDurationLabel = useMemo(() => formatCallDuration(callSeconds), [callSeconds, formatCallDuration]);

  useEffect(() => {
    if (typeof window === 'undefined' || pendingIncomingCallLoadedRef.current) return;
    const raw = window.sessionStorage.getItem(PENDING_INCOMING_CALL_STORAGE_KEY);
    if (!raw) return;

    pendingIncomingCallLoadedRef.current = true;
    window.sessionStorage.removeItem(PENDING_INCOMING_CALL_STORAGE_KEY);

    try {
      const payload = JSON.parse(raw) as CallInvite;
      if (!payload?.conversationId || !payload?.callType) return;
      window.setTimeout(() => {
        setManualConversationId(payload.conversationId);
        setIncomingCall(payload);
        setActiveCall(payload.callType);
        setCallStatus('ringing');
        toast.info(`${payload.senderName || 'Someone'} is calling you`, {
          description: payload.callType === 'video' ? 'Video call incoming.' : 'Voice call incoming.',
        });
      }, 0);
    } catch {
      window.sessionStorage.removeItem(PENDING_INCOMING_CALL_STORAGE_KEY);
    }
  }, []);

  const cleanupCall = useCallback(
    (shouldNotifyPeer = false) => {
      const call = activeCallRef.current;
      const socket = socketRef.current;
      if (shouldNotifyPeer && call && socket) {
        socket.emit('call:end', {
          conversationId: call.conversationId,
          targetUserId: call.targetUserId,
          callType: call.callType,
        });
      }

      peerRef.current?.getSenders().forEach((sender) => sender.track?.stop());
      peerRef.current?.close();
      peerRef.current = null;

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
      setHasLocalStream(false);
      setHasRemoteStream(false);
      setCallStartedAt(null);
      setCallSeconds(0);

      activeCallRef.current = null;
      setActiveCall(null);
      setIncomingCall(null);
      setCallStatus('idle');
      setCallError('');
    },
    []
  );

  const startCallSession = useCallback(
    async (callType: 'voice' | 'video') => {
      if (!selectedConversationId || !selectedContact?.id || !socketRef.current) {
        toast.error('Select a conversation first.');
        return;
      }

      if (!canStartCalls) {
        toast.info('Audio and video calls are not available with admin support.');
        return;
      }

      try {
        cleanupCall(false);
        setCallStatus('connecting');
        setCallError('');

        const stream = await acquireCallMedia(callType);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasLocalStream(true);

        const peer = createPeerConnection();
        peerRef.current = peer;
        activeCallRef.current = {
          conversationId: selectedConversationId,
          targetUserId: selectedContact.otherUserId || '',
          callType,
        };
        setActiveCall(callType);

        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteStream) {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              void remoteAudioRef.current.play().catch(() => undefined);
            }
            setHasRemoteStream(true);
          }
        };

        peer.onicecandidate = (event) => {
          if (event.candidate && socketRef.current && activeCallRef.current) {
            socketRef.current.emit('call:signal', {
              conversationId: activeCallRef.current.conversationId,
              targetUserId: activeCallRef.current.targetUserId,
              signalType: 'candidate',
              signal: event.candidate.toJSON(),
              callType,
            });
          }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socketRef.current.emit('call:invite', {
          conversationId: selectedConversationId,
          targetUserId: selectedContact.otherUserId || '',
          callType,
          offer,
          senderName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
          senderAvatar: user?.avatar || '',
        } satisfies CallInvite);

        setCallStatus('ringing');
      } catch (error) {
        console.error('Failed to start call:', error);
        cleanupCall(false);
        setCallError('Could not access your camera or microphone.');
        toast.error('Could not start the call.');
      }
    },
    [canStartCalls, cleanupCall, selectedContact, selectedConversationId, user]
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !socketRef.current) return;

    try {
      cleanupCall(false);
      setCallStatus('connecting');
      setCallError('');

      const stream = await acquireCallMedia(incomingCall.callType);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasLocalStream(true);

      const peer = createPeerConnection();
      peerRef.current = peer;
      activeCallRef.current = {
        conversationId: incomingCall.conversationId,
        targetUserId: incomingCall.senderId || '',
        callType: incomingCall.callType,
      };
      setActiveCall(incomingCall.callType);

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteStream) {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              void remoteAudioRef.current.play().catch(() => undefined);
            }
            setHasRemoteStream(true);
          }
        };

      peer.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && activeCallRef.current) {
          socketRef.current.emit('call:signal', {
            conversationId: activeCallRef.current.conversationId,
            targetUserId: activeCallRef.current.targetUserId,
            signalType: 'candidate',
            signal: event.candidate.toJSON(),
            callType: incomingCall.callType,
          });
        }
      };

      if (incomingCall.offer) {
        await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socketRef.current.emit('call:signal', {
          conversationId: incomingCall.conversationId,
          targetUserId: incomingCall.senderId || '',
          signalType: 'answer',
          signal: answer,
          callType: incomingCall.callType,
        });
      }

      setIncomingCall(null);
      setCallStatus('active');
      setCallStartedAt(Date.now());
      setCallSeconds(0);
    } catch (error) {
      console.error('Failed to accept call:', error);
      cleanupCall(false);
      setCallError('Could not start the call.');
    }
  }, [cleanupCall, incomingCall]);

  useEffect(() => {
    if (callStatus !== 'active' || !callStartedAt) return;
    const timer = window.setInterval(() => {
      setCallSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [callStartedAt, callStatus]);

  useEffect(() => {
    if (!orderIdParam) return;
    let active = true;
    ensureConversationByOrder(orderIdParam)
      .unwrap()
      .then((res) => {
        if (!active) return;
        const cid = String((res?.data as any)?.id || '');
        if (cid) {
          setEnsuredConversationId(cid);
          refetchConversations();
          refetchMessages();
        }
      })
      .catch(() => {
        toast.error('Could not initialize conversation for this order.');
      });

    return () => {
      active = false;
    };
  }, [orderIdParam, ensureConversationByOrder, refetchConversations, refetchMessages]);

  useEffect(() => {
    void markAllMessagesAsRead().unwrap().then(() => {
      refetchConversations();
    });
  }, [markAllMessagesAsRead, refetchConversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void markConversationMessagesAsRead(selectedConversationId).unwrap().then(() => {
      refetchConversations();
    });
  }, [markConversationMessagesAsRead, refetchConversations, selectedConversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getAccessToken();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!token || !socketUrl) return;

    const socket = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: `Bearer ${token}`,
      },
    });
    socketRef.current = socket;

    socket.on('chat:created', (payload: { conversationId?: string }) => {
      if (payload?.conversationId) {
        setManualConversationId(payload.conversationId);
      }
      refetchConversations();
    });

    socket.on('chat:message:new', (payload: ApiMessage) => {
      setLiveMessages((prev) => (prev.some((item) => item.id === payload.id) ? prev : [...prev, payload]));
      if (payload.conversationId === selectedConversationId) {
        refetchMessages();
      } else if (String(payload.senderId) !== String(user?.id)) {
        toast.info('New message received');
      }
      refetchConversations();
    });

    socket.on('chat:conversation:updated', () => {
      refetchConversations();
    });

    socket.on('chat:conversation:deleted', () => {
      refetchConversations();
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

    socket.on('call:signal', async (payload: CallSignal) => {
      if (payload.conversationId !== activeCallRef.current?.conversationId) return;
      const peer = peerRef.current;
      if (!peer || !payload.signal) return;

      if (payload.signalType === 'answer') {
        await peer.setRemoteDescription(new RTCSessionDescription(payload.signal as RTCSessionDescriptionInit));
        setCallStatus('active');
        setCallStartedAt(Date.now());
        setCallSeconds(0);
      }

      if (payload.signalType === 'candidate') {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(payload.signal as RTCIceCandidateInit));
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
      }
    });

    socket.on('call:end', (payload: CallSignal) => {
      if (payload.conversationId !== activeCallRef.current?.conversationId) return;
      cleanupCall(false);
      toast.info('Call ended');
    });

    socket.on('call:blocked', (payload: { reason?: string }) => {
      cleanupCall(false);
      toast.info(payload?.reason || 'Audio and video calls are not available with admin support.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [cleanupCall, refetchConversations, refetchMessages, selectedConversationId, user?.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && selectedAttachments.length === 0) || !selectedConversationId || !canSendMessage) return;

    try {
      const result = await sendConversationMessage({
        conversationId: selectedConversationId,
        text: newMessage.trim(),
        attachments: selectedAttachments,
      }).unwrap();
      const message = (result?.data || null) as ApiMessage | null;
      if (message) {
        setLiveMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
      }
      setNewMessage('');
      setSelectedAttachments([]);
      setIsEmojiPickerOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refetchMessages();
      refetchConversations();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send message.');
    }
  };

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setSelectedAttachments((prev) => [...prev, ...files].slice(0, 4));
  };

  const removeAttachment = (indexToRemove: number) => {
    setSelectedAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
    if (fileInputRef.current && selectedAttachments.length <= 1) {
      fileInputRef.current.value = '';
    }
  };

  const appendEmoji = (emoji: string) => {
    setNewMessage((prev) => `${prev}${emoji}`);
    setIsEmojiPickerOpen(false);
    window.setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  const resetProposalComposer = () => {
    setProposalTitle('');
    setProposalDescription('');
    setProposalPrice('');
    setProposalAddress('');
    setProposalDate('');
    setProposalTime('');
    setShowProposalComposer(false);
  };

  const handleCreateProposal = async () => {
    if (!canOpenProposalComposer) return;
    const numericPrice = Number(proposalPrice);
    if (!proposalTitle.trim() || !proposalAddress.trim() || !proposalDate || !proposalTime || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error(`Fill all ${isRepeatProposalMode ? 'repeat order' : 'custom order'} fields first.`);
      return;
    }

    try {
      const result = await createCustomOrderProposal({
        conversationId: selectedConversationId,
        gigId: selectedGigId || undefined,
        proposalType: isRepeatProposalMode ? 'repeat_order' : 'custom',
        sourceOrderId: repeatSourceOrderId || undefined,
        title: proposalTitle.trim(),
        description: proposalDescription.trim(),
        price: numericPrice,
        serviceAddress: proposalAddress.trim(),
        scheduledDate: proposalDate,
        scheduledTime: proposalTime,
      }).unwrap();
      const message = (result?.data || null) as ApiMessage | null;
      if (message) {
        setLiveMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
      }
      resetProposalComposer();
      refetchMessages();
      refetchConversations();
      toast.success(isRepeatProposalMode ? 'Repeat order request sent.' : 'Custom order request sent.');
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to send ${isRepeatProposalMode ? 'repeat order' : 'custom order'} request.`);
    }
  };

  const handleSendQuickEtaMessage = async (text: string) => {
    if (!canSendQuickEtaMessage || !text.trim()) return;

    try {
      const result = await sendConversationMessage({
        conversationId: selectedConversationId,
        text: text.trim(),
      }).unwrap();
      const message = (result?.data || null) as ApiMessage | null;
      if (message) {
        setLiveMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
      }
      setIsEmojiPickerOpen(false);
      refetchMessages();
      refetchConversations();
      toast.success('Customer notified.');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send quick update.');
    }
  };

  const handleRespondProposal = async (proposalId: string, action: 'accept' | 'decline') => {
    try {
      const result = await respondToCustomOrderProposal({ proposalId, action }).unwrap();
      const message = (result?.data?.message || null) as ApiMessage | null;
      const proposalType = message?.customOrderProposal?.proposalType || 'custom';
      if (message) {
        setLiveMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
      }
      refetchMessages();
      refetchConversations();
      toast.success(
        action === 'accept'
          ? proposalType === 'repeat_order'
            ? 'Repeat order accepted.'
            : 'Custom order accepted.'
          : proposalType === 'repeat_order'
            ? 'Repeat order declined.'
            : 'Custom order declined.'
      );
    } catch (error: any) {
      toast.error(error?.data?.message || `Could not update the ${isRepeatProposalMode ? 'repeat order' : 'custom order'} request.`);
    }
  };

  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [attachmentPreviews]);

  const startCall = (type: 'voice' | 'video') => {
    void startCallSession(type);
  };

  const declineIncomingCall = useCallback(() => {
    if (incomingCall?.senderId && socketRef.current) {
      socketRef.current.emit('call:end', {
        conversationId: incomingCall.conversationId,
        targetUserId: incomingCall.senderId,
        callType: incomingCall.callType,
        reason: 'declined',
      });
    }
    cleanupCall(false);
  }, [cleanupCall, incomingCall]);

  useEffect(() => {
    return () => {
      cleanupCall(false);
    };
  }, [cleanupCall]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-100 flex-col transition-all duration-300`}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {selectionMode ? `${selectedDeleteCount} selected` : 'Messages'}
              </h1>
              {selectionMode ? <p className="text-xs font-bold text-slate-400 mt-1">Choose chats to delete from inbox</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {selectionMode ? (
                <Button variant="ghost" size="icon" className="rounded-full text-slate-400" onClick={exitSelectionMode}>
                  <X size={20} />
                </Button>
              ) : null}
              <Button
                variant={selectionMode ? 'default' : 'ghost'}
                size="icon"
                className={`rounded-full ${selectionMode ? 'bg-red-500 text-white hover:bg-red-600' : 'text-slate-400 hover:text-red-500'}`}
                onClick={() => void handleDeleteSelectedConversations()}
                disabled={deletingConversations}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
            <Input placeholder="Search conversations..." className="h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus-visible:ring-[#2286BE] font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelectedConversation(contact.id);
                    return;
                  }
                  setManualConversationId(contact.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                  selectedConversationIds.includes(contact.id)
                    ? 'bg-[#2286BE]/10 ring-2 ring-[#2286BE]/20'
                    : selectedConversationId === contact.id && !selectionMode
                      ? 'bg-primary-soft shadow-sm'
                      : 'hover:bg-slate-50'
                }`}
              >
                {selectionMode ? (
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedConversationIds.includes(contact.id) ? 'border-[#2286BE] bg-[#2286BE]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedConversationIds.includes(contact.id) ? <CheckCheck size={12} className="text-white" /> : null}
                  </span>
                ) : null}
                <div className="relative group">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                      {contact.avatar ? <AvatarImage src={contact.avatar} /> : null}
                      <AvatarFallback className="bg-slate-100 text-slate-500">
                        <User size={14} />
                      </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold truncate ${selectedConversationId === contact.id ? 'text-[#2286BE]' : 'text-slate-900'}`}>{contact.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{contact.time}</span>
                  </div>
                  <p className="text-[11px] truncate font-black uppercase tracking-wider text-[#2286BE]/80 mb-0.5">
                    {contact.categoryLabel || contact.packageLabel || 'Category'}
                  </p>
                  <p className="text-sm truncate text-slate-400 font-medium">{contact.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50/30 relative">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(true)}>
              <ArrowLeft size={20} />
            </Button>
            <div className="relative">
              <Avatar className="h-10 w-10 border border-slate-100">
                {selectedContact?.avatar ? <AvatarImage src={selectedContact.avatar} /> : null}
                <AvatarFallback className="bg-slate-100 text-slate-500">
                  <User size={14} />
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-none">{selectedContact?.name || 'Conversation'}</h3>
              <p className="text-[10px] font-bold text-[#2286BE] uppercase tracking-widest mt-1">
                {selectedContact?.categoryLabel || selectedContact?.packageLabel || (userRole === 'provider' ? 'Client chat' : 'Provider chat')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className={`text-slate-400 hover:text-[#2286BE] hover:bg-primary-soft rounded-xl transition-colors ${isInfoPanelOpen ? 'text-[#2286BE] bg-primary-soft' : ''}`} onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}>
              <Info size={20} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#2286BE] hover:bg-primary-soft rounded-xl">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                <DropdownMenuItem onClick={() => setShowClearConfirm(true)} className="py-2.5 rounded-lg cursor-pointer">
                  Clear History
                </DropdownMenuItem>
                {isBlockedByMe ? (
                  <DropdownMenuItem
                    onClick={() => {
                      void unblockConversationUser(selectedConversationId).unwrap().then(() => refetchConversations());
                    }}
                    className="py-2.5 rounded-lg cursor-pointer"
                  >
                    Unblock User
                  </DropdownMenuItem>
                ) : isBlockedByOther ? (
                  <DropdownMenuItem disabled className="py-2.5 rounded-lg cursor-pointer">
                    Blocked by User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      void blockConversationUser(selectedConversationId).unwrap().then(() => refetchConversations());
                    }}
                    className="py-2.5 rounded-lg cursor-pointer"
                  >
                    Block User
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {canSendQuickEtaMessage ? (
          <div className="border-b border-slate-100 bg-white px-6 py-3">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
              <p className="mr-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Quick updates</p>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => void handleSendQuickEtaMessage("I'm 30 minutes out.")}
                disabled={isSending}
              >
                30 minutes out
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => void handleSendQuickEtaMessage("I'm 60 minutes out.")}
                disabled={isSending}
              >
                60 minutes out
              </Button>
            </div>
          </div>
        ) : null}

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-center my-4">
              <span className="bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Today</span>
            </div>

            <AnimatePresence initial={false}>
              {mergedMessages.map((message) => {
                const mine = String(message.senderId) === String(user?.id || '');
                const senderName = mine
                  ? user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You'
                  : selectedContact?.name || 'User';
                const senderAvatar = mine ? (user?.avatar || '') : (selectedContact?.avatar || '');
                const providerSentExternalLinks =
                  userRole === 'client' &&
                  !mine &&
                  selectedConversation?.otherUser?.role === 'provider' &&
                  getMessageLinks(message.text || '').length > 0;
                return (
                  <motion.div key={message.id} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[90%] md:max-w-[75%] ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                        {senderAvatar ? <AvatarImage src={senderAvatar} /> : null}
                        <AvatarFallback className="bg-slate-100 text-slate-500">
                          <User size={12} />
                        </AvatarFallback>
                      </Avatar>
                      <div className={`px-5 py-3.5 rounded-[2rem] shadow-sm relative group ${mine ? 'bg-[#2286BE] text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                        <p className={`text-[11px] font-black mb-1 ${mine ? 'text-white/80 text-right' : 'text-slate-500'}`}>{senderName}</p>
                        {message.text ? <p className="text-sm md:text-base font-medium leading-relaxed">{renderMessageText(message.text)}</p> : null}
                        {providerSentExternalLinks ? (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                            This link leads to a site outside of LocalPros. Make sure the source is reliable, and remember that payments should always be made on LocalPros.
                          </div>
                        ) : null}
                        {message.customOrderProposal ? (
                          <div className={`mt-3 rounded-3xl border p-4 ${mine ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${mine ? 'text-white/70' : 'text-[#2286BE]'}`}>
                                  {message.customOrderProposal.proposalType === 'repeat_order' ? 'Repeat Order' : 'Custom Order'}
                                </p>
                                <h4 className={`mt-2 text-sm font-black ${mine ? 'text-white' : 'text-slate-900'}`}>{message.customOrderProposal.title}</h4>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                message.customOrderProposal.status === 'accepted'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : message.customOrderProposal.status === 'declined'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}>
                                {message.customOrderProposal.status}
                              </span>
                            </div>
                            {message.customOrderProposal.description ? (
                              <p className={`mt-3 text-sm leading-relaxed ${mine ? 'text-white/85' : 'text-slate-600'}`}>{message.customOrderProposal.description}</p>
                            ) : null}
                            <div className={`mt-3 grid grid-cols-2 gap-3 text-xs font-semibold ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                              <div>
                                <p className="uppercase tracking-widest text-[10px]">Price</p>
                                <p className={`mt-1 text-sm font-black ${mine ? 'text-white' : 'text-slate-900'}`}>${Number(message.customOrderProposal.price || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="uppercase tracking-widest text-[10px]">Time</p>
                                <p className={`mt-1 text-sm font-black ${mine ? 'text-white' : 'text-slate-900'}`}>{formatOfferTime(message.customOrderProposal.scheduledTime)}</p>
                              </div>
                            </div>
                            <div className={`mt-3 text-xs font-semibold ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                              <p className="uppercase tracking-widest text-[10px]">Address</p>
                              <p className={`mt-1 text-sm font-black ${mine ? 'text-white' : 'text-slate-900'}`}>{message.customOrderProposal.serviceAddress}</p>
                            </div>
                            {!mine && userRole === 'client' && message.customOrderProposal.status === 'pending' ? (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  type="button"
                                  onClick={() => handleRespondProposal(message.customOrderProposal!.id, 'accept')}
                                  disabled={isRespondingProposal}
                                  className="flex-1 rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0]"
                                >
                                  Accept
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => handleRespondProposal(message.customOrderProposal!.id, 'decline')}
                                  disabled={isRespondingProposal}
                                  className="flex-1 rounded-2xl"
                                >
                                  Decline
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {Array.isArray(message.attachments) && message.attachments.length > 0 ? (
                          <div className={`mt-3 grid gap-2 ${message.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {message.attachments.map((attachment, index) => {
                              const isImage = (attachment?.mimeType || '').startsWith('image/');
                              return isImage ? (
                                <button
                                  key={`${message.id}-attachment-${index}`}
                                  type="button"
                                  onClick={() =>
                                    setPreviewImage({
                                      url: attachment?.url || '',
                                      alt: attachment?.fileName || 'Attachment',
                                    })
                                  }
                                  className="block overflow-hidden rounded-2xl border border-white/10 bg-black/10"
                                >
                                  <img
                                    src={attachment?.url || ''}
                                    alt={attachment?.fileName || 'Attachment'}
                                    className="h-36 w-full object-cover"
                                  />
                                </button>
                              ) : (
                                <a
                                  key={`${message.id}-attachment-${index}`}
                                  href={attachment?.url || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
                                    mine ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <Paperclip size={16} />
                                  <span className="truncate">{attachment?.fileName || 'Attachment'}</span>
                                </a>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className={`flex items-center gap-1.5 mt-1.5 ${mine ? 'justify-end text-white/70' : 'text-slate-400'}`}>
                          <span className="text-[10px] font-bold">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {mine ? <CheckCheck size={14} className="text-white" /> : null}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isBlockedByOther ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 font-semibold">
                You can&apos;t send message to this user anymore.
              </div>
            ) : null}
            <div ref={messagesEndRef} className="h-px" />
          </div>
        </ScrollArea>

        <footer className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto">
            {canOpenProposalComposer ? (
              <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#2286BE]">Provider Tools</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {isRepeatProposalMode
                        ? 'Send a repeat order offer after agreeing on updated scope and price.'
                        : 'Send a custom order request after agreeing on scope and price.'}
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setShowProposalComposer((prev) => !prev)}>
                    {showProposalComposer ? 'Hide' : isRepeatProposalMode ? 'Create Repeat Order' : 'Create Custom Order'}
                  </Button>
                </div>
                {showProposalComposer ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Input value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} placeholder="Order title" className="rounded-2xl bg-white" />
                    <Input value={proposalPrice} onChange={(e) => setProposalPrice(e.target.value)} placeholder="Price" type="number" min="1" className="rounded-2xl bg-white" />
                    <Input value={proposalAddress} onChange={(e) => setProposalAddress(e.target.value)} placeholder="Service address" className="rounded-2xl bg-white md:col-span-2" />
                    <Input value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} type="date" className="rounded-2xl bg-white" />
                    <Input value={proposalTime} onChange={(e) => setProposalTime(e.target.value)} type="time" className="rounded-2xl bg-white" />
                    <Input value={proposalDescription} onChange={(e) => setProposalDescription(e.target.value)} placeholder={isRepeatProposalMode ? 'Describe the updated repeat order details' : 'Describe the custom work'} className="rounded-2xl bg-white md:col-span-2" />
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="button" onClick={handleCreateProposal} disabled={isCreatingProposal} className="rounded-2xl bg-[#2286BE] hover:bg-[#1b6da0]">
                        {isCreatingProposal ? 'Sending...' : isRepeatProposalMode ? 'Send Offer' : 'Send Request'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetProposalComposer} className="rounded-2xl">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {selectedAttachments.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-3">
                {selectedAttachments.map((file, index) => {
                  const previewUrl = attachmentPreviews[index] || '';
                  return (
                    <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      {previewUrl ? (
                        <img src={previewUrl} alt={file.name} className="h-16 w-16 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-slate-500">
                          <Paperclip size={18} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/75 text-[10px] font-bold text-white"
                      >
                        x
                      </button>
                      <p className="mt-2 max-w-20 truncate text-[11px] font-semibold text-slate-600">{file.name}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 bg-slate-50 h-16 px-4 rounded-[2rem] border border-slate-100 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              className="hidden"
              onChange={handleAttachmentSelect}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-full text-slate-400 hover:text-[#2286BE] hover:bg-white shrink-0">
              <Paperclip size={20} />
            </Button>
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setIsInfoPanelOpen(false)}
              onClick={() => messageInputRef.current?.focus()}
              placeholder={isBlockedByOther ? "You can't send message to this user anymore." : 'Type your message here...'}
              disabled={!canSendMessage}
              className="flex-1 bg-transparent border-none outline-none focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none shadow-none font-medium text-slate-700 h-full cursor-text rounded-none disabled:cursor-not-allowed"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              className="hidden sm:inline-flex rounded-full text-slate-400 hover:text-[#2286BE] hover:bg-white shrink-0"
            >
              <Smile size={20} />
            </Button>
            <Button type="submit" disabled={!canSendCurrentMessage || isSending} className={`rounded-full flex items-center justify-center p-0 h-10 w-10 shrink-0 transition-all ${canSendCurrentMessage ? 'bg-[#2286BE] text-white shadow-lg shadow-primary/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <Send size={18} />
            </Button>
            {isEmojiPickerOpen ? (
              <div className="absolute bottom-[calc(100%+12px)] right-12 z-20 w-64 rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Pick an emoji</p>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => appendEmoji(emoji)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-xl transition hover:bg-primary-soft"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            </form>
          </div>
        </footer>
      </main>

      {activeCall ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
          <audio ref={remoteAudioRef} autoPlay playsInline />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[2.75rem] border border-white/10 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.45)]">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-[#2286BE] via-[#1f9bd7] to-[#7c3aed] opacity-95" />

            <div className="relative p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-[1.5rem] border border-white/20 bg-white/15 p-3 shadow-lg backdrop-blur">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2286BE]">
                      {activeCall === 'video' ? <Video size={24} /> : <Phone size={24} />}
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-white drop-shadow-sm">
                        {incomingCall && callStatus === 'ringing'
                          ? `${incomingCall.senderName || 'Incoming'} is calling`
                          : selectedContact?.name || 'Call in progress'}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                          callStatus === 'active'
                            ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
                            : callStatus === 'ringing'
                              ? 'bg-amber-500/15 text-amber-200 border border-amber-400/30'
                              : 'bg-white/15 text-white/80 border border-white/20'
                        }`}
                      >
                        {callStatus === 'active' ? `Live ${callDurationLabel}` : callStatus === 'ringing' ? 'Ringing' : 'Connecting'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white/80">
                      {activeCall === 'video' ? 'Video call' : 'Voice call'} with {selectedContact?.name || incomingCall?.senderName || 'User'}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {incomingCall && callStatus === 'ringing' ? (
                    <>
                      <Button
                        className="rounded-full bg-emerald-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
                        onClick={acceptIncomingCall}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full border-white/20 bg-white/10 px-5 py-2.5 font-bold text-white hover:bg-white/20 hover:text-white"
                        onClick={declineIncomingCall}
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="rounded-full bg-rose-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600"
                      onClick={() => cleanupCall(true)}
                    >
                      End Call
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-[2.25rem] bg-slate-950 p-3 shadow-inner shadow-slate-950/40 ring-1 ring-white/10">
                  <div className="relative min-h-[360px] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,134,190,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.18),transparent_30%)]" />
                    <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
                    {!hasRemoteStream ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white/80">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15">
                          <User size={32} />
                        </div>
                        <p className="text-lg font-bold text-white">Waiting for the other side</p>
                        <p className="mt-1 text-sm text-white/60">
                          {callStatus === 'ringing' ? 'The call is ringing now.' : 'Remote video will show here once the call connects.'}
                        </p>
                      </div>
                    ) : null}
                    <div className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white backdrop-blur">
                      Remote
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Your preview</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {hasLocalStream ? 'Camera and mic are connected.' : 'Preparing your media devices.'}
                        </p>
                      </div>
                      <Badge className="rounded-full bg-[#2286BE]/10 px-3 py-1 text-[#2286BE] hover:bg-[#2286BE]/10">
                        {activeCall === 'video' ? 'Video' : 'Voice'}
                      </Badge>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-slate-950 shadow-inner shadow-slate-950/30">
                      <div className="relative min-h-[220px]">
                        <video ref={localVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                        {!hasLocalStream ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white/75">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15">
                              <Phone size={24} />
                            </div>
                            <p className="font-semibold text-white">Your camera preview</p>
                            <p className="mt-1 text-sm text-white/60">We&apos;ll show your local feed here.</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Call state</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {callStatus === 'active'
                            ? 'Connected and running'
                            : callStatus === 'ringing'
                              ? 'Waiting for response'
                              : 'Setting up connection'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Duration</p>
                        <p className="mt-1 font-mono text-lg font-black text-slate-900">{callDurationLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {callError ? (
                <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-red-700 font-semibold">
                  {callError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-8 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_120px_rgba(15,23,42,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-lg font-bold text-white backdrop-blur transition hover:bg-black/65"
            >
              x
            </button>
            <div className="flex min-h-[60vh] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,134,190,0.15),transparent_35%),radial-gradient(circle_at_bottom,rgba(124,58,237,0.18),transparent_35%)] p-6">
              <img
                src={previewImage.url}
                alt={previewImage.alt}
                className="max-h-[78vh] w-auto max-w-full rounded-[1.5rem] object-contain"
              />
            </div>
            <div className="border-t border-white/10 bg-slate-900/90 px-5 py-4">
              <p className="truncate text-sm font-semibold text-white/85">{previewImage.alt}</p>
            </div>
          </div>
        </div>
      ) : null}

      {showClearConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Clear chat history?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will hide the messages from your view only. The other person will still see their copy.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-2xl bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (!selectedConversationId) return;
                  await clearConversationHistory(selectedConversationId).unwrap();
                  setShowClearConfirm(false);
                  setLiveMessages([]);
                  refetchMessages();
                  refetchConversations();
                }}
              >
                Confirm Hide
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
