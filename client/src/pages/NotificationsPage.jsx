import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileCheck2,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import notificationService from '../services/notification.service';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  Pagination,
  useToast,
} from '../components/ui';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ page, limit: 15 });
      setNotifications(res?.items || []);
      setUnreadCount(res?.unreadCount || 0);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkAsRead = async (notification) => {
    try {
      await notificationService.markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (notification.link) {
        navigate(notification.link);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_scheduled':
      case 'session_rescheduled':
      case 'session_cancelled':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'assignment_graded':
      case 'assignment_returned':
      case 'assignment_published':
        return <FileCheck2 className="w-4 h-4 text-success" />;
      case 'quiz_published':
        return <HelpCircle className="w-4 h-4 text-warning" />;
      case 'enrollment_approved':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'enrollment_rejected':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'announcement_created':
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const formatPKTDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  const filteredItems = notifications.filter((n) => (filter === 'unread' ? !n.readAt : true));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with course announcements, live session alerts, and grading feedback."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkAllRead}
                icon={CheckCheck}
              >
                Mark All Read
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            filter === 'all'
              ? 'bg-paper text-ink border border-line shadow-xs'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            filter === 'unread'
              ? 'bg-paper text-ink border border-line shadow-xs'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Bell}
              title={filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
              description="Important alerts about classes, assignments, and grades will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((n) => {
            const isUnread = !n.readAt;

            return (
              <Card
                key={n._id}
                className={`transition-colors ${
                  isUnread ? 'border-primary/40 bg-primary/5' : 'hover:border-ink/20'
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2 bg-surface border border-line rounded-md shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-ink">
                          {n.title}
                        </h4>
                        {isUnread && (
                          <Badge variant="primary" className="text-[10px] font-mono">
                            UNREAD
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {n.body}
                      </p>
                      <span className="text-[11px] font-mono text-ink-muted block pt-1">
                        {formatPKTDateTime(n.createdAt)} PKT
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {n.link && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMarkAsRead(n)}
                        icon={ExternalLink}
                        className="text-xs"
                      >
                        Open
                      </Button>
                    )}
                    {isUnread && !n.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(n)}
                        className="text-xs"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {pagination.totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
