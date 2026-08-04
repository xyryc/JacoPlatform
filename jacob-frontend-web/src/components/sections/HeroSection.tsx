'use client';

import React from 'react';
import Image from 'next/image';
import { Search, MapPin, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BRAND } from '@/lib/constants';
import { DEFAULT_CATEGORIES } from '@/data/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useGetCategoriesQuery, useLazyGetPublicServicesQuery } from '@/store/services/apiSlice';
import { extractZipCode, isValidZipCode } from '@/lib/zip';

type CategoryItem = {
  slug?: string;
  name?: string;
};

type PublicGigItem = {
  id?: string;
  title?: string;
  categoryName?: string;
  zipCode?: string;
};

const slugifySearchTerm = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function HeroSection() {
  const router = useRouter();
  const { user, role } = useAuth();
  const searchBoxRef = React.useRef<HTMLFormElement | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [zipCode, setZipCode] = React.useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = React.useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = React.useState(false);
  const [searchedGigs, setSearchedGigs] = React.useState<PublicGigItem[]>([]);
  const [showNoResultsSuggestion, setShowNoResultsSuggestion] = React.useState(false);
  const { data: categoriesPayload } = useGetCategoriesQuery();
  const [triggerSearch, { isFetching }] = useLazyGetPublicServicesQuery();

  const categories = React.useMemo(() => {
    const approvedCategories = ((categoriesPayload?.data || []) as CategoryItem[]).filter(
      (item) => item?.name && item?.slug
    );
    const defaultSlugs = new Set(DEFAULT_CATEGORIES.map((category) => category.slug));
    const customCategories = approvedCategories.filter((category) => !defaultSlugs.has(String(category.slug || '')));

    return [
      ...DEFAULT_CATEGORIES.map((category) => ({
        name: category.name,
        slug: category.slug,
      })),
      ...customCategories.map((category) => ({
        name: String(category.name || ''),
        slug: String(category.slug || ''),
      })),
    ];
  }, [categoriesPayload?.data]);

  const categorySuggestions = React.useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((item) => String(item.name || '').toLowerCase().includes(query));
  }, [categories, searchText]);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node)) {
        setShowCategorySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const openCustomRequestFlow = React.useCallback(() => {
    const categoryName = searchText.trim();
    const categorySlug = selectedCategorySlug || slugifySearchTerm(categoryName);

    if (!categoryName || !categorySlug) {
      toast.error('Type a service name first so we can prefill your request.');
      return;
    }

    if (!user) {
      toast.info('Please sign in as a client to submit a custom request.');
      router.push('/login');
      return;
    }

    if (role !== 'client') {
      toast.error('Only client accounts can submit custom service requests.');
      return;
    }

    const params = new URLSearchParams({
      categoryName,
      categorySlug,
      source: 'hero-search',
    });

    const normalizedZip = extractZipCode(zipCode);
    if (normalizedZip) {
      params.set('zipCode', normalizedZip);
    }

    router.push(`/post-request?${params.toString()}`);
  }, [role, router, searchText, selectedCategorySlug, user, zipCode]);

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedZip = extractZipCode(zipCode);
    if (!isValidZipCode(normalizedZip)) {
      toast.error('Please enter a valid 5-digit zip code.');
      return;
    }

    try {
      const payload = await triggerSearch({
        page: 1,
        limit: 100,
        radiusKm: 100,
        categorySlug: selectedCategorySlug || 'all',
        search: searchText.trim(),
        zipCode: normalizedZip,
      }).unwrap();

      const items = Array.isArray(payload?.data?.items) ? (payload.data.items as PublicGigItem[]) : [];
      setSearchedGigs(items);
      setShowCategorySuggestions(false);
      setShowNoResultsSuggestion(items.length === 0);

      if (!items.length) {
        toast.info('No gigs found in this zip area.');
      }
    } catch {
      toast.error('Could not search gigs right now.');
    }
  };

  return (
    <section className="relative w-full overflow-hidden py-20 lg:py-24">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.3]"
        style={{ backgroundImage: `url('/herobg.png')` }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="text-[38px] font-[800] leading-[1.2] text-[#111827] sm:text-[48px]">
              Your Home,Our Priority
            </h1>

            <form
              role="search"
              aria-label="Find a home service"
              className="mt-8 w-full max-w-[580px]"
              onSubmit={handleSearchSubmit}
              ref={searchBoxRef}
            >
              <div className="flex h-[56px] w-full items-center rounded-[12px] border border-[#E0E0E0] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <label htmlFor="hero-search" className="sr-only">
                  Search category
                </label>
                <div className="flex flex-1 items-center px-4">
                  <input
                    id="hero-search"
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setSelectedCategorySlug('');
                      setShowCategorySuggestions(true);
                      setSearchedGigs([]);
                      setShowNoResultsSuggestion(false);
                    }}
                    onFocus={() => setShowCategorySuggestions(true)}
                    placeholder="Search category"
                    className="w-full bg-transparent text-[15px] text-[#333] outline-none placeholder:text-gray-400 font-medium"
                  />
                </div>

                <div className="h-6 w-[1px] bg-[#E0E0E0]" aria-hidden="true" />

                <label htmlFor="hero-zip" className="sr-only">
                  Zip code
                </label>
                <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                  <MapPin size={18} className="text-[#2286BE]" strokeWidth={2.5} aria-hidden="true" />
                  <input
                    id="hero-zip"
                    type="text"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5));
                      setSearchedGigs([]);
                      setShowNoResultsSuggestion(false);
                    }}
                    placeholder="Zip"
                    className="w-20 bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-gray-400 font-medium"
                    maxLength={5}
                  />
                </div>

                <button
                  type="submit"
                  aria-label="Search for home services"
                  className="flex h-full aspect-square items-center justify-center rounded-[8px] bg-[#2286BE] text-white hover:bg-[#1b6da0] transition-transform active:scale-95 shadow-md shadow-primary/20 disabled:opacity-60"
                  disabled={isFetching}
                >
                  <Search size={20} strokeWidth={3} aria-hidden="true" />
                </button>
              </div>

              {showCategorySuggestions ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
                  <div className="max-h-56 overflow-y-auto py-2">
                    {categorySuggestions.length ? (
                      categorySuggestions.map((category) => (
                        <button
                          key={category.slug}
                          type="button"
                          onClick={() => {
                            setSearchText(String(category.name || ''));
                            setSelectedCategorySlug(String(category.slug || ''));
                            setShowCategorySuggestions(false);
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                        >
                          <span className="text-sm font-bold text-slate-800">{category.name}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-500">No matching category found.</p>
                        <button
                          type="button"
                          onClick={openCustomRequestFlow}
                          className="mt-3 inline-flex rounded-xl bg-[#2286BE] px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#1b6da0]"
                        >
                          Request This Service
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {searchedGigs.length ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
                  <div className="border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">
                    Available gigs in ZIP {extractZipCode(zipCode)}
                  </div>
                  <div className="max-h-[228px] overflow-y-auto">
                    {searchedGigs.map((gig) => (
                      <button
                        key={gig.id}
                        type="button"
                        onClick={() => router.push(`/services/${gig.id}`)}
                        className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-4 text-left last:border-b-0 hover:bg-slate-50"
                      >
                        <div>
                          <div className="text-sm font-black text-slate-900">{gig.title || 'Untitled gig'}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {gig.categoryName || 'General'} • ZIP {gig.zipCode || extractZipCode(zipCode)}
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#2286BE]">Open</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {showNoResultsSuggestion ? (
                <div className="mt-3 rounded-2xl border border-[#2286BE]/15 bg-[#2286BE]/5 p-4">
                  <p className="text-sm font-black text-slate-900">Couldn&apos;t find a matching category or gig?</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Submit a custom request and let {BRAND.name} notify admins and nearby providers for you.
                  </p>
                  <button
                    type="button"
                    onClick={openCustomRequestFlow}
                    className="mt-3 inline-flex rounded-xl bg-[#2286BE] px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#1b6da0]"
                  >
                    Request Gig
                  </button>
                </div>
              ) : null}
            </form>

            <div className="mt-8 flex flex-wrap gap-4">
               <Link href="/services">
                  <button className="h-14 px-8 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black text-[15px] uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-[#2286BE]/20 active:scale-95">
                     Find Services
                  </button>
               </Link>
               <Link href="/join-provider">
                  <button className="h-14 px-8 bg-white hover:bg-slate-50 text-[#2286BE] border-2 border-[#2286BE] font-black text-[15px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-100">
                     Join as Pro
                  </button>
               </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#2286BE] text-[#2286BE] bg-primary/5 shadow-sm"
                  aria-hidden="true"
                >
                  <Clock size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#111827] leading-none">24H</p>
                  <p className="text-[13px] text-gray-400 font-medium leading-none mt-1">Availability</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#2286BE] text-[#2286BE] bg-primary/5 shadow-sm"
                  aria-hidden="true"
                >
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#111827] leading-none">Local</p>
                  <p className="text-[13px] text-gray-400 font-medium leading-none mt-1">Professionals</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#2286BE] text-[#2286BE] bg-primary/5 shadow-sm"
                  aria-hidden="true"
                >
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#111827] leading-none">Flexible</p>
                  <p className="text-[13px] text-gray-400 font-medium leading-none mt-1">Appointments</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 hidden sm:grid grid-cols-2 gap-3">
            <div className="relative h-[200px] sm:h-[220px] overflow-hidden rounded-[20px] shadow-xl shadow-slate-200/50">
              <Image
                src="/hero1.png"
                alt="Reliable plumber fixing sink leakage"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative row-span-2 h-[420px] sm:h-[450px] overflow-hidden rounded-[20px] shadow-2xl shadow-slate-200/60">
              <Image
                src="/hero3.png"
                alt="Skilled handyman at work"
                fill
                priority
                className="object-cover hover:scale-105 transition-transform duration-1000"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="relative h-[200px] sm:h-[220px] overflow-hidden rounded-[20px] shadow-xl shadow-slate-200/50">
              <Image
                src="/hero2.png"
                alt="Detail oriented cleaning technician"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
