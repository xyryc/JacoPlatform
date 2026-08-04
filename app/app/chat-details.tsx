import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeModules,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import InCallManager from "react-native-incall-manager";

import { KeyboardAwareScrollView } from "@/src/components/KeyboardAwareScrollView";
import {
  SchedulePickerFields,
  isFutureSchedule,
  toDateInputValue,
  toScheduleTimeLabel,
} from "@/src/components/SchedulePickerFields";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  PENDING_INCOMING_CALL_CANDIDATES_STORAGE_KEY,
  PENDING_INCOMING_CALL_STORAGE_KEY,
  useSocketNotifications,
} from "@/src/contexts/SocketContext";
import {
  useBlockConversationUserMutation,
  useClearConversationHistoryMutation,
  useCreateCustomOrderProposalMutation,
  useEnsureConversationByOrderMutation,
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useMarkConversationMessagesAsReadMutation,
  useRespondToCustomOrderProposalMutation,
  useSendConversationMessageMutation,
  useUnblockConversationUserMutation,
} from "@/src/store/services/apiSlice";
import type { ChatMessage, ConversationSummary } from "@/src/types/api";

type NativeRTCSessionDescriptionInit = Record<string, unknown>;
type NativeRTCIceCandidateInit = Record<string, unknown>;
type NativeMediaStream = {
  getTracks: () => { enabled: boolean; kind?: string; stop: () => void }[];
  getAudioTracks: () => { enabled: boolean; stop: () => void }[];
  getVideoTracks: () => { enabled: boolean; stop: () => void }[];
  toURL: () => string;
};
type NativePeerConnection = any;

let cachedWebRTC: any | null | undefined;

const getWebRTC = () => {
  if (cachedWebRTC !== undefined) return cachedWebRTC;
  try {
    // WebRTC is optional in local Expo runs; load it only when calls are used.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require("react-native-webrtc");
    loaded?.registerGlobals?.();
    cachedWebRTC = loaded;
  } catch {
    cachedWebRTC = null;
  }
  return cachedWebRTC;
};

const getWebRTCOrThrow = () => {
  const webRTC = getWebRTC();
  if (!webRTC) {
    throw new Error("Voice and video calls require a development build with WebRTC installed.");
  }
  return webRTC;
};

type AttachmentAsset = {
  uri: string;
  name: string;
  type: string;
};

type CallType = "voice" | "video";
type CallStatus = "idle" | "ringing" | "connecting" | "active";

type CallInvitePayload = {
  conversationId: string;
  targetUserId?: string;
  senderId?: string;
  senderRole?: string;
  senderName?: string;
  senderAvatar?: string;
  callType: CallType;
  offer?: NativeRTCSessionDescriptionInit;
};

type CallSignalPayload = {
  conversationId: string;
  targetUserId?: string;
  senderId?: string;
  signalType?: "offer" | "answer" | "candidate";
  signal?: NativeRTCSessionDescriptionInit | NativeRTCIceCandidateInit;
  callType?: CallType;
};

type ActiveCallRef = {
  conversationId: string;
  targetUserId: string;
  callType: CallType;
};

const createPeerConnection = () => {
  const webRTC = getWebRTCOrThrow();
  return new webRTC.RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
  });
};

const formatCallDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return [minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};

const safeInCallManager =
  NativeModules.InCallManager && InCallManager && typeof InCallManager === "object" ? InCallManager : null;

const callInCallManager = (action: () => void) => {
  try {
    action();
  } catch {
    // In local Expo/dev builds the native InCallManager module may be absent.
  }
};

const ProfileAvatar = ({
  uri,
  size,
  className = "",
  iconSize,
}: {
  uri?: string;
  size: number;
  className?: string;
  iconSize: number;
}) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={className}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      className={`items-center justify-center bg-[#EAF3FA] ${className}`}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Ionicons name="person-outline" size={iconSize} color="#2286BE" />
    </View>
  );
};

const WebRTCVideoView = ({
  streamURL,
  className = "",
  objectFit = "cover",
  mirror = false,
  style,
}: {
  streamURL: string;
  className?: string;
  objectFit?: "cover" | "contain";
  mirror?: boolean;
  style?: object;
}) => {
  const RTCView = getWebRTC()?.RTCView;
  if (!RTCView) {
    return <View className={className} style={style} />;
  }

  return <RTCView streamURL={streamURL} className={className} objectFit={objectFit} mirror={mirror} style={style} />;
};

export default function ChatDetailsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { socket } = useSocketNotifications();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    conversationId?: string;
    orderId?: string;
    serviceRequestId?: string;
    requestNumber?: string;
    requestCategoryName?: string;
    sourceOrderId?: string;
    proposalType?: string;
    serviceAddress?: string;
    preferredDate?: string;
    preferredTime?: string;
    budget?: string;
    name?: string;
    avatar?: string;
    info?: string;
    blockedBy?: string;
    targetUserId?: string;
    targetUserRole?: string;
    incomingCall?: string;
    autoAcceptIncomingCall?: string;
  }>();

  const readParam = (value?: string | string[]) => {
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const peerRef = useRef<NativePeerConnection | null>(null);
  const localStreamRef = useRef<NativeMediaStream | null>(null);
  const remoteStreamRef = useRef<NativeMediaStream | null>(null);
  const activeCallRef = useRef<ActiveCallRef | null>(null);
  const pendingIceCandidatesRef = useRef<NativeRTCIceCandidateInit[]>([]);
  const pendingIncomingCallLoadedRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachmentAssets, setAttachmentAssets] = useState<AttachmentAsset[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockedBy, setBlockedBy] = useState<string | null>(null);
  const [resolvedConversationId, setResolvedConversationId] = useState("");
  const [showProposalComposer, setShowProposalComposer] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalPrice, setProposalPrice] = useState("");
  const [proposalAddress, setProposalAddress] = useState("");
  const [proposalDate, setProposalDate] = useState("");
  const [proposalTime, setProposalTime] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [activeCall, setActiveCall] = useState<CallType | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallInvitePayload | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callError, setCallError] = useState("");
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [localStreamUrl, setLocalStreamUrl] = useState<string | null>(null);
  const [remoteStreamUrl, setRemoteStreamUrl] = useState<string | null>(null);
  const [autoAcceptIncomingCall, setAutoAcceptIncomingCall] = useState(false);
  const [ensureConversationByOrder, { isLoading: ensuringConversation }] =
    useEnsureConversationByOrderMutation();
  const { data: conversationsPayload, refetch: refetchConversations } = useGetConversationsQuery();
  const [createCustomOrderProposal, { isLoading: creatingProposal }] = useCreateCustomOrderProposalMutation();
  const [respondToCustomOrderProposal, { isLoading: respondingProposal }] = useRespondToCustomOrderProposalMutation();

  const conversationIdParam = readParam(params.conversationId);
  const orderId = readParam(params.orderId);
  const serviceRequestIdParam = readParam(params.serviceRequestId);
  const requestNumberParam = readParam(params.requestNumber);
  const requestCategoryNameParam = readParam(params.requestCategoryName);
  const sourceOrderIdParam = readParam(params.sourceOrderId);
  const proposalTypeParam = readParam(params.proposalType);
  const serviceAddressParam = readParam(params.serviceAddress);
  const preferredDateParam = readParam(params.preferredDate);
  const preferredTimeParam = readParam(params.preferredTime);
  const budgetParam = readParam(params.budget);
  const nameParam = readParam(params.name);
  const avatar = readParam(params.avatar);
  const info = readParam(params.info);
  const blockedByParam = readParam(params.blockedBy);
  const targetUserIdParam = readParam(params.targetUserId);
  const targetUserRoleParam = readParam(params.targetUserRole);
  const incomingCallParam = readParam(params.incomingCall);
  const autoAcceptIncomingCallParam = readParam(params.autoAcceptIncomingCall);
  const conversationId = resolvedConversationId || conversationIdParam;
  const conversations = useMemo(() => conversationsPayload?.data || [], [conversationsPayload]);
  const selectedConversation = useMemo(
    () => (conversations as ConversationSummary[]).find((item) => item.id === conversationId) || null,
    [conversationId, conversations]
  );
  const selectedGigId = String(selectedConversation?.gigId || "");

  const { data, isLoading, refetch: refetchMessages } = useGetConversationMessagesQuery(
    { conversationId, page: 1, limit: 100 },
    { skip: !conversationId }
  );
  const [markRead] = useMarkConversationMessagesAsReadMutation();
  const [sendMessage, { isLoading: sending }] = useSendConversationMessageMutation();
  const [clearHistory, { isLoading: clearingHistory }] = useClearConversationHistoryMutation();
  const [blockUser, { isLoading: blockingUser }] = useBlockConversationUserMutation();
  const [unblockUser, { isLoading: unblockingUser }] = useUnblockConversationUserMutation();

  const initialMessages = useMemo(() => data?.data.items || [], [data]);
  const displayName = nameParam || selectedConversation?.otherUser?.name || incomingCall?.senderName || "User";
  const displayAvatar = avatar || selectedConversation?.otherUser?.avatar || incomingCall?.senderAvatar || "";
  const displayInfo =
    info ||
    selectedConversation?.packageTitle ||
    selectedConversation?.orderName ||
    selectedConversation?.categoryName ||
    requestCategoryNameParam ||
    requestNumberParam ||
    selectedConversation?.otherUser?.email ||
    "";
  const targetUserId = targetUserIdParam || selectedConversation?.otherUser?.id || incomingCall?.senderId || "";
  const targetUserRole =
    selectedConversation?.otherUser?.role || (typeof targetUserRoleParam === "string" ? targetUserRoleParam : "");
  const isAdminConversation = targetUserRole === "superAdmin" || user?.role === "superAdmin";
  const canStartCalls = !isAdminConversation;
  const isBlockedByMe = Boolean(blockedBy && blockedBy === user?.id);
  const isBlockedByOther = Boolean(blockedBy && blockedBy !== user?.id);
  const canSend = !blockedBy;
  const repeatSourceOrderId =
    sourceOrderIdParam ||
    (selectedConversation?.orderStatus === "completed" && selectedConversation?.orderId
      ? String(selectedConversation.orderId)
      : "");
  const isRepeatProposalMode = proposalTypeParam === "repeat_order" || Boolean(repeatSourceOrderId);
  const canCreateProposal =
    user?.role === "provider" &&
    Boolean(conversationId);
  const canCreateCustomProposal = canCreateProposal && !selectedConversation?.orderId;
  const canCreateRepeatProposal = canCreateProposal && Boolean(repeatSourceOrderId);
  const canOpenProposalComposer = canCreateCustomProposal || canCreateRepeatProposal;
  const callDurationLabel = useMemo(() => formatCallDuration(callSeconds), [callSeconds]);
  const callModalVisible = Boolean(activeCall || incomingCall);
  const currentCallType = activeCall || incomingCall?.callType;
  const isVideoCall = currentCallType === "video";
  const callTitle =
    incomingCall && callStatus === "ringing"
      ? `${incomingCall.senderName || "Incoming caller"}`
      : displayName;

  useEffect(() => {
    if (pendingIncomingCallLoadedRef.current || incomingCallParam !== "1") return;
    pendingIncomingCallLoadedRef.current = true;

    const loadPendingIncomingCall = async () => {
      const raw = await AsyncStorage.getItem(PENDING_INCOMING_CALL_STORAGE_KEY);
      if (!raw) return;
      await AsyncStorage.removeItem(PENDING_INCOMING_CALL_STORAGE_KEY);

      try {
        const payload = JSON.parse(raw) as CallInvitePayload;
        if (!payload?.conversationId || !payload?.callType) return;
        const candidatesRaw = await AsyncStorage.getItem(PENDING_INCOMING_CALL_CANDIDATES_STORAGE_KEY);
        await AsyncStorage.removeItem(PENDING_INCOMING_CALL_CANDIDATES_STORAGE_KEY);
        try {
          const parsedCandidates = candidatesRaw ? (JSON.parse(candidatesRaw) as NativeRTCIceCandidateInit[]) : [];
          pendingIceCandidatesRef.current = Array.isArray(parsedCandidates) ? parsedCandidates : [];
        } catch {
          pendingIceCandidatesRef.current = [];
        }
        setResolvedConversationId(payload.conversationId);
        setIncomingCall(payload);
        setActiveCall(payload.callType);
        setCallStatus("ringing");
        setAutoAcceptIncomingCall(autoAcceptIncomingCallParam === "1");
      } catch {
        await AsyncStorage.removeItem(PENDING_INCOMING_CALL_STORAGE_KEY);
        await AsyncStorage.removeItem(PENDING_INCOMING_CALL_CANDIDATES_STORAGE_KEY);
      }
    };

    void loadPendingIncomingCall();
  }, [autoAcceptIncomingCallParam, incomingCallParam]);

  useEffect(() => {
    setResolvedConversationId(conversationIdParam);
  }, [conversationIdParam]);

  useEffect(() => {
    if (!conversationIdParam) return;
    void refetchConversations();
  }, [conversationIdParam, refetchConversations]);

  useEffect(() => {
    if (conversationIdParam || !orderId) return;

    let active = true;
    void ensureConversationByOrder(orderId)
      .unwrap()
      .then((payload) => {
        if (!active) return;
        const nextConversationId = String(payload.data?.id || "");
        if (nextConversationId) {
          setResolvedConversationId(nextConversationId);
        }
      })
      .catch(() => {
        if (!active) return;
        Alert.alert("Chat unavailable", "We could not load the conversation history for this order.");
      });

    return () => {
      active = false;
    };
  }, [conversationIdParam, ensureConversationByOrder, orderId]);

  useEffect(() => {
    setMessages(initialMessages);
    if (conversationId) {
      void markRead(conversationId);
    }
  }, [conversationId, initialMessages, markRead]);

  useEffect(() => {
    setBlockedBy(blockedByParam ? String(blockedByParam) : null);
  }, [blockedByParam]);

  useEffect(() => {
    setBlockedBy(selectedConversation?.blockedBy || null);
  }, [selectedConversation?.blockedBy]);

  useEffect(() => {
    const isServiceRequestChat = Boolean(serviceRequestIdParam || selectedConversation?.serviceRequestId);
    if (!isServiceRequestChat || isRepeatProposalMode) return;

    const defaultTitle = selectedConversation?.categoryName || requestCategoryNameParam;
    if (defaultTitle) {
      setProposalTitle((current) => current || defaultTitle);
    }
    setProposalAddress((current) => current || serviceAddressParam);
    setProposalTime((current) => current || preferredTimeParam);

    if (budgetParam) {
      setProposalPrice((current) => current || budgetParam);
    }

    if (preferredDateParam) {
      const parsedDate = new Date(preferredDateParam);
      if (!Number.isNaN(parsedDate.getTime())) {
        setProposalDate((current) => current || toDateInputValue(parsedDate));
      }
    }
  }, [
    budgetParam,
    isRepeatProposalMode,
    preferredDateParam,
    preferredTimeParam,
    requestCategoryNameParam,
    selectedConversation?.categoryName,
    selectedConversation?.serviceRequestId,
    serviceAddressParam,
    serviceRequestIdParam,
  ]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 80);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const stopStream = useCallback((stream: NativeMediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const startCallAudioRoute = useCallback((callType: CallType) => {
    if (!safeInCallManager) return;
    callInCallManager(() => {
      safeInCallManager.start?.({ media: callType === "video" ? "video" : "audio" });
      safeInCallManager.setKeepScreenOn?.(true);
      safeInCallManager.setMicrophoneMute?.(false);
      safeInCallManager.setForceSpeakerphoneOn?.(true);
      safeInCallManager.setSpeakerphoneOn?.(true);
    });
  }, []);

  const stopCallAudioRoute = useCallback(() => {
    if (!safeInCallManager) return;
    callInCallManager(() => {
      safeInCallManager.setKeepScreenOn?.(false);
      safeInCallManager.setMicrophoneMute?.(false);
      safeInCallManager.setForceSpeakerphoneOn?.(false);
      safeInCallManager.setSpeakerphoneOn?.(false);
      safeInCallManager.stop?.();
    });
  }, []);

  const resetCallState = useCallback(() => {
    stopCallAudioRoute();
    peerRef.current?.close();
    peerRef.current = null;
    stopStream(localStreamRef.current);
    stopStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    activeCallRef.current = null;
    pendingIceCandidatesRef.current = [];
    setLocalStreamUrl(null);
    setRemoteStreamUrl(null);
    setIncomingCall(null);
    setActiveCall(null);
    setCallStatus("idle");
    setCallStartedAt(null);
    setCallSeconds(0);
    setCallError("");
  }, [stopCallAudioRoute, stopStream]);

  const flushPendingIceCandidates = useCallback(async (peer: NativePeerConnection) => {
    const candidates = pendingIceCandidatesRef.current;
    if (!candidates.length) return;

    pendingIceCandidatesRef.current = [];
    for (const candidate of candidates) {
      try {
        const webRTC = getWebRTCOrThrow();
        await peer.addIceCandidate(new webRTC.RTCIceCandidate(candidate));
      } catch {
        // Ignore stale ICE candidates collected before the peer was ready.
      }
    }
  }, []);

  const cleanupCall = useCallback(
    (shouldNotifyPeer = false) => {
      const call = activeCallRef.current;
      if (shouldNotifyPeer && socket && call) {
        socket.emit("call:end", {
          conversationId: call.conversationId,
          targetUserId: call.targetUserId,
          callType: call.callType,
        });
      }
      resetCallState();
    },
    [resetCallState, socket]
  );

  useEffect(() => () => cleanupCall(false), [cleanupCall]);

  useEffect(() => {
    if (callStatus !== "active" || !callStartedAt) return;
    const timer = setInterval(() => {
      setCallSeconds(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [callStartedAt, callStatus]);

  const requestCallPermissions = useCallback(async (callType: CallType) => {
    if (Platform.OS !== "android") return true;

    const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (callType === "video") {
      permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }

    const alreadyGranted = await Promise.all(
      permissions.map((permission) => PermissionsAndroid.check(permission))
    );
    if (alreadyGranted.every(Boolean)) return true;

    const result = await PermissionsAndroid.requestMultiple(permissions);
    const granted = permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);

    if (!granted) {
      const blocked = permissions.some(
        (permission) => result[permission] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      );

      Alert.alert(
        callType === "video" ? "Camera and microphone needed" : "Microphone needed",
        blocked
          ? "Please enable microphone permission from app settings to use calls."
          : "Please allow microphone permission to use calls.",
        blocked
          ? [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => void Linking.openSettings() },
            ]
          : [{ text: "OK" }]
      );
    }

    return granted;
  }, []);

  const attachPeerListeners = useCallback(
    (peer: NativePeerConnection, callType: CallType) => {
      const peerWithEvents = peer as unknown as {
        addEventListener: (
          type: "track" | "icecandidate",
          listener: (event: { streams?: NativeMediaStream[]; track?: { enabled: boolean } | null; candidate?: any | null }) => void
        ) => void;
      };

      peerWithEvents.addEventListener("track", (event) => {
        const streams = event.streams || [];
        const [stream] = streams;
        if (!stream) return;
        event.track && (event.track.enabled = true);
        stream.getTracks().forEach((track) => {
          track.enabled = true;
        });
        remoteStreamRef.current = stream;
        setRemoteStreamUrl(stream.toURL());
        startCallAudioRoute(callType);
      });

      peerWithEvents.addEventListener("icecandidate", (event) => {
        if (!event.candidate || !socket || !activeCallRef.current) return;
        socket.emit("call:signal", {
          conversationId: activeCallRef.current.conversationId,
          targetUserId: activeCallRef.current.targetUserId,
          signalType: "candidate",
          signal: event.candidate.toJSON(),
          callType,
        });
      });
    },
    [socket, startCallAudioRoute]
  );

  const createLocalStream = useCallback(
    async (callType: CallType) => {
      const granted = await requestCallPermissions(callType);
      if (!granted) {
        throw new Error("Microphone or camera permission was denied.");
      }

      try {
        const webRTC = getWebRTCOrThrow();
        return await webRTC.mediaDevices.getUserMedia({
          audio: true,
          video:
            callType === "video"
              ? {
                  facingMode: "user",
                  frameRate: 30,
                }
              : false,
        });
      } catch (error) {
        throw error;
      }
    },
    [requestCallPermissions]
  );

  const prepareLocalStreamForCall = useCallback((stream: NativeMediaStream, callType: CallType) => {
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      stopStream(stream);
      throw new Error("Microphone track was not created. Please allow microphone permission and try again.");
    }

    if (callType === "video" && !stream.getVideoTracks().length) {
      stopStream(stream);
      throw new Error("Camera track was not created. Please allow camera permission and try again.");
    }

    stream.getTracks().forEach((track) => {
      track.enabled = true;
    });

    return stream;
  }, [stopStream]);

  const addLocalTracksToPeer = useCallback((peer: NativePeerConnection, stream: NativeMediaStream) => {
    const audioTracks = stream.getAudioTracks();
    const otherTracks = stream.getTracks().filter((track) => track.kind !== "audio");

    audioTracks.forEach((track) => peer.addTrack(track, stream));
    otherTracks.forEach((track) => peer.addTrack(track, stream));
  }, []);

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !socket) return;

    const nextTargetUserId = incomingCall.senderId || "";
    if (!incomingCall.conversationId || !nextTargetUserId) {
      Alert.alert("Call unavailable", "This incoming call is missing participant details.");
      return;
    }

    try {
      const bufferedCandidates = pendingIceCandidatesRef.current;
      resetCallState();
      pendingIceCandidatesRef.current = bufferedCandidates;
      setResolvedConversationId(incomingCall.conversationId);
      setIncomingCall(incomingCall);
      setActiveCall(incomingCall.callType);
      setCallStatus("connecting");

      const stream = prepareLocalStreamForCall(await createLocalStream(incomingCall.callType), incomingCall.callType);
      localStreamRef.current = stream;
      setLocalStreamUrl(stream.toURL());
      startCallAudioRoute(incomingCall.callType);

      const peer = createPeerConnection();
      peerRef.current = peer;
      activeCallRef.current = {
        conversationId: incomingCall.conversationId,
        targetUserId: nextTargetUserId,
        callType: incomingCall.callType,
      };

      addLocalTracksToPeer(peer, stream);
      attachPeerListeners(peer, incomingCall.callType);

      if (incomingCall.offer) {
        const webRTC = getWebRTCOrThrow();
        await peer.setRemoteDescription(new webRTC.RTCSessionDescription(incomingCall.offer));
        await flushPendingIceCandidates(peer);
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("call:signal", {
        conversationId: incomingCall.conversationId,
        targetUserId: nextTargetUserId,
        signalType: "answer",
        signal: answer,
        callType: incomingCall.callType,
      } satisfies CallSignalPayload);

      setIncomingCall(null);
      setCallStatus("active");
      setCallStartedAt(Date.now());
      setCallSeconds(0);
    } catch (error) {
      resetCallState();
      const message = error instanceof Error ? error.message : "Could not join the call.";
      setCallError(message);
      Alert.alert("Call failed", message);
    }
  }, [addLocalTracksToPeer, attachPeerListeners, createLocalStream, flushPendingIceCandidates, incomingCall, prepareLocalStreamForCall, resetCallState, socket, startCallAudioRoute]);

  const declineIncomingCall = useCallback(() => {
    if (socket && incomingCall?.senderId) {
      socket.emit("call:end", {
        conversationId: incomingCall.conversationId,
        targetUserId: incomingCall.senderId,
        callType: incomingCall.callType,
      });
    }
    void AsyncStorage.removeItem(PENDING_INCOMING_CALL_CANDIDATES_STORAGE_KEY);
    resetCallState();
  }, [incomingCall, resetCallState, socket]);

  useEffect(() => {
    if (!autoAcceptIncomingCall || !incomingCall || !socket || callStatus !== "ringing") return;
    setAutoAcceptIncomingCall(false);
    void acceptIncomingCall();
  }, [acceptIncomingCall, autoAcceptIncomingCall, callStatus, incomingCall, socket]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (payload: ChatMessage) => {
      if (payload.conversationId !== conversationId) return;
      setMessages((current) => {
        if (current.some((message) => message.id === payload.id)) return current;
        return [...current, payload];
      });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
    };

    socket.on("chat:message:new", handleNewMessage);
    return () => {
      socket.off("chat:message:new", handleNewMessage);
    };
  }, [conversationId, socket]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleConversationUpdated = (payload: { conversationId?: string; blockedBy?: string | null }) => {
      if (payload?.conversationId && payload.conversationId !== conversationId) return;
      if (Object.prototype.hasOwnProperty.call(payload || {}, "blockedBy")) {
        setBlockedBy(payload.blockedBy || null);
      }
      void refetchConversations();
      void refetchMessages();
      if (payload?.conversationId === conversationId) {
        void markRead(conversationId);
      }
    };

    socket.on("chat:created", handleConversationUpdated);
    socket.on("chat:conversation:updated", handleConversationUpdated);

    return () => {
      socket.off("chat:created", handleConversationUpdated);
      socket.off("chat:conversation:updated", handleConversationUpdated);
    };
  }, [conversationId, markRead, refetchConversations, refetchMessages, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleInvite = (payload: CallInvitePayload) => {
      const isRelevantConversation =
        payload.conversationId === conversationId ||
        (payload.senderId && payload.senderId === targetUserId);

      if (!isRelevantConversation) return;
      if (payload.senderId) {
        socket.emit("call:end", {
          conversationId: payload.conversationId,
          targetUserId: payload.senderId,
          callType: payload.callType,
          reason: "unavailable",
        });
      }
      resetCallState();
    };

    const handleSignal = async (payload: CallSignalPayload) => {
      const isSameConversation =
        payload.conversationId === activeCallRef.current?.conversationId ||
        payload.conversationId === incomingCall?.conversationId;

      if (!isSameConversation || !payload.signalType || !payload.signal) return;

      if (payload.signalType === "answer") {
        if (!peerRef.current) return;
        const webRTC = getWebRTCOrThrow();
        await peerRef.current.setRemoteDescription(
          new webRTC.RTCSessionDescription(payload.signal as NativeRTCSessionDescriptionInit)
        );
        setCallStatus("active");
        setCallStartedAt(Date.now());
        setCallSeconds(0);
        return;
      }

      if (payload.signalType === "candidate") {
        if (!peerRef.current) {
          pendingIceCandidatesRef.current = [
            ...pendingIceCandidatesRef.current,
            payload.signal as NativeRTCIceCandidateInit,
          ];
          return;
        }
        try {
          const webRTC = getWebRTCOrThrow();
          await peerRef.current.addIceCandidate(
            new webRTC.RTCIceCandidate(payload.signal as NativeRTCIceCandidateInit)
          );
        } catch {
          // Ignore late ICE candidates after teardown.
        }
        return;
      }

      if (payload.signalType === "offer") {
        setIncomingCall((current) => ({
          ...(current || {
            conversationId: payload.conversationId,
            senderId: payload.senderId,
            senderName: displayName,
            senderAvatar: displayAvatar,
            callType: payload.callType || "voice",
          }),
          offer: payload.signal as NativeRTCSessionDescriptionInit,
        }));
      }
    };

    const handleEnd = (payload: CallSignalPayload) => {
      const isCurrentConversation =
        payload.conversationId === activeCallRef.current?.conversationId ||
        payload.conversationId === incomingCall?.conversationId;

      if (!isCurrentConversation) return;
      resetCallState();
    };

    const handleBlocked = (payload: { conversationId?: string; reason?: string }) => {
      if (
        payload.conversationId &&
        payload.conversationId !== conversationId &&
        payload.conversationId !== activeCallRef.current?.conversationId
      ) {
        return;
      }
      resetCallState();
      Alert.alert("Call unavailable", payload.reason || "Audio and video calls are not available with admin support.");
    };

    socket.on("call:invite", handleInvite);
    socket.on("call:signal", handleSignal);
    socket.on("call:end", handleEnd);
    socket.on("call:blocked", handleBlocked);

    return () => {
      socket.off("call:invite", handleInvite);
      socket.off("call:signal", handleSignal);
      socket.off("call:end", handleEnd);
      socket.off("call:blocked", handleBlocked);
    };
  }, [canStartCalls, conversationId, displayAvatar, displayName, incomingCall?.conversationId, resetCallState, socket, targetUserId]);

  const handlePickAttachments = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to attach images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });

    if (result.canceled) return;

    setAttachmentAssets((current) => {
      const next = [...current];
      result.assets.slice(0, Math.max(0, 4 - current.length)).forEach((asset, index) => {
        next.push({
          uri: asset.uri,
          name: asset.fileName || `attachment-${Date.now()}-${index + 1}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      });
      return next.slice(0, 4);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachmentAssets.length) || !conversationId || !canSend) return;
    const formData = new FormData();
    formData.append("text", input.trim());
    attachmentAssets.forEach((asset) => {
      formData.append("attachments", {
        uri: asset.uri,
        name: asset.name,
        type: asset.type,
      } as never);
    });

    try {
      const payload = await sendMessage({ conversationId, formData }).unwrap();
      setMessages((current) => {
        if (current.some((message) => message.id === payload.data.id)) return current;
        return [...current, payload.data];
      });
      setInput("");
      setAttachmentAssets([]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // Keep the current composer state if sending fails.
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId) return;
    try {
      await clearHistory(conversationId).unwrap();
      setMessages([]);
      setMenuOpen(false);
    } catch (error) {
      Alert.alert("Could not clear chat", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleToggleBlock = async () => {
    if (!conversationId) return;
    try {
      if (isBlockedByMe) {
        const payload = await unblockUser(conversationId).unwrap();
        setBlockedBy(payload.data.blockedBy || null);
      } else {
        const payload = await blockUser(conversationId).unwrap();
        setBlockedBy(payload.data.blockedBy || user?.id || "me");
      }
      setMenuOpen(false);
    } catch (error) {
      Alert.alert(
        "Could not update block status",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  };

  const resetProposalComposer = () => {
    setProposalTitle("");
    setProposalDescription("");
    setProposalPrice("");
    setProposalAddress("");
    setProposalDate("");
    setProposalTime("");
    setShowProposalComposer(false);
  };

  const handleCreateProposal = async () => {
    const numericPrice = Number(proposalPrice);
    if (!canOpenProposalComposer || !proposalTitle.trim() || !proposalAddress.trim() || !proposalDate || !proposalTime || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert("Missing fields", `Complete all ${isRepeatProposalMode ? "repeat order" : "custom order"} fields first.`);
      return;
    }

    if (!isFutureSchedule(proposalDate, proposalTime)) {
      Alert.alert("Invalid schedule", "Please select a future preferred date and time.");
      return;
    }

    try {
      const payload = await createCustomOrderProposal({
        conversationId,
        gigId: selectedGigId || undefined,
        proposalType: isRepeatProposalMode ? "repeat_order" : "custom",
        sourceOrderId: repeatSourceOrderId || undefined,
        title: proposalTitle.trim(),
        description: proposalDescription.trim(),
        price: numericPrice,
        serviceAddress: proposalAddress.trim(),
        scheduledDate: proposalDate,
        scheduledTime: proposalTime,
      }).unwrap();
      setMessages((current) => {
        if (current.some((message) => message.id === payload.data.id)) return current;
        return [...current, payload.data];
      });
      resetProposalComposer();
    } catch (error) {
      Alert.alert("Could not send request", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleRespondProposal = async (proposalId: string, action: "accept" | "decline") => {
    try {
      const payload = await respondToCustomOrderProposal({ proposalId, action }).unwrap();
      const proposalType = payload.data?.message?.customOrderProposal?.proposalType || "custom";
      if (payload.data?.message) {
        setMessages((current) => {
          if (current.some((message) => message.id === payload.data.message.id)) return current;
          return [...current, payload.data.message];
        });
      }
      Alert.alert(
        action === "accept" ? "Accepted" : "Declined",
        action === "accept"
          ? proposalType === "repeat_order"
            ? "Repeat order started."
            : "Custom order started."
          : proposalType === "repeat_order"
            ? "Repeat order request declined."
            : "Custom order request declined."
      );
    } catch (error) {
      Alert.alert("Could not update request", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
          zIndex: 10,
        }}
        className="bg-white rounded-b-[40px] px-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4 pt-2">
          <Ionicons name="arrow-back" size={24} color="#2286BE" />
          <Text className="text-[#2286BE] font-bold text-[18px] ml-2">Go Back</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between pb-2">
          <View className="flex-row items-center flex-1 pr-4">
            <ProfileAvatar uri={displayAvatar} size={52} iconSize={24} className="mr-4" />
            <View className="flex-1">
              <Text className="text-[20px] font-bold text-[#2286BE]" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-[14px] font-medium text-[#7C8B95] mt-1" numberOfLines={1}>
                {displayInfo}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              className="w-11 h-11 rounded-full bg-[#F8FAFC] items-center justify-center"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#1A2C42" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS === "ios" || isKeyboardVisible}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {ensuringConversation || (!conversationId && orderId) ? (
          <View className="flex-1 items-center justify-center px-8">
            <ActivityIndicator size="large" color="#2286BE" />
            <Text className="text-[#7C8B95] text-[14px] font-medium mt-4 text-center">
              Loading your conversation history...
            </Text>
          </View>
        ) : isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2286BE" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6 pt-6"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {!messages.length ? (
              <View className="items-center justify-center px-8 py-20">
                <View className="w-16 h-16 rounded-full bg-[#EAF3FA] items-center justify-center mb-5">
                  <Ionicons name="chatbubble-ellipses-outline" size={28} color="#2286BE" />
                </View>
                <Text className="text-[20px] font-bold text-[#1A2C42] text-center">
                  No chat history yet
                </Text>
                <Text className="text-[14px] text-[#7C8B95] text-center mt-2 leading-6">
                  Previous messages will appear here as soon as this conversation has activity.
                </Text>
              </View>
            ) : null}
            {messages.map((item) => {
              const isMe = item.senderId === user?.id;
              return (
                <View
                  key={item.id}
                  className={`flex-row mb-8 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <ProfileAvatar uri={displayAvatar} size={32} iconSize={16} className="mr-3 mt-1" />
                  )}
                  <View className="max-w-[75%]">
                    <View
                      style={{
                        borderBottomLeftRadius: isMe ? 20 : 4,
                        borderBottomRightRadius: isMe ? 4 : 20,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                      }}
                      className={`px-5 py-4 ${isMe ? "bg-[#2286BE]" : "bg-white border border-[#F2F2F2]"}`}
                    >
                      {item.text ? (
                        <Text
                          className={`text-[15px] leading-[22px] font-medium ${isMe ? "text-white" : "text-[#4A5568]"}`}
                        >
                          {item.text}
                        </Text>
                      ) : null}
                      {item.customOrderProposal ? (
                        <View className={`mt-3 rounded-[20px] border px-4 py-4 ${isMe ? "border-white/20 bg-white/10" : "border-[#E2E8F0] bg-[#F8FAFC]"}`}>
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 pr-3">
                              <Text className={`text-[11px] font-bold uppercase tracking-[2px] ${isMe ? "text-white/70" : "text-[#2286BE]"}`}>
                                {item.customOrderProposal.proposalType === "repeat_order" ? "Repeat Order" : "Custom Order"}
                              </Text>
                              <Text className={`text-[16px] font-bold mt-2 ${isMe ? "text-white" : "text-[#1A2C42]"}`}>
                                {item.customOrderProposal.title}
                              </Text>
                            </View>
                            <View className={`rounded-full px-3 py-1 ${
                              item.customOrderProposal.status === "accepted"
                                ? "bg-emerald-100"
                                : item.customOrderProposal.status === "declined"
                                  ? "bg-rose-100"
                                  : "bg-amber-100"
                            }`}>
                              <Text className={`text-[10px] font-bold uppercase ${
                                item.customOrderProposal.status === "accepted"
                                  ? "text-emerald-700"
                                  : item.customOrderProposal.status === "declined"
                                    ? "text-rose-700"
                                    : "text-amber-700"
                              }`}>
                                {item.customOrderProposal.status}
                              </Text>
                            </View>
                          </View>
                          {item.customOrderProposal.description ? (
                            <Text className={`text-[14px] leading-[21px] mt-3 ${isMe ? "text-white/85" : "text-[#5F7182]"}`}>
                              {item.customOrderProposal.description}
                            </Text>
                          ) : null}
                          <Text className={`text-[14px] font-bold mt-3 ${isMe ? "text-white" : "text-[#1A2C42]"}`}>
                            ${Number(item.customOrderProposal.price || 0).toFixed(2)}
                          </Text>
                          <Text className={`text-[13px] font-medium mt-1 ${isMe ? "text-white/80" : "text-[#5F7182]"}`}>
                            {toScheduleTimeLabel(item.customOrderProposal.scheduledTime) || item.customOrderProposal.scheduledTime} • {item.customOrderProposal.serviceAddress}
                          </Text>
                          {!isMe && user?.role === "client" && item.customOrderProposal.status === "pending" ? (
                            <View className="flex-row mt-4">
                              <TouchableOpacity
                                onPress={() => void handleRespondProposal(item.customOrderProposal!.id, "accept")}
                                disabled={respondingProposal}
                                className="flex-1 bg-[#2286BE] rounded-[16px] py-3 items-center mr-2"
                              >
                                <Text className="text-white font-bold">Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => void handleRespondProposal(item.customOrderProposal!.id, "decline")}
                                disabled={respondingProposal}
                                className="flex-1 bg-white border border-[#CBD5E1] rounded-[16px] py-3 items-center"
                              >
                                <Text className="text-[#1A2C42] font-bold">Decline</Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      {Array.isArray(item.attachments) && item.attachments.length > 0 ? (
                        <View className={item.text ? "mt-3" : ""}>
                          {item.attachments.map((attachment, index) => {
                            const isImage = String(attachment.mimeType || "").startsWith("image/");
                            return isImage ? (
                              <Image
                                key={`${item.id}-${index}`}
                                source={{ uri: attachment.url }}
                                className="w-[180px] h-[140px] rounded-[16px] mb-2 bg-slate-100"
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                key={`${item.id}-${index}`}
                                className={`rounded-[14px] px-3 py-3 mb-2 ${isMe ? "bg-white/10" : "bg-[#F8FAFC]"}`}
                              >
                                <Text
                                  className={`text-[13px] font-bold ${isMe ? "text-white" : "text-[#1A2C42]"}`}
                                >
                                  {attachment.fileName || "Attachment"}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      ) : null}
                      <Text
                        className={`text-[12px] mt-2 font-medium ${isMe ? "text-white/70" : "text-[#7C8B95]"}`}
                      >
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {isBlockedByOther ? (
              <View className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 mb-6">
                <Text className="text-[14px] font-bold text-amber-800">
                  You can no longer send messages to this user.
                </Text>
              </View>
            ) : null}

            <View className="h-4" />
            <View style={{ height: insets.bottom + 12 }} />
          </ScrollView>
        )}

        {attachmentAssets.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="px-6 py-3 bg-white border-t border-[#F2F2F2]"
          >
            {attachmentAssets.map((asset) => (
              <View key={asset.uri} className="mr-3 relative">
                <Image
                  source={{ uri: asset.uri }}
                  className="w-[74px] h-[74px] rounded-[18px] bg-slate-100"
                />
                <TouchableOpacity
                  onPress={() =>
                    setAttachmentAssets((current) =>
                      current.filter((item) => item.uri !== asset.uri)
                    )
                  }
                  className="absolute -top-1 -right-1 bg-[#1A2C42] rounded-full"
                >
                  <Ionicons name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {canOpenProposalComposer && showProposalComposer ? (
          <KeyboardAwareScrollView
            className="bg-white border-t border-[#F2F2F2]"
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-[12px] font-bold uppercase tracking-[2px] text-[#2286BE] mb-3">
              {isRepeatProposalMode ? "Create Repeat Order" : "Create Custom Order"}
            </Text>
            <TextInput value={proposalTitle} onChangeText={setProposalTitle} placeholder="Order title" placeholderTextColor="#7C8B95" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] mb-3 text-[#1A2C42]" />
            <TextInput value={proposalPrice} onChangeText={setProposalPrice} keyboardType="decimal-pad" placeholder="Price" placeholderTextColor="#7C8B95" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] mb-3 text-[#1A2C42]" />
            <TextInput value={proposalAddress} onChangeText={setProposalAddress} placeholder="Service address" placeholderTextColor="#7C8B95" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] mb-3 text-[#1A2C42]" />
            <SchedulePickerFields
              dateValue={proposalDate}
              timeValue={proposalTime}
              onDateChange={setProposalDate}
              onTimeChange={setProposalTime}
              className="flex-row mb-3"
              inputClassName="bg-[#F8FAFC]"
              labelClassName="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7C8B95] mb-2 ml-1"
            />
            <TextInput value={proposalDescription} onChangeText={setProposalDescription} multiline textAlignVertical="top" placeholder={isRepeatProposalMode ? "Describe the updated repeat order details" : "Describe the custom work"} placeholderTextColor="#7C8B95" className="bg-[#F8FAFC] rounded-[18px] px-4 py-4 text-[15px] min-h-[88px] text-[#1A2C42]" />
            <View className="flex-row mt-4">
              <TouchableOpacity onPress={() => void handleCreateProposal()} disabled={creatingProposal} className="flex-1 bg-[#2286BE] rounded-[18px] py-4 items-center mr-3">
                {creatingProposal ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">{isRepeatProposalMode ? "Send Offer" : "Send Request"}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={resetProposalComposer} className="px-5 rounded-[18px] border border-[#CBD5E1] items-center justify-center">
                <Text className="text-[#1A2C42] font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        ) : null}

        <View
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 10,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom + 12, 24),
          }}
          className="bg-white px-6 pt-4 border-t border-[#F2F2F2] flex-row items-center"
        >
          {canOpenProposalComposer ? (
            <TouchableOpacity
              onPress={() => setShowProposalComposer((current) => !current)}
              className="mr-3 w-[48px] h-[48px] rounded-full bg-[#F8FAFC] items-center justify-center"
            >
              <Ionicons name="document-text-outline" size={21} color="#2286BE" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => void handlePickAttachments()}
            className="mr-3 w-[48px] h-[48px] rounded-full bg-[#EAF3FA] items-center justify-center"
          >
            <Ionicons name="attach" size={22} color="#2286BE" />
          </TouchableOpacity>
          <View className="flex-1 mr-4 overflow-hidden rounded-[20px] border border-[#7C8B95]/30">
            <TextInput
              placeholder={
                isBlockedByOther
                  ? "You can no longer message this user."
                  : isBlockedByMe
                    ? "Unblock this user to continue."
                    : "Type a message..."
              }
              placeholderTextColor="#7C8B95"
              className="px-5 py-4 text-[16px] font-medium text-[#1A2C42]"
              value={input}
              onChangeText={setInput}
              multiline
              editable={canSend}
            />
          </View>

          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={sending || !canSend}
            className={`w-[54px] h-[54px] rounded-full items-center justify-center ${canSend ? "bg-[#2286BE]" : "bg-[#CBD5E1]"}`}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="send" size={24} color="white" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={menuOpen} animationType="slide" transparent onRequestClose={() => setMenuOpen(false)}>
        <View className="flex-1 justify-end bg-black/35">
          <View className="bg-white rounded-t-[32px] px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-[22px] font-bold text-[#1A2C42]">Conversation Options</Text>
              <TouchableOpacity
                onPress={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#1A2C42" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => void handleToggleBlock()}
              disabled={blockingUser || unblockingUser}
              className="bg-white border border-gray-200 rounded-[18px] px-5 py-4 mb-3"
            >
              <Text className="text-[16px] font-bold text-[#1A2C42]">
                {blockingUser || unblockingUser ? "Updating..." : isBlockedByMe ? "Unblock User" : "Block User"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleClearHistory()}
              disabled={clearingHistory}
              className="bg-white border border-red-100 rounded-[18px] px-5 py-4"
            >
              <Text className="text-[16px] font-bold text-[#FF4757]">
                {clearingHistory ? "Clearing..." : "Clear Conversation History"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={callModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (incomingCall && callStatus === "ringing") {
            declineIncomingCall();
            return;
          }
          cleanupCall(true);
        }}
      >
        <View className={`${isVideoCall ? "flex-1 bg-black" : "flex-1 bg-[#06131D]/90 px-5 py-8 justify-center"}`}>
          {remoteStreamUrl && !isVideoCall ? (
            <WebRTCVideoView
              streamURL={remoteStreamUrl}
              objectFit="cover"
              style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            />
          ) : null}
          {localStreamUrl && !isVideoCall ? (
            <WebRTCVideoView
              streamURL={localStreamUrl}
              objectFit="cover"
              mirror
              style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            />
          ) : null}
          {isVideoCall ? (
            <View className="flex-1 bg-black">
              {remoteStreamUrl ? (
                <WebRTCVideoView
                  streamURL={remoteStreamUrl}
                  objectFit="cover"
                  style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
                />
              ) : (
                <View
                  className="items-center justify-center bg-[#08131B] px-8"
                  style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <ProfileAvatar
                    uri={incomingCall?.senderAvatar || displayAvatar}
                    size={108}
                    iconSize={44}
                    className="mb-5"
                  />
                  <Text className="text-white text-[24px] font-bold text-center">{callTitle}</Text>
                  <Text className="text-white/65 text-[14px] mt-2 text-center">
                    {callStatus === "ringing" ? "Waiting for the other person to respond." : "Setting up video."}
                  </Text>
                </View>
              )}

              <View className="absolute left-5 right-5 top-12 flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-white text-[24px] font-bold" numberOfLines={1}>
                    {callTitle}
                  </Text>
                  <Text className="text-white/80 text-[14px] font-medium mt-2">
                    Video call{" "}
                    {callStatus === "active"
                      ? `live • ${callDurationLabel}`
                      : callStatus === "ringing"
                        ? "ringing"
                        : "connecting"}
                  </Text>
                </View>
                {localStreamUrl ? (
                  <View className="w-[112px] h-[158px] overflow-hidden rounded-[22px] border-2 border-white/60 bg-[#0F172A]">
                    <WebRTCVideoView streamURL={localStreamUrl} className="w-full h-full" objectFit="cover" mirror />
                  </View>
                ) : null}
              </View>

              {callError ? (
                <View className="absolute left-5 right-5 bottom-28 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
                  <Text className="text-red-700 font-bold">{callError}</Text>
                </View>
              ) : null}

              <View className="absolute bottom-10 left-0 right-0 flex-row items-center justify-center">
                {incomingCall && callStatus === "ringing" ? (
                  <>
                    <TouchableOpacity
                      onPress={() => void acceptIncomingCall()}
                      className="bg-[#18A957] px-7 py-4 rounded-full mr-4"
                    >
                      <Text className="text-white font-bold text-[16px]">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={declineIncomingCall}
                      className="bg-[#E11D48] px-7 py-4 rounded-full"
                    >
                      <Text className="text-white font-bold text-[16px]">Decline</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => cleanupCall(true)}
                    className="bg-[#E11D48] px-9 py-4 rounded-full"
                  >
                    <Text className="text-white font-bold text-[16px]">End Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
          <View className="bg-white rounded-[34px] overflow-hidden">
            <View className="px-6 pt-6 pb-5 bg-[#2286BE]">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-white text-[24px] font-bold" numberOfLines={1}>
                    {callTitle}
                  </Text>
                  <Text className="text-white/80 text-[14px] font-medium mt-2">
                    {(activeCall || incomingCall?.callType) === "video" ? "Video call" : "Voice call"}{" "}
                    {callStatus === "active"
                      ? `live • ${callDurationLabel}`
                      : callStatus === "ringing"
                        ? "ringing"
                        : "connecting"}
                  </Text>
                </View>
                <View className="w-14 h-14 rounded-full bg-white/15 items-center justify-center">
                  <Ionicons
                    name={(activeCall || incomingCall?.callType) === "video" ? "videocam" : "call"}
                    size={26}
                    color="white"
                  />
                </View>
              </View>
            </View>

            <View className="p-5">
              <View className="rounded-[28px] bg-[#08131B] overflow-hidden mb-4">
                {(activeCall || incomingCall?.callType) === "video" && remoteStreamUrl ? (
                  <WebRTCVideoView streamURL={remoteStreamUrl} className="w-full h-[280px]" objectFit="cover" />
                ) : (
                  <View className="h-[280px] items-center justify-center px-8 bg-[#08131B]">
                    <ProfileAvatar
                      uri={incomingCall?.senderAvatar || displayAvatar}
                      size={96}
                      iconSize={40}
                      className="mb-5"
                    />
                    <Text className="text-white text-[22px] font-bold text-center">{callTitle}</Text>
                    <Text className="text-white/65 text-[14px] mt-2 text-center">
                      {remoteStreamUrl
                        ? "Call connected."
                        : callStatus === "ringing"
                          ? "Waiting for the other person to respond."
                          : "Setting up the secure connection."}
                    </Text>
                  </View>
                )}
              </View>

              <View className="rounded-[24px] border border-[#E2E8F0] px-4 py-4 mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-[11px] font-bold tracking-[2px] text-[#7C8B95] uppercase">
                      Your Preview
                    </Text>
                    <Text className="text-[15px] font-bold text-[#1A2C42] mt-2">
                      {localStreamUrl
                        ? (activeCall || incomingCall?.callType) === "video"
                          ? "Camera and microphone are ready."
                          : "Microphone is ready."
                        : "Preparing your device."}
                    </Text>
                  </View>
                  <View className="w-[110px] h-[160px] rounded-[22px] overflow-hidden bg-[#0F172A]">
                    {(activeCall || incomingCall?.callType) === "video" && localStreamUrl ? (
                      <WebRTCVideoView streamURL={localStreamUrl} className="w-full h-full" objectFit="cover" mirror />
                    ) : (
                      <View className="flex-1 items-center justify-center px-4">
                        <Ionicons name="mic" size={28} color="white" />
                        <Text className="text-white/70 text-[12px] font-medium mt-3 text-center">
                          Voice only
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View className="rounded-[22px] bg-[#F8FAFC] px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[11px] font-bold tracking-[2px] text-[#7C8B95] uppercase">
                      Status
                    </Text>
                    <Text className="text-[16px] font-bold text-[#1A2C42] mt-2">
                      {callStatus === "active"
                        ? "Connected"
                        : callStatus === "ringing"
                          ? "Ringing"
                          : "Connecting"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[11px] font-bold tracking-[2px] text-[#7C8B95] uppercase">
                      Duration
                    </Text>
                    <Text className="text-[20px] font-black text-[#1A2C42] mt-2">
                      {callDurationLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {callError ? (
                <View className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 mt-4">
                  <Text className="text-red-700 font-bold">{callError}</Text>
                </View>
              ) : null}

              <View className="flex-row items-center justify-center mt-6">
                {incomingCall && callStatus === "ringing" ? (
                  <>
                    <TouchableOpacity
                      onPress={() => void acceptIncomingCall()}
                      className="bg-[#18A957] px-6 py-4 rounded-full mr-3"
                    >
                      <Text className="text-white font-bold text-[16px]">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={declineIncomingCall}
                      className="bg-[#E11D48] px-6 py-4 rounded-full"
                    >
                      <Text className="text-white font-bold text-[16px]">Decline</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => cleanupCall(true)}
                    className="bg-[#E11D48] px-8 py-4 rounded-full"
                  >
                    <Text className="text-white font-bold text-[16px]">End Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          )}
        </View>
      </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}
