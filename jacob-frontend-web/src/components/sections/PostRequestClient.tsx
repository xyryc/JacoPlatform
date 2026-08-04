'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateServiceRequestMutation, useGetCategoriesQuery } from '@/store/services/apiSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  UploadCloud,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Info,
  Clock3,
  Navigation,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { BRAND } from '@/lib/constants';
import { formatMilesFromKm } from '@/lib/distance';
import { DEFAULT_CATEGORIES } from '@/data/categories';
import MapboxLocationPicker from '@/components/profile/MapboxLocationPicker';
import { resolveAddressFromCoordinates } from '@/lib/geocodeAddress';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type CategoryItem = {
  _id?: string;
  name?: string;
  slug?: string;
};

const slugifySearchTerm = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function PostRequestClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role } = useAuth();
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery();
  const [createServiceRequest, { isLoading: isSubmitting }] = useCreateServiceRequestMutation();

  const queryCategoryName = searchParams.get('categoryName')?.trim() || '';
  const queryCategorySlug = searchParams.get('categorySlug')?.trim() || slugifySearchTerm(queryCategoryName);
  const queryZipCode = searchParams.get('zipCode')?.trim() || '';

  const categories = useMemo(() => {
    const approvedCategories = ((categoriesData?.data || []) as CategoryItem[]).filter((category) => Boolean(category?.slug));
    const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((category) => category.slug));
    const customCategories = approvedCategories.filter((category) => !defaultSlugs.has(String(category.slug)));
    const merged = [
      ...DEFAULT_CATEGORIES,
      ...customCategories.map((category) => ({
        name: category.name || '',
        slug: category.slug || '',
      })),
    ].filter((category) => Boolean(category.slug));

    const hasQueryCategory =
      queryCategorySlug &&
      !merged.some((category) => String(category.slug) === queryCategorySlug);

    if (hasQueryCategory) {
      return [
        {
          name: queryCategoryName || queryCategorySlug,
          slug: queryCategorySlug,
        },
        ...merged,
      ];
    }

    return merged;
  }, [categoriesData, queryCategoryName, queryCategorySlug]);

  const [categorySlug, setCategorySlug] = useState('');
  const [categoryMode, setCategoryMode] = useState<'existing' | 'custom'>('existing');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryDescription, setCustomCategoryDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [budget, setBudget] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 23.8103,
    lng: 90.4125,
  });
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const hasInitializedLocationRef = useRef(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (role && role !== 'client') {
      toast.error('Only clients can post a service request.');
      router.replace('/provider/requests');
    }
  }, [role, router]);

  useEffect(() => {
    if (!user || hasInitializedLocationRef.current) return;

    if (typeof user.locationLat === 'number' && typeof user.locationLng === 'number') {
      setSelectedMapCoords({
        lat: user.locationLat,
        lng: user.locationLng,
      });
    }

    if (!serviceAddress.trim()) {
      if (user.address) {
        setServiceAddress(user.address);
      } else if (queryZipCode) {
        setServiceAddress(`ZIP ${queryZipCode}`);
      }
    }

    hasInitializedLocationRef.current = true;
  }, [queryZipCode, serviceAddress, user]);

  useEffect(() => {
    if (!queryCategorySlug) return;
    setCategorySlug((current) => current || queryCategorySlug);
  }, [queryCategorySlug]);

  useEffect(() => {
    const approvedCategoryItems = ((categoriesData?.data || []) as CategoryItem[]).filter((category) => Boolean(category?.slug));
    const hasApprovedQueryCategory = approvedCategoryItems.some((category) => category.slug === queryCategorySlug);
    if (queryCategorySlug && !hasApprovedQueryCategory) {
      setCategoryMode('custom');
      setCustomCategoryName((current) => current || queryCategoryName || queryCategorySlug);
      return;
    }

    if (queryCategorySlug && hasApprovedQueryCategory) {
      setCategoryMode('existing');
    }
  }, [categoriesData, queryCategoryName, queryCategorySlug]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug) || categories[0] || null,
    [categories, categorySlug]
  );
  const effectiveCategorySlug = selectedCategory?.slug || categorySlug;
  const preferredDateValue = preferredDate ? new Date(preferredDate) : undefined;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    setImages(files);
  };

  const saveCoordinatesAsLocation = async (lat: number, lng: number, successMessage: string) => {
    setIsResolvingLocation(true);
    try {
      const nextAddress = await resolveAddressFromCoordinates(lat, lng, mapboxToken);
      setServiceAddress(nextAddress);
      setSelectedMapCoords({ lat, lng });
      toast.success(successMessage);
    } catch {
      toast.error('Could not resolve the selected location.');
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void saveCoordinatesAsLocation(
          position.coords.latitude,
          position.coords.longitude,
          'Current location saved.'
        );
      },
      () => {
        toast.error('Could not detect your current location. Please allow location permission and try again.');
      }
    );
  };

  const handleSetMapCenterAsLocation = async () => {
    await saveCoordinatesAsLocation(
      selectedMapCoords.lat,
      selectedMapCoords.lng,
      'Map center set as service location.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(`You must be signed in to post a request on ${BRAND.name}.`);
      return;
    }

    if (role !== 'client') {
      toast.error('Only clients can create service requests.');
      return;
    }

    if (categoryMode === 'existing' && (!effectiveCategorySlug || !selectedCategory)) {
      toast.error('Please choose a service category.');
      return;
    }

    if (categoryMode === 'custom' && !customCategoryName.trim()) {
      toast.error('Please enter the custom category you want to request.');
      return;
    }

    if (!serviceAddress.trim() || !description.trim() || !preferredDate || !preferredTime || !budget.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const nextBudget = Number(budget);
    if (!Number.isFinite(nextBudget) || nextBudget <= 0) {
      toast.error('Please enter a valid budget.');
      return;
    }

    const formData = new FormData();
    formData.append('requestCustomCategory', String(categoryMode === 'custom'));
    if (categoryMode === 'custom') {
      formData.append('customCategoryName', customCategoryName.trim());
      if (customCategoryDescription.trim()) {
        formData.append('customCategoryDescription', customCategoryDescription.trim());
      }
      formData.append('categorySlug', slugifySearchTerm(customCategoryName));
      formData.append('categoryName', customCategoryName.trim());
    } else {
      formData.append('categorySlug', effectiveCategorySlug);
      formData.append('categoryName', selectedCategory?.name || categorySlug);
    }
    formData.append('serviceAddress', serviceAddress.trim());
    formData.append('serviceLocationLat', String(selectedMapCoords.lat));
    formData.append('serviceLocationLng', String(selectedMapCoords.lng));
    formData.append('description', description.trim());
    formData.append('preferredDate', preferredDate);
    formData.append('preferredTime', preferredTime);
    formData.append('budget', String(nextBudget));
    images.forEach((file) => formData.append('images', file));

    try {
      await createServiceRequest(formData).unwrap();
      toast.success(
        categoryMode === 'custom'
          ? 'Your custom category request has been sent to admin for approval.'
          : 'Your request has been posted. Nearby providers have been notified.'
      );
      router.push('/client/orders?tab=requested');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit your request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#2286BE]/10 text-[#2286BE] px-4 py-1.5 rounded-full mb-6 border border-[#2286BE]/10 shadow-sm">
            <Sparkles size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Request Matching</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Post a Custom Request
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Tell us what you need and we&apos;ll notify nearby providers within {formatMilesFromKm(30)} of your selected location.
          </p>
        </motion.div>

        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-[#2286BE]/10 flex items-center justify-center text-[#2286BE]">
                    <Info size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">The Essentials</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label htmlFor="category" className="text-sm font-bold text-slate-800 uppercase tracking-wider block">
                      Service Category
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCategoryMode('existing')}
                        className={`rounded-2xl border px-4 py-3 text-center text-[12px] font-bold transition ${
                          categoryMode === 'existing'
                            ? 'border-[#2286BE] bg-[#2286BE]/10 text-[#2286BE]'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        Select existing category
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryMode('custom');
                          setCustomCategoryName((current) => current || queryCategoryName || selectedCategory?.name || '');
                        }}
                        className={`rounded-2xl border px-4 py-3 text-center text-[12px] font-bold transition ${
                          categoryMode === 'custom'
                            ? 'border-[#2286BE] bg-[#2286BE]/10 text-[#2286BE]'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        Request new category
                      </button>
                    </div>

                    {categoryMode === 'existing' ? (
                      <Select value={effectiveCategorySlug || ''} onValueChange={setCategorySlug} disabled={isCategoriesLoading || categories.length === 0}>
                        <SelectTrigger id="category" className="w-full h-14 rounded-xl border-slate-200 focus:ring-[#2286BE] bg-slate-50/50 font-medium text-slate-900">
                          <SelectValue placeholder="Choose a category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl p-2">
                          {categories.map((category) => (
                            <SelectItem
                              key={category.slug}
                              value={String(category.slug)}
                              className="py-3 pl-6 pr-12 rounded-lg"
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-3 rounded-[1.5rem] border border-dashed border-[#2286BE]/30 bg-[#2286BE]/5 p-4">
                        <Input
                          value={customCategoryName}
                          onChange={(event) => setCustomCategoryName(event.target.value)}
                          placeholder="Enter the category you want admin to add"
                          className="h-14 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] bg-white font-medium"
                        />
                        <textarea
                          rows={3}
                          value={customCategoryDescription}
                          onChange={(event) => setCustomCategoryDescription(event.target.value)}
                          placeholder="Optional: explain this new category for admin"
                          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#2286BE] focus:ring-2 focus:ring-[#2286BE]"
                        />
                        <p className="text-xs font-semibold text-slate-500">
                          Admin will review this category first. Once approved, your request will go live to nearby providers.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="location" className="text-sm font-bold text-slate-800 uppercase tracking-wider block">
                      Service Location
                    </label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors z-10 pointer-events-none" />
                      <Input
                        id="location"
                        type="text"
                        placeholder="Enter your exact location"
                        required
                        value={serviceAddress}
                        onChange={(event) => setServiceAddress(event.target.value)}
                        className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] bg-slate-50/50 font-medium"
                      />
                    </div>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Address Map Preview</p>
                        {mapboxToken ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isResolvingLocation}
                            onClick={handleSetMapCenterAsLocation}
                            className="h-8 rounded-lg border-slate-200 px-3 text-[11px] font-black"
                          >
                            {isResolvingLocation ? 'Setting...' : 'Set Center as Location'}
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
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="inline-flex items-center gap-2 font-bold text-[#2286BE] hover:text-[#1b6da0] transition-colors"
                      >
                        <Navigation size={14} />
                        {isResolvingLocation ? 'Locating...' : 'Use Current Location'}
                      </button>
                      <span className="font-medium">Move the map to set your exact request location.</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label htmlFor="description" className="text-sm font-bold text-slate-800 uppercase tracking-wider block">
                      Detailed Description
                    </label>
                    <textarea
                      id="description"
                      rows={5}
                      required
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe your requirements in detail. For example: 'I need a complete deep cleaning for my 3-bedroom apartment...'"
                      className="w-full border border-slate-200 rounded-2xl p-6 focus:ring-2 focus:ring-[#2286BE] focus:border-transparent outline-none transition-all resize-none text-base font-medium bg-slate-50/50 placeholder:text-slate-400 text-slate-800"
                    />
                    <div className="flex items-center gap-2 text-slate-400 mt-2">
                      <CheckCircle2 size={14} className="text-[#2286BE]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">More detail = better provider matches</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem]">
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-[#2286BE]/5 flex items-center justify-center text-[#2286BE]">
                      <CalendarIcon size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Preferred Date</h3>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-bold h-14 rounded-xl border-slate-200 hover:bg-slate-50 px-6 ${
                          !preferredDate ? 'text-slate-400' : ''
                        }`}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5 opacity-50" />
                        {preferredDateValue ? format(preferredDateValue, 'PPP') : <span>Select your preferred date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-none" align="start">
                      <Calendar
                        mode="single"
                        selected={preferredDateValue}
                        onSelect={(nextDate) => setPreferredDate(nextDate ? format(nextDate, 'yyyy-MM-dd') : '')}
                        initialFocus
                        className="p-4"
                        classNames={{
                          day_selected: 'bg-[#2286BE] text-white hover:bg-[#2286BE] rounded-lg',
                          day_today: 'bg-slate-100 text-slate-900 rounded-lg',
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-slate-400 mt-4 font-medium">Flexible dates often get more responses.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem]">
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                      <Clock3 size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Preferred Time</h3>
                  </div>
                  <div className="relative group">
                    <Clock3 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2286BE] transition-colors" />
                    <Input
                      type="time"
                      value={preferredTime}
                      onChange={(event) => setPreferredTime(event.target.value)}
                      className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] bg-slate-50/50 font-medium"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-medium">Providers can see your preferred time window.</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem]">
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                      <DollarSign size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Budget</h3>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-lg group-focus-within:text-[#2286BE] transition-colors">
                      $
                    </span>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter your estimated budget"
                      value={budget}
                      onChange={(event) => setBudget(event.target.value)}
                      className="h-14 pl-12 rounded-xl border-slate-200 focus-visible:ring-[#2286BE] bg-slate-50/50 font-black text-lg"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-medium">Providers can send you a response based on your budget.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2rem]">
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <UploadCloud size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Visual Context</h3>
                  </div>
                  <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-8 text-center hover:bg-slate-50 hover:border-[#2286BE]/20 transition-all duration-300 group">
                    <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-[#2286BE]/10 group-hover:text-[#2286BE] transition-all duration-300">
                      <UploadCloud size={40} className="text-slate-400 group-hover:text-[#2286BE]" />
                    </div>
                    <p className="text-lg font-black text-slate-800">Add reference images</p>
                    <p className="text-slate-500 mt-2 font-medium">Optional. You can upload up to 4 images.</p>
                    <label className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 px-8 py-3 font-bold text-slate-700 hover:border-[#2286BE] hover:text-[#2286BE] transition-all">
                      Select Images
                      <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                    </label>
                    <div className="mt-4 text-xs font-semibold text-slate-500 space-y-1">
                      {images.length > 0 ? (
                        images.map((file) => <p key={file.name}>{file.name}</p>)
                      ) : (
                        <p>No image selected</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border-2 border-[#2286BE] flex items-center justify-center">
                <CheckCircle2 className="text-[#2286BE]" size={24} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Nearby providers only</p>
                <p className="text-xs font-bold text-slate-400">Matched providers must be within {formatMilesFromKm(30)}.</p>
              </div>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none font-bold text-slate-400 hover:text-slate-600 px-10 h-16 rounded-2xl"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] sm:flex-none bg-[#2286BE] hover:bg-[#1b6da0] px-12 h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Submit Request <ArrowRight size={20} className="ml-3" />
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
