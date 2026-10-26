import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileCheck2,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import notificationService from '../../services/notification.service';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll unread count every 30 seconds
  const fetchUnread = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res?.count || 0);
    } catch {
      // ignore background poll errors
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent notifications when dropdown opens
  const fetchRecent = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 6 });
      setNotifications(res?.items || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open) {
      fetchRecent();
    }
    setOpen(!open);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, readAt: new Date() })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClickItem = async (notification) => {
    try {
      if (!notification.readAt) {
        await notificationService.markAsRead(notification._id);
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch {
      // ignore
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
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

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  const fullNotificationsPath = user?.role === 'admin' ? '/admin/notifications' : '/student/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 text-ink-muted hover:text-ink hover:bg-surface rounded-md transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-paper font-mono">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-paper border border-line rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-line animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-primary/10 text-primary rounded font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-line/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted space-y-1">
                <Bell className="w-6 h-6 mx-auto text-ink-muted/50 mb-2" />
                <p className="font-medium text-ink">No notifications yet</p>
                <p className="text-[11px]">Class announcements and grades will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;

                return (
                  <button
                    key={n._id}
                    onClick={() => handleClickItem(n)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 p-1.5 bg-surface border border-line rounded-md">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-ink' : 'font-medium text-ink'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] font-mono text-ink-muted shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-surface/50 text-center">
            <Link
              to={fullNotificationsPath}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
