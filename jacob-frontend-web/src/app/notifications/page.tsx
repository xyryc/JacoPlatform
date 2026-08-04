'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Package,
  MessageSquare,
  CreditCard,
  Check,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSocketNotifications } from '@/contexts/SocketContext';
import { useAppDispatch } from '@/store/hooks';
import { LiveNotification, removeNotification } from '@/store/slices/notificationSlice';

const PAGE_SIZE = 8;

type NotificationFilter = 'all' | 'order' | 'message' | 'payment';

type NotificationPresentation = {
  id: string;
  category: Exclude<NotificationFilter, 'all'>;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  icon: React.ReactNode;
  color: string;
  targetPath: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const formatNotificationTime = (createdAt: string) => {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return 'Just now';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(createdAt).toLocaleDateString();
};

const getNotificationCategory = (item: LiveNotification): NotificationPresentation['category'] | null => {
  const notificationType = String(item.data?.notificationType || '').toLowerCase();
  const targetPath = String(item.data?.targetPath || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();
  const description = String(item.description || '').toLowerCase();
  const content = `${title} ${description} ${targetPath} ${notificationType}`;

  if (
    content.includes('payment') ||
    content.includes('wallet') ||
    content.includes('withdrawal') ||
    content.includes('paid')
  ) {
    return 'payment';
  }

  if (
    content.includes('message') ||
    content.includes('chat') ||
    targetPath.includes('/messages')
  ) {
    return 'message';
  }

  if (
    content.includes('order') ||
    content.includes('booking') ||
    targetPath.includes('/orders')
  ) {
    return 'order';
  }

  return null;
};

const getCategoryStyles = (category: NotificationPresentation['category']) => {
  if (category === 'payment') {
    return {
      icon: <CreditCard className="text-[#2286BE]" />,
      color: 'bg-primary-soft',
    };
  }

  if (category === 'message') {
    return {
      icon: <MessageSquare className="text-emerald-600" />,
      color: 'bg-emerald-50',
    };
  }

  return {
    icon: <Package className="text-blue-500" />,
    color: 'bg-blue-50',
  };
};

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, markAllNotificationsAsRead, clearNotifications } = useSocketNotifications();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    markAllNotificationsAsRead();
  }, [markAllNotificationsAsRead]);

  const mappedNotifications = useMemo<NotificationPresentation[]>(() => {
    return notifications.reduce<NotificationPresentation[]>((acc, item) => {
        const category = getNotificationCategory(item);
        if (!category) return acc;

        const styles = getCategoryStyles(category);
        acc.push({
          id: item.id,
          category,
          title: item.title,
          description: item.description,
          time: formatNotificationTime(item.createdAt),
          unread: item.unread,
          icon: styles.icon,
          color: styles.color,
          targetPath: typeof item.data?.targetPath === 'string' ? item.data.targetPath : '',
        });
        return acc;
      }, []);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return mappedNotifications;
    return mappedNotifications.filter((item) => item.category === filter);
  }, [filter, mappedNotifications]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedNotifications = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredNotifications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredNotifications, safeCurrentPage]);

  const handleNotificationClick = (targetPath: string) => {
    if (!targetPath) return;
    router.push(targetPath);
  };

  const handleDelete = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2286BE] text-white shadow-lg shadow-primary/20">
                <Bell size={18} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#2286BE]">Activity Feed</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Notifications</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={markAllNotificationsAsRead}
              className="rounded-xl px-6 font-bold text-slate-500 hover:bg-primary-soft hover:text-[#2286BE]"
            >
              Mark all as read
            </Button>
            <Button
              variant="outline"
              onClick={clearNotifications}
              className="h-11 rounded-xl border-slate-200 font-bold text-slate-600 shadow-sm hover:border-[#2286BE] hover:text-[#2286BE]"
            >
              Clear History
            </Button>
          </div>
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {(['all', 'order', 'message', 'payment'] as NotificationFilter[]).map((value) => (
            <Button
              key={value}
              variant={filter === value ? 'default' : 'ghost'}
              onClick={() => {
                setFilter(value);
                setCurrentPage(1);
              }}
              className={`h-10 rounded-xl px-6 font-bold capitalize transition-all ${
                filter === value
                  ? 'bg-[#2286BE] text-white shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {value}
            </Button>
          ))}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {paginatedNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                variants={itemVariants}
                exit={{ opacity: 0, x: 50 }}
                layout
              >
                <Card
                  className={`overflow-hidden rounded-[2rem] border-none shadow-sm transition-all duration-300 hover:shadow-xl ${
                    notification.unread
                      ? 'bg-white ring-2 ring-primary/5 shadow-primary/5'
                      : 'bg-white/60 shadow-slate-200/50'
                  } ${notification.targetPath ? 'cursor-pointer' : ''}`}
                >
                  <CardContent
                    className="p-0"
                    onClick={() => handleNotificationClick(notification.targetPath)}
                  >
                    <div className="group flex items-start gap-5 p-6 md:p-8">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform duration-500 group-hover:scale-110 ${notification.color}`}
                      >
                        {notification.icon}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <h3
                            className={`text-lg font-black tracking-tight ${
                              notification.unread ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <div className="flex shrink-0 items-center gap-2 text-slate-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              {notification.time}
                            </span>
                          </div>
                        </div>

                        <p
                          className={`mb-4 text-sm leading-relaxed ${
                            notification.unread ? 'font-medium text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {notification.description}
                        </p>

                        <div className="flex items-center gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          {notification.targetPath ? (
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-[#2286BE] px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#059669]"
                            >
                              Open
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="h-8 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </Button>
                        </div>
                      </div>

                      {notification.unread ? (
                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#2286BE] shadow-lg shadow-primary/50" />
                      ) : (
                        <div className="mt-1 text-slate-300">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[3rem] border-2 border-dashed border-slate-100 bg-white py-32 text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                <Bell size={40} />
              </div>
              <h3 className="mb-2 text-xl font-black text-slate-900">All caught up!</h3>
              <p className="mx-auto max-w-xs font-medium text-slate-400">
                You have no notifications in this category right now.
              </p>
            </motion.div>
          ) : null}
        </motion.div>

        {filteredNotifications.length > PAGE_SIZE ? (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Page {safeCurrentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-xl border-slate-200"
              >
                <ChevronLeft size={16} className="mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-xl border-slate-200"
              >
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
