'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Banknote,
  Briefcase,
  Camera,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Eye,
  EyeOff,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import MapboxLocationPicker from '@/components/profile/MapboxLocationPicker';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import { resolveAddressFromCoordinates } from '@/lib/geocodeAddress';
import {
  useChangePasswordMutation,
  useSubmitProviderPayoutInfoMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '@/store/services/apiSlice';

const normalizeAddressText = (value: string) => {
  const trimmed = value.trim();
  const isLatLng = /^lat\s*-?\d+(\.\d+)?\s*,\s*lng\s*-?\d+(\.\d+)?$/i.test(trimmed);
  if (!isLatLng) return value;
  return 'Area unavailable, District unavailable, ZIP N/A';
};

type ProviderProfileResponseUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  businessBio?: string;
  experienceLevel?: string;
  serviceCity?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  serviceLocationLat?: number | null;
  serviceLocationLng?: number | null;
  payoutVerificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  payoutInfo?: Record<string, unknown>;
};

export default function ProviderProfilePage() {
  const { user, role, logout, updateProfile } = useAuth();
  const { detectLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [contactNameDraft, setContactNameDraft] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const [experienceDraft, setExperienceDraft] = useState<string | null>(null);
  const [serviceCityDraft, setServiceCityDraft] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isResolvingCity, setIsResolvingCity] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [updateProfileMutation] = useUpdateProfileMutation();
  const [uploadAvatarMutation] = useUploadAvatarMutation();
  const [changePasswordMutation] = useChangePasswordMutation();
  const [submitProviderPayoutInfoMutation] = useSubmitProviderPayoutInfoMutation();
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.006,
  });
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | ''>('');
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);
  const [nidFrontPreview, setNidFrontPreview] = useState('');
  const [nidBackPreview, setNidBackPreview] = useState('');
  const [isSubmittingPayoutVerification, setIsSubmittingPayoutVerification] = useState(false);
  const [isPayoutEditMode, setIsPayoutEditMode] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const defaultContactName = user ? user.name || `${user.firstName} ${user.lastName}`.trim() : '';
  const defaultBusinessBio = user?.businessBio || '';
  const defaultExperience = user?.experienceLevel || '';
  const defaultServiceCity = user?.serviceCity || '';
  const defaultAvatarSrc = user?.avatar || '';
  const payoutStatus = user?.payoutVerificationStatus || 'unverified';
  const canEditPayout =
    payoutStatus === 'unverified' || payoutStatus === 'rejected' || isPayoutEditMode;

  useEffect(() => {
    setAccountHolderName(user?.payoutInfo?.accountHolderName || '');
    setBankAccountNumber(user?.payoutInfo?.bankAccountNumber || '');
    setRoutingNumber(user?.payoutInfo?.routingNumber || '');
    setBankName(user?.payoutInfo?.bankName || '');
    setAccountType((user?.payoutInfo?.accountType as 'checking' | 'savings' | '') || '');
    setNidFrontPreview(user?.payoutInfo?.nidFrontImageUrl || '');
    setNidBackPreview(user?.payoutInfo?.nidBackImageUrl || '');
  }, [user?.payoutInfo]);

  useEffect(() => {
    setIsPayoutEditMode(false);
  }, [payoutStatus]);

  const contactName = contactNameDraft ?? defaultContactName;
  const businessBio = bioDraft ?? defaultBusinessBio;
  const experienceLevel = experienceDraft ?? defaultExperience;
  const rawServiceCity = serviceCityDraft ?? defaultServiceCity;
  const serviceCity = normalizeAddressText(rawServiceCity);
  const avatar = avatarDraft ?? defaultAvatarSrc;

  const savedServiceLat = typeof user?.serviceLocationLat === 'number' ? user.serviceLocationLat : null;
  const savedServiceLng = typeof user?.serviceLocationLng === 'number' ? user.serviceLocationLng : null;
  useEffect(() => {
    if (savedServiceLat !== null && savedServiceLng !== null) {
      setSelectedMapCoords({ lat: savedServiceLat, lng: savedServiceLng });
    }
  }, [savedServiceLat, savedServiceLng]);

  const resetDrafts = () => {
    setContactNameDraft(null);
    setBioDraft(null);
    setExperienceDraft(null);
    setServiceCityDraft(null);
    setAvatarDraft(null);

    if (savedServiceLat !== null && savedServiceLng !== null) {
      setSelectedMapCoords({ lat: savedServiceLat, lng: savedServiceLng });
    }
  };

  const persistServiceLocation = async (nextCity: string, lat: number, lng: number) => {
    try {
      const payload = await updateProfileMutation({
        serviceCity: nextCity,
        serviceLocationLat: lat,
        serviceLocationLng: lng,
      }).unwrap();
      if (!payload?.success) return false;

      const nextUser = payload?.data?.user;
      updateProfile({
        serviceCity: typeof nextUser?.serviceCity === 'string' ? nextUser.serviceCity : nextCity,
        serviceLocationLat:
          typeof nextUser?.serviceLocationLat === 'number' ? nextUser.serviceLocationLat : lat,
        serviceLocationLng:
          typeof nextUser?.serviceLocationLng === 'number' ? nextUser.serviceLocationLng : lng,
      });
      return true;
    } catch {
      return false;
    }
  };

  const saveCoordinatesAsServiceCity = async (lat: number, lng: number, successMessage: string) => {
    setIsResolvingCity(true);
    const nextCity = await resolveAddressFromCoordinates(lat, lng, mapboxToken);
    setServiceCityDraft(nextCity);
    setSelectedMapCoords({ lat, lng });
    const persisted = await persistServiceLocation(nextCity, lat, lng);
    if (!persisted) {
      updateProfile({
        serviceCity: nextCity,
        serviceLocationLat: lat,
        serviceLocationLng: lng,
      });
    }
    setIsResolvingCity(false);
    toast.success(persisted ? successMessage : `${successMessage} (Saved locally. Press Save to persist if needed.)`);
  };

  const handleUseCurrentLocation = async () => {
    detectLocation();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void saveCoordinatesAsServiceCity(
            position.coords.latitude,
            position.coords.longitude,
            'Service city updated from current location.'
          );
        },
        async () => {
          toast.error('Could not detect your current location. Please allow location permission and try again.');
        }
      );
      return;
    }

    toast.error('Geolocation is not available in this browser.');
  };

  const handleSetCenterAsServiceCity = async () => {
    await saveCoordinatesAsServiceCity(
      selectedMapCoords.lat,
      selectedMapCoords.lng,
      'Map center saved as service city.'
    );
  };

  const handleUploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }

    const uploadAvatar = async () => {
      const formData = new FormData();
      formData.append('image', file);

      setIsUploadingAvatar(true);
      try {
        const payload = await uploadAvatarMutation(formData).unwrap();
        if (!payload?.success) {
          toast.error(payload?.message || 'Failed to upload profile image.');
          return;
        }

        const nextAvatarUrl = payload?.data?.avatarUrl;
        if (!nextAvatarUrl) {
          toast.error('Upload succeeded but image URL was missing.');
          return;
        }

        setAvatarDraft(nextAvatarUrl);
        updateProfile({ avatar: nextAvatarUrl });
        toast.success('Profile image updated.');
      } catch {
        toast.error('Could not upload image right now.');
      } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    void uploadAvatar();
  };

  const handleSaveBusinessProfile = async () => {
    const cleanContactName = contactName.trim();
    if (!cleanContactName) {
      toast.error('Contact name is required.');
      return;
    }

    const [firstName, ...rest] = cleanContactName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');

    setIsSavingProfile(true);

    try {
      const payload = await updateProfileMutation({
        firstName,
        lastName,
        businessBio: businessBio.trim(),
        experienceLevel: experienceLevel.trim(),
        serviceCity: serviceCity.trim(),
        serviceLocationLat: selectedMapCoords.lat,
        serviceLocationLng: selectedMapCoords.lng,
      }).unwrap();
      if (!payload?.success) {
        toast.error(payload?.message || 'Failed to save business profile.');
        return;
      }

      const nextUser = (payload?.data?.user || {}) as ProviderProfileResponseUser;
      updateProfile({
        firstName: nextUser?.firstName ?? firstName,
        lastName: nextUser?.lastName ?? lastName,
        name: `${nextUser?.firstName ?? firstName} ${nextUser?.lastName ?? lastName}`.trim(),
        email: nextUser?.email ?? user?.email,
        avatar: nextUser?.avatar ?? avatar,
        businessBio: nextUser?.businessBio ?? businessBio.trim(),
        experienceLevel: nextUser?.experienceLevel ?? experienceLevel.trim(),
        serviceCity: nextUser?.serviceCity ?? serviceCity.trim(),
        serviceLocationLat:
          typeof nextUser?.serviceLocationLat === 'number'
            ? nextUser.serviceLocationLat
            : selectedMapCoords.lat,
        serviceLocationLng:
          typeof nextUser?.serviceLocationLng === 'number'
            ? nextUser.serviceLocationLng
            : selectedMapCoords.lng,
      });

      resetDrafts();
      toast.success(payload?.message || 'Business profile saved successfully.');
    } catch {
      toast.error('Could not save business profile right now.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancel = () => {
    resetDrafts();
    toast.info('Changes discarded.');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const payload = await changePasswordMutation({
        currentPassword,
        newPassword,
      }).unwrap();
      if (!payload?.success) {
        toast.error(payload?.message || 'Failed to update password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(payload?.message || 'Password updated successfully.');
    } catch {
      toast.error('Could not update password right now.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNidFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    if (!canEditPayout) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file for NID.');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (side === 'front') {
      setNidFrontFile(file);
      setNidFrontPreview(previewUrl);
    } else {
      setNidBackFile(file);
      setNidBackPreview(previewUrl);
    }
  };

  const handleVerifyPayoutInfo = async () => {
    if (!canEditPayout) return;
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !routingNumber.trim() || !bankName.trim() || !accountType) {
      toast.error('Please fill all payout fields before verification.');
      return;
    }

    if (!nidFrontPreview || !nidBackPreview) {
      toast.error('Please upload both NID front and back images.');
      return;
    }

    const formData = new FormData();
    formData.append('accountHolderName', accountHolderName.trim());
    formData.append('bankAccountNumber', bankAccountNumber.trim());
    formData.append('routingNumber', routingNumber.trim());
    formData.append('bankName', bankName.trim());
    formData.append('accountType', accountType);
    if (nidFrontFile) formData.append('nidFront', nidFrontFile);
    if (nidBackFile) formData.append('nidBack', nidBackFile);

    setIsSubmittingPayoutVerification(true);
    try {
      const payload = await submitProviderPayoutInfoMutation(formData).unwrap();
      if (!payload?.success) {
        toast.error(payload?.message || 'Failed to submit payout verification.');
        return;
      }

      const nextUser = payload?.data?.user as Record<string, unknown> | undefined;
      updateProfile({
        payoutVerificationStatus:
          (nextUser?.payoutVerificationStatus as 'unverified' | 'pending' | 'verified' | 'rejected') ||
          'pending',
        payoutInfo: (nextUser?.payoutInfo as Record<string, unknown>) || {
          accountHolderName: accountHolderName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          routingNumber: routingNumber.trim(),
          bankName: bankName.trim(),
          accountType,
          nidFrontImageUrl: nidFrontPreview,
          nidBackImageUrl: nidBackPreview,
          submittedAt: new Date().toISOString(),
          reviewedAt: null,
          rejectionReason: '',
        },
      });
      setNidFrontFile(null);
      setNidBackFile(null);
      setIsPayoutEditMode(false);
      toast.success(payload?.message || 'Verification request sent to admin.');
    } catch {
      toast.error('Could not submit payout verification right now.');
    } finally {
      setIsSubmittingPayoutVerification(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-200/40">
            <h2 className="text-2xl font-black text-slate-900">Please login first</h2>
            <p className="mt-3 text-slate-500 font-medium">
              You need an account session to access provider profile.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#2286BE] px-6 font-bold text-white"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'provider') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-200/40">
            <h2 className="text-2xl font-black text-slate-900">This page is only for provider role.</h2>
            <p className="mt-3 text-slate-500 font-medium">You are currently using client mode.</p>
            <Link
              href="/client/profile"
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#2286BE] px-6 font-bold text-white"
            >
              Open Client Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-80 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 text-center sticky top-24"
            >
              <div className="relative inline-block mb-6 group">
                <Avatar className="h-32 w-32 border-4 border-[#2286BE]/10 ring-2 ring-white">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="bg-slate-200 text-slate-500">
                    <User size={44} />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 h-10 w-10 bg-[#2286BE] text-white rounded-full border-4 border-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isUploadingAvatar ? <span className="text-[10px] font-black">...</span> : <Camera size={18} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{contactName || user.name}</h2>
              <p className="text-sm font-bold text-[#2286BE] uppercase tracking-widest mt-1">
                {payoutStatus === 'verified' ? 'Verified Provider' : 'Provider Account'}
              </p>

              <div className="mt-10 space-y-2">
                {[
                  { id: 'profile', icon: <Briefcase size={18} />, label: 'Business Profile' },
                  { id: 'payouts', icon: <Banknote size={18} />, label: 'Payout Info' },
                  { id: 'security', icon: <Shield size={18} />, label: 'Security' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                      activeTab === item.id
                        ? 'bg-[#2286BE]/10 text-[#2286BE] shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={16} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full text-red-500 hover:bg-red-50 hover:text-red-700 font-bold rounded-2xl h-12"
                >
                  <LogOut size={18} className="mr-3" /> Sign Out
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
            >
              <div className="p-8 md:p-12 space-y-8">
                {(payoutStatus === 'unverified' || payoutStatus === 'rejected') && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                    <p className="text-sm font-black text-amber-700">
                      You have to verify your account from Payout Info.
                    </p>
                    {payoutStatus === 'rejected' && user?.payoutInfo?.rejectionReason ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700/90">
                        Last rejection reason: {user.payoutInfo.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                )}

                {payoutStatus === 'pending' && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                    <p className="text-sm font-black text-blue-700">
                      Your account is under review to verify.
                    </p>
                  </div>
                )}

                {payoutStatus === 'verified' && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                    <p className="text-sm font-black text-emerald-700">Your account is verified</p>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Business Profile</h3>
                      <p className="text-slate-500 font-medium">
                        Manage how your business appears to clients.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Contact Name</label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={contactName}
                            onChange={(e) => setContactNameDraft(e.target.value)}
                            className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Business Email</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={user.email}
                            readOnly
                            className="h-14 pl-12 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Bio / Business Motto</label>
                        <textarea
                          value={businessBio}
                          onChange={(e) => setBioDraft(e.target.value)}
                          placeholder="Describe your business, style, and why clients should choose you."
                          className="w-full h-32 rounded-xl border border-slate-200 p-4 focus:ring-2 focus:ring-[#2286BE] focus:border-transparent outline-none font-medium resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Experience Level</label>
                        <div className="relative">
                          <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceDraft(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2286BE] outline-none font-bold bg-white"
                          >
                            <option value="">Select experience</option>
                            <option value="Beginner (0-1 Years)">Beginner (0-1 Years)</option>
                            <option value="Intermediate (2-4 Years)">Intermediate (2-4 Years)</option>
                            <option value="Advanced (5-7 Years)">Advanced (5-7 Years)</option>
                            <option value="Expert (8+ Years)">Expert (8+ Years)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Service City</label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUseCurrentLocation}
                            className="rounded-xl font-bold border-slate-200"
                          >
                            <Navigation size={16} className="mr-2" />
                            {isResolvingCity ? 'Locating...' : 'Use Current Location'}
                          </Button>
                        </div>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={serviceCity}
                            onChange={(e) => setServiceCityDraft(e.target.value)}
                            placeholder="Banani, Dhaka, 1213"
                            className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Service Area Map</p>
                        {mapboxToken ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isResolvingCity}
                            onClick={handleSetCenterAsServiceCity}
                            className="h-8 rounded-lg border-slate-200 px-3 text-[11px] font-black"
                          >
                            {isResolvingCity ? 'Setting...' : 'Set Center as Service City'}
                          </Button>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400">Mapbox Optional</p>
                        )}
                      </div>

                      {mapboxToken ? (
                        <MapboxLocationPicker
                          token={mapboxToken}
                          initialCenter={selectedMapCoords}
                          onCenterChange={setSelectedMapCoords}
                        />
                      ) : (
                        <div className="h-52 flex items-center justify-center text-sm text-slate-500 bg-slate-50 px-6 text-center">
                          Add `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env` to enable interactive map location picker.
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                      <Button variant="ghost" onClick={handleCancel} className="font-bold rounded-xl px-10 h-14">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveBusinessProfile}
                        disabled={isSavingProfile}
                        className="bg-[#2286BE] hover:bg-[#1b6da0] font-black rounded-xl px-12 h-14 shadow-xl shadow-[#2286BE]/20"
                      >
                        <Save size={18} className="mr-2" />
                        {isSavingProfile ? 'Saving...' : 'Save Business Profile'}
                      </Button>
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Security</h3>
                      <p className="text-slate-500 font-medium">Update password and keep your provider account secure.</p>
                    </div>

                    <div className="space-y-5 max-w-xl">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Current Password</label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="h-14 pr-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">New Password</label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            className="h-14 pr-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Confirm Password</label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="h-14 pr-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
                      <p className="text-sm text-slate-600 font-semibold">
                        Use your current password and set a new strong password (minimum 8 characters).
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="bg-[#2286BE] hover:bg-[#1b6da0] font-black rounded-xl px-10 h-12 shadow-xl shadow-[#2286BE]/20"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'payouts' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Payout Info</h3>
                      <p className="text-slate-500 font-medium">Add bank details and upload NID front/back for admin verification.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Account Holder Name</label>
                        <Input
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          disabled={!canEditPayout}
                          placeholder="Account holder full name"
                          className="h-14 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Bank Account Number</label>
                        <Input
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          disabled={!canEditPayout}
                          placeholder="Bank account number"
                          className="h-14 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Routing Number</label>
                        <Input
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          disabled={!canEditPayout}
                          placeholder="Routing number"
                          className="h-14 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Bank Name</label>
                        <Input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          disabled={!canEditPayout}
                          placeholder="Bank name"
                          className="h-14 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Account Type</label>
                        <select
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value as 'checking' | 'savings' | '')}
                          disabled={!canEditPayout}
                          className="w-full h-14 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2286BE] outline-none font-bold bg-white disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          <option value="">Select account type</option>
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl border border-slate-200 p-6 bg-slate-50">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">NID Front Part</label>
                        <Input type="file" accept="image/*" disabled={!canEditPayout} onChange={(e) => handleNidFileChange(e, 'front')} />
                        {nidFrontPreview ? (
                          <img src={nidFrontPreview} alt="NID front" className="h-44 w-full rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="h-44 w-full rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-sm font-semibold text-slate-400">
                            No front image selected
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">NID Back Part</label>
                        <Input type="file" accept="image/*" disabled={!canEditPayout} onChange={(e) => handleNidFileChange(e, 'back')} />
                        {nidBackPreview ? (
                          <img src={nidBackPreview} alt="NID back" className="h-44 w-full rounded-xl object-cover border border-slate-200" />
                        ) : (
                          <div className="h-44 w-full rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-sm font-semibold text-slate-400">
                            No back image selected
                          </div>
                        )}
                      </div>
                    </div>

                    {user?.payoutInfo?.submittedAt ? (
                      <p className="text-xs font-semibold text-slate-500">
                        Last submitted: {new Date(user.payoutInfo.submittedAt).toLocaleString()}
                      </p>
                    ) : null}

                    <div className="pt-2 flex justify-end">
                      {payoutStatus === 'verified' && !isPayoutEditMode ? (
                        <Button
                          onClick={() => setIsPayoutEditMode(true)}
                          className="bg-[#2286BE] hover:bg-[#1b6da0] font-black rounded-xl px-10 h-12 shadow-xl shadow-[#2286BE]/20"
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          onClick={handleVerifyPayoutInfo}
                          disabled={isSubmittingPayoutVerification}
                          className="bg-[#2286BE] hover:bg-[#1b6da0] font-black rounded-xl px-10 h-12 shadow-xl shadow-[#2286BE]/20"
                        >
                          {isSubmittingPayoutVerification
                            ? 'Submitting...'
                            : payoutStatus === 'verified' && isPayoutEditMode
                              ? 'Submit Again for Verification'
                              : 'Verify Now'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-8">
                  <DeleteAccountSection />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
