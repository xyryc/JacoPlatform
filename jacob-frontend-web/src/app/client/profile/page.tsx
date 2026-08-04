'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Camera,
  ChevronRight,
  Globe,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  Navigation,
  Eye,
  EyeOff,
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
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '@/store/services/apiSlice';

const normalizeAddressText = (value: string) => {
  const trimmed = value.trim();
  const isLatLng = /^lat\s*-?\d+(\.\d+)?\s*,\s*lng\s*-?\d+(\.\d+)?$/i.test(trimmed);
  if (!isLatLng) return value;
  return 'Area unavailable, District unavailable, ZIP N/A';
};

type ClientProfileResponseUser = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  avatar?: string;
  locationLat?: number | null;
  locationLng?: number | null;
};

export default function ClientProfilePage() {
  const { user, role, logout, updateProfile } = useAuth();
  const { detectLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<string | null>(null);
  const [preferredLanguageDraft, setPreferredLanguageDraft] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
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
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 40.7128,
    lng: -74.006,
  });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const defaultFullName = user ? user.name || `${user.firstName} ${user.lastName}`.trim() : '';
  const defaultPhone = user?.phone || '';
  const defaultAddress = user?.address || '';
  const defaultPreferredLanguage = user?.preferredLanguage || 'English (US)';
  const defaultAvatarSrc = user?.avatar || '';

  const fullName = fullNameDraft ?? defaultFullName;
  const phone = phoneDraft ?? defaultPhone;
  const rawAddress = addressDraft ?? defaultAddress;
  const address = normalizeAddressText(rawAddress);
  const preferredLanguage = preferredLanguageDraft ?? defaultPreferredLanguage;
  const avatar = avatarDraft ?? defaultAvatarSrc;
  const savedLocationLat = typeof user?.locationLat === 'number' ? user.locationLat : null;
  const savedLocationLng = typeof user?.locationLng === 'number' ? user.locationLng : null;

  useEffect(() => {
    if (savedLocationLat !== null && savedLocationLng !== null) {
      setSelectedMapCoords({
        lat: savedLocationLat,
        lng: savedLocationLng,
      });
    }
  }, [savedLocationLat, savedLocationLng]);

  const resetDrafts = () => {
    setFullNameDraft(null);
    setPhoneDraft(null);
    setAddressDraft(null);
    setPreferredLanguageDraft(null);
    setAvatarDraft(null);
    if (savedLocationLat !== null && savedLocationLng !== null) {
      setSelectedMapCoords({
        lat: savedLocationLat,
        lng: savedLocationLng,
      });
    }
  };

  const saveCoordinatesAsAddress = async (lat: number, lng: number, successMessage: string) => {
    setIsResolvingAddress(true);
    const nextAddress = await resolveAddressFromCoordinates(lat, lng, mapboxToken);
    setAddressDraft(nextAddress);
    setSelectedMapCoords({ lat, lng });
    updateProfile({
      address: nextAddress,
      locationLat: lat,
      locationLng: lng,
    });
    setIsResolvingAddress(false);
    toast.success(successMessage);
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

  const handleUseCurrentLocation = async () => {
    detectLocation();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void saveCoordinatesAsAddress(
            position.coords.latitude,
            position.coords.longitude,
            'Current location saved.'
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

  const handleSetMapCenterAsLocation = async () => {
    await saveCoordinatesAsAddress(
      selectedMapCoords.lat,
      selectedMapCoords.lng,
      'Map center set and saved as current location.'
    );
  };

  const handleCancel = () => {
    resetDrafts();
    toast.info('Changes discarded.');
  };

  const handleSave = async () => {
    const cleanFullName = fullName.trim();
    if (!cleanFullName) {
      toast.error('Full name is required.');
      return;
    }

    const [firstName, ...rest] = cleanFullName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');
    const resolvedAddress =
      address.trim() ||
      (await resolveAddressFromCoordinates(selectedMapCoords.lat, selectedMapCoords.lng, mapboxToken)) ||
      defaultAddress.trim();

    setIsSavingProfile(true);
    try {
      const payload = await updateProfileMutation({
        firstName,
        lastName,
        phone: phone.trim(),
        address: resolvedAddress,
        preferredLanguage: preferredLanguage.trim(),
        locationLat: selectedMapCoords.lat,
        locationLng: selectedMapCoords.lng,
      }).unwrap();
      if (!payload?.success) {
        toast.error(payload?.message || 'Failed to save profile.');
        return;
      }

      const nextUser = (payload?.data?.user || {}) as ClientProfileResponseUser;
      updateProfile({
        firstName: nextUser?.firstName ?? firstName,
        lastName: nextUser?.lastName ?? lastName,
        name: `${nextUser?.firstName ?? firstName} ${nextUser?.lastName ?? lastName}`.trim(),
        phone: nextUser?.phone ?? phone.trim(),
        address: nextUser?.address ?? resolvedAddress,
        preferredLanguage: nextUser?.preferredLanguage ?? preferredLanguage.trim(),
        avatar: nextUser?.avatar ?? avatar,
        locationLat:
          typeof nextUser?.locationLat === 'number'
            ? nextUser.locationLat
            : selectedMapCoords.lat,
        locationLng:
          typeof nextUser?.locationLng === 'number'
            ? nextUser.locationLng
            : selectedMapCoords.lng,
      });

      resetDrafts();
      toast.success(payload?.message || 'Profile updated successfully.');
    } catch {
      toast.error('Could not save profile right now.');
    } finally {
      setIsSavingProfile(false);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-200/40">
            <h2 className="text-2xl font-black text-slate-900">Please login first</h2>
            <p className="mt-3 text-slate-500 font-medium">You need an account session to access your profile.</p>
            <Link href="/login" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#2286BE] px-6 font-bold text-white">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'client') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-200/40">
            <h2 className="text-2xl font-black text-slate-900">This page is only for client role.</h2>
            <p className="mt-3 text-slate-500 font-medium">You are currently using provider mode.</p>
            <Link href="/provider/profile" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#2286BE] px-6 font-bold text-white">
              Open Provider Profile
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

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{fullName || user.name}</h2>
              <p className="text-sm font-bold text-[#2286BE] uppercase tracking-widest mt-1">Verified Client</p>

              <div className="mt-10 space-y-2">
                {[
                  { id: 'profile', icon: <User size={18} />, label: 'Profile Info' },
                  { id: 'security', icon: <Shield size={18} />, label: 'Security' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                      activeTab === item.id ? 'bg-[#2286BE]/10 text-[#2286BE] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
                <Button variant="ghost" onClick={logout} className="w-full text-red-500 hover:bg-red-50 hover:text-red-700 font-bold rounded-2xl h-12">
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
                {activeTab === 'profile' && (
                  <>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Profile</h3>
                      <p className="text-slate-500 font-medium">Manage your personal information and how others see you.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Full Name</label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={fullName} onChange={(e) => setFullNameDraft(e.target.value)} className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Phone Number</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={phone}
                            onChange={(e) => setPhoneDraft(e.target.value)}
                            placeholder="+880 1XXXXXXXXX"
                            className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input value={user.email} readOnly className="h-14 pl-12 rounded-xl border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed font-bold" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Preferred Language</label>
                        <div className="relative">
                          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={preferredLanguage}
                            onChange={(e) => setPreferredLanguageDraft(e.target.value)}
                            className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Current Address</label>
                          <Button type="button" variant="outline" onClick={handleUseCurrentLocation} className="rounded-xl font-bold border-slate-200">
                            <Navigation size={16} className="mr-2" />
                            {isResolvingAddress ? 'Locating...' : 'Use Current Location'}
                          </Button>
                        </div>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={address}
                            onChange={(e) => setAddressDraft(e.target.value)}
                            placeholder="Banani, Dhaka, Bangladesh"
                            className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Address Map Preview</p>
                        {mapboxToken ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isResolvingAddress}
                            onClick={handleSetMapCenterAsLocation}
                            className="h-8 rounded-lg border-slate-200 px-3 text-[11px] font-black"
                          >
                            {isResolvingAddress ? 'Setting...' : 'Set Center as Location'}
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

                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-2 sm:gap-4">
                      <Button variant="ghost" onClick={handleCancel} className="h-11 rounded-xl px-4 text-sm font-bold sm:h-14 sm:px-10 sm:text-base">
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSavingProfile} className="h-11 rounded-xl bg-[#2286BE] px-5 text-sm font-black shadow-xl shadow-[#2286BE]/20 hover:bg-[#1b6da0] sm:h-14 sm:px-12 sm:text-base">
                        <Save size={16} className="mr-2 sm:h-[18px] sm:w-[18px]" /> {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Security</h3>
                      <p className="text-slate-500 font-medium">Update password and keep your account secure.</p>
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
