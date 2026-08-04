'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  Bell, 
  MessageSquare, 
  User, 
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings,
  Briefcase,
  ArrowLeftRight,
  Heart
} from 'lucide-react';
import { BRAND, CONTACT } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketNotifications } from '@/contexts/SocketContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function Header() {
  const { user, role, setRole, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useSocketNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hasProviderAccount =
    user?.role === 'provider' ||
    Boolean(
      user?.businessBio ||
      user?.experienceLevel ||
      user?.serviceCity ||
      user?.serviceLocationLat ||
      user?.serviceLocationLng
    );
  const canSwitchModes = hasProviderAccount;

  const navLinks = useMemo(() => {
    const baseLinks =
      role === 'provider'
        ? [{ name: 'Requested Orders', href: '/provider/requests' }]
        : [{ name: 'Services', href: '/services' }];

    const roleAwareLinks =
      isAuthenticated && role === 'provider'
        ? [
            { name: 'My Gigs', href: '/provider/gigs' },
            { name: 'Provider Hub', href: '/provider/dashboard' },
          ]
        : hasProviderAccount
          ? []
          : [{ name: 'Join as Pro', href: '/join-provider' }];

    return [
      ...baseLinks,
      { name: 'Categories', href: '/categories' },
      ...roleAwareLinks,
      { name: 'Success Stories', href: '/success-stories' },
    ];
  }, [hasProviderAccount, isAuthenticated, role]);

  const isActive = (href: string) => pathname === href;

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-100 py-3 shadow-sm"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white shadow-xl shadow-slate-200/50 transition-all">
               <Image src={BRAND.logo} alt={BRAND.name} width={24} height={24} />
            </div>
            <span className="text-[22px] font-black tracking-tight text-slate-950 transition-colors">
               {BRAND.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[15px] font-bold transition-all relative py-2 ${
                  isActive(link.href) 
                  ? 'text-[#2286BE]' 
                  : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                   <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2286BE] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Notification + Chat icons - only when logged in */}
                <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
                  <Link href="/notifications" aria-label="Notifications">
                    <button className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors relative hover:bg-slate-100 text-slate-500 hover:text-[#2286BE]">
                      <Bell size={20} strokeWidth={2.5} />
                      {unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      ) : null}
                    </button>
                  </Link>
                  <Link href="/messages" aria-label="Messages">
                    <button className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors relative hover:bg-slate-100 text-slate-500 hover:text-[#2286BE]">
                      <MessageSquare size={20} strokeWidth={2.5} />
                    </button>
                  </Link>
                </div>

                {/* User profile dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 group outline-none">
                       <Avatar className="h-10 w-10 rounded-xl bg-[#2286BE]/10 border border-[#2286BE]/20 overflow-hidden transition-transform group-hover:scale-105">
                          <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                          <AvatarFallback className="bg-[#2286BE]/10 text-[#2286BE]">
                            <User size={20} strokeWidth={2.5} />
                          </AvatarFallback>
                       </Avatar>
                       <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[240px] rounded-2xl p-2 shadow-2xl border-slate-100">
                    <div className="px-4 py-3">
                       <p className="text-sm font-black text-slate-900">{user?.name}</p>
                       <p className="text-[11px] font-medium text-slate-400 capitalize">{role} account</p>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    
                    {canSwitchModes && (
                      <div className="px-2 pb-2">
                        <Button
                          onClick={async () => {
                            const nextRole = role === 'client' ? 'provider' : 'client';
                            await setRole(nextRole);
                            toast.success(
                              nextRole === 'provider'
                                ? 'Switched to selling mode.'
                                : 'Switched to buying mode.'
                            );
                            router.push(nextRole === 'provider' ? '/provider/dashboard' : '/client/dashboard');
                          }}
                          className="w-full h-10 bg-[#2286BE]/5 hover:bg-[#2286BE]/10 text-[#2286BE] font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-[#2286BE]/10"
                        >
                          <ArrowLeftRight size={14} className="mr-2" />
                          Switch to {role === 'client' ? 'Selling' : 'Buying'}
                        </Button>
                      </div>
                    )}
                    
                    <Link href={role === 'provider' ? '/provider/dashboard' : '/client/dashboard'}>
                      <DropdownMenuItem className="rounded-xl focus:bg-[#2286BE]/5 focus:text-[#2286BE] font-bold py-2.5 cursor-pointer">
                        <LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link href={role === 'provider' ? '/provider/orders' : '/client/orders'}>
                      <DropdownMenuItem className="rounded-xl focus:bg-[#2286BE]/5 focus:text-[#2286BE] font-bold py-2.5 cursor-pointer">
                        <Briefcase className="mr-3 h-4 w-4" /> My Orders
                      </DropdownMenuItem>
                    </Link>

                    {role === 'provider' && (
                      <Link href="/provider/gigs">
                        <DropdownMenuItem className="rounded-xl focus:bg-[#2286BE]/5 focus:text-[#2286BE] font-bold py-2.5 cursor-pointer">
                          <LayoutDashboard className="mr-3 h-4 w-4" /> My Gig
                        </DropdownMenuItem>
                      </Link>
                    )}

                    {role === 'client' && (
                      <Link href="/client/saved-services">
                        <DropdownMenuItem className="rounded-xl focus:bg-[#2286BE]/5 focus:text-[#2286BE] font-bold py-2.5 cursor-pointer">
                          <Heart className="mr-3 h-4 w-4" /> Saved Services
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <Link href={role === 'provider' ? '/provider/profile' : '/client/profile'}>
                      <DropdownMenuItem className="rounded-xl focus:bg-[#2286BE]/5 focus:text-[#2286BE] font-bold py-2.5 cursor-pointer">
                        <Settings className="mr-3 h-4 w-4" /> Settings
                      </DropdownMenuItem>
                    </Link>
                    
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem
                      onClick={() => {
                        logout();
                        router.push('/login');
                      }}
                      className="rounded-xl focus:bg-red-50 focus:text-red-500 font-bold py-2.5 text-red-500 cursor-pointer"
                    >
                      <LogOut className="mr-3 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Logged-out: only Login + Signup */
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="outline" className="h-11 px-6 font-black rounded-xl border-slate-200 hover:border-[#2286BE]/40 hover:text-[#2286BE] transition-all">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-11 px-8 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-[#2286BE]/20">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <button 
               aria-label="Toggle Mobile Menu"
               aria-expanded={isMobileMenuOpen}
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors bg-slate-100 text-slate-900"
            >
               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </nav>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
           className="fixed inset-0 top-[72px] z-50 bg-white md:hidden animate-in fade-in slide-in-from-top-4 duration-300"
           role="dialog"
           aria-modal="true"
        >
          <div className="p-3 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block w-full p-3.5 rounded-2xl text-base font-black transition-colors ${
                  isActive(link.href) 
                  ? 'bg-[#2286BE]/10 text-[#2286BE]' 
                  : 'text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
             <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                {isAuthenticated && (
                 <div className="flex flex-col gap-2.5 px-1 mb-1">
                    <div className="flex gap-3">
                      <Link href="/notifications" aria-label="Notifications" onClick={() => setIsMobileMenuOpen(false)}>
                        <button className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 relative">
                          <Bell size={24} />
                          {unreadCount > 0 ? (
                            <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          ) : null}
                        </button>
                      </Link>
                      <Link href="/messages" aria-label="Messages" onClick={() => setIsMobileMenuOpen(false)}>
                        <button className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                          <MessageSquare size={24} />
                        </button>
                      </Link>
                      <Link
                        href={role === 'provider' ? '/provider/profile' : '/client/profile'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 h-12 rounded-2xl bg-slate-100 flex items-center px-4 gap-3 text-slate-900 font-bold"
                      >
                         <User size={20} /> My Account
                      </Link>
                    </div>

                    {canSwitchModes && (
                      <Button
                        onClick={async () => {
                          const nextRole = role === 'client' ? 'provider' : 'client';
                          await setRole(nextRole);
                          toast.success(
                            nextRole === 'provider'
                              ? 'Switched to selling mode.'
                              : 'Switched to buying mode.'
                          );
                          setIsMobileMenuOpen(false);
                          router.push(nextRole === 'provider' ? '/provider/dashboard' : '/client/dashboard');
                        }}
                        className="w-full h-12 bg-[#2286BE]/5 hover:bg-[#2286BE]/10 text-[#2286BE] font-black rounded-2xl transition-all border border-[#2286BE]/10"
                      >
                        <ArrowLeftRight size={16} className="mr-2" />
                        Switch to {role === 'client' ? 'Selling' : 'Buying'}
                      </Button>
                    )}

                    <Link
                      href={role === 'provider' ? '/provider/dashboard' : '/client/dashboard'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex h-12 rounded-2xl bg-slate-100 items-center px-4 gap-3 text-slate-900 font-bold"
                    >
                      <LayoutDashboard size={20} /> Dashboard
                    </Link>

                    <Link
                      href={role === 'provider' ? '/provider/orders' : '/client/orders'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex h-12 rounded-2xl bg-slate-100 items-center px-4 gap-3 text-slate-900 font-bold"
                    >
                      <Briefcase size={20} /> My Orders
                    </Link>

                    {role === 'provider' ? (
                      <Link
                        href="/provider/gigs"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex h-12 rounded-2xl bg-slate-100 items-center px-4 gap-3 text-slate-900 font-bold"
                      >
                        <LayoutDashboard size={20} /> My Gig
                      </Link>
                    ) : (
                      <Link
                        href="/client/saved-services"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex h-12 rounded-2xl bg-slate-100 items-center px-4 gap-3 text-slate-900 font-bold"
                      >
                        <Heart size={20} /> Saved Services
                      </Link>
                    )}

                    <Link
                      href={role === 'provider' ? '/provider/profile' : '/client/profile'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex h-12 rounded-2xl bg-slate-100 items-center px-4 gap-3 text-slate-900 font-bold"
                    >
                      <Settings size={20} /> Settings
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                        router.push('/login');
                      }}
                      className="flex h-12 w-full rounded-2xl bg-red-50 items-center px-4 gap-3 text-red-500 font-bold"
                    >
                      <LogOut size={20} /> Logout
                    </button>
                  </div>
                )}
               {!isAuthenticated && (
                 <div className="flex flex-col gap-3">
                   <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                     <Button variant="outline" className="w-full h-14 font-black rounded-2xl border-slate-200">
                       Login
                     </Button>
                   </Link>
                   <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                     <Button className="w-full h-14 bg-[#2286BE] hover:bg-[#1b6da0] text-white font-black rounded-2xl">
                       Sign Up — It&apos;s Free
                     </Button>
                   </Link>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
