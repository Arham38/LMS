import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
  Mail,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { contactService } from '../../services/contact.service';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

export const AdminMessagesPage = () => {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRead, setFilterRead] = useState('all'); // 'all', 'unread', 'read'
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (filterRead === 'unread') params.read = 'false';
      if (filterRead === 'read') params.read = 'true';
      if (search.trim()) params.search = search.trim();

      const res = await contactService.getAdminMessages(params);
      setMessages(res.messages || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0, unreadCount: 0 });

      // If a message was selected, refresh it
      if (selectedMessage) {
        const refreshed = (res.messages || []).find((m) => m._id === selectedMessage._id);
        if (refreshed) {
          setSelectedMessage(refreshed);
          setAdminNotes(refreshed.adminNotes || '');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Contact Inquiries — Admin Workspace';
    fetchMessages(1);
  }, [filterRead]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMessages(1);
  };

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    setAdminNotes(msg.adminNotes || '');

    // If message is unread, automatically mark as read
    if (!msg.read) {
      try {
        await contactService.updateMessageStatus(msg._id, { read: true });
        msg.read = true;
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, read: true } : m)));
        setPagination((prev) => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  const handleToggleRead = async (msg, e) => {
    e.stopPropagation();
    try {
      const newStatus = !msg.read;
      await contactService.updateMessageStatus(msg._id, { read: newStatus });
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, read: newStatus } : m))
      );
      if (selectedMessage?._id === msg._id) {
        setSelectedMessage((prev) => ({ ...prev, read: newStatus }));
      }
      setPagination((prev) => ({
        ...prev,
        unreadCount: newStatus ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount + 1,
      }));
      toast.success(newStatus ? 'Message marked as read' : 'Message marked as unread');
    } catch (err) {
      toast.error('Failed to update message status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    setUpdating(true);
    try {
      await contactService.updateMessageStatus(selectedMessage._id, { adminNotes });
      setSelectedMessage((prev) => ({ ...prev, adminNotes }));
      setMessages((prev) =>
        prev.map((m) => (m._id === selectedMessage._id ? { ...m, adminNotes } : m))
      );
      toast.success('Private staff notes saved');
    } catch (err) {
      toast.error('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const promptDelete = (id, e) => {
    e.stopPropagation();
    setMessageToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;
    setDeleting(true);
    try {
      await contactService.deleteMessage(messageToDelete);
      setMessages((prev) => prev.filter((m) => m._id !== messageToDelete));
      if (selectedMessage?._id === messageToDelete) {
        setSelectedMessage(null);
      }
      toast.success('Message deleted');
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    } catch (err) {
      toast.error('Failed to delete message');
    } finally {
      setDeleting(false);
    }
  };

  const cleanPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('03')) {
      digits = '92' + digits.substring(1);
    }
    return digits;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-serif font-bold text-ink">Inquiries & Contact Inbox</h1>
          <p className="text-xs text-ink-muted">
            Incoming queries from prospective students via the public contact form.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={pagination.unreadCount > 0 ? 'accent' : 'neutral'}>
            {pagination.unreadCount} Unread
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchMessages(pagination.page)}
            leftIcon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Search name, email, phone, or question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-1 bg-surface border border-line p-1 rounded">
          <button
            type="button"
            onClick={() => setFilterRead('all')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              filterRead === 'all' ? 'bg-primary text-surface font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            All ({pagination.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterRead('unread')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              filterRead === 'unread' ? 'bg-primary text-surface font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setFilterRead('read')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              filterRead === 'read' ? 'bg-primary text-surface font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Main Inbox Grid: Message List on Left, Detail Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List (7 Cols) */}
        <div className="lg:col-span-5 space-y-2">
          {loading && messages.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted bg-surface border border-line rounded">
              Loading inbox messages...
            </div>
          ) : error ? (
            <div className="p-4 bg-danger-soft text-danger text-xs border border-danger/20 rounded">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted bg-surface border border-line rounded">
              No messages found.
            </div>
          ) : (
            messages.map((msg) => {
              const isSelected = selectedMessage?._id === msg._id;
              return (
                <div
                  key={msg._id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-soft/50 border-primary'
                      : !msg.read
                      ? 'bg-surface border-line font-medium shadow-2xs'
                      : 'bg-surface/60 border-line/70 hover:bg-surface'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {!msg.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                      <span className="text-xs font-semibold text-ink truncate">{msg.name}</span>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-ink font-medium truncate mb-1">
                    {msg.subject || 'General Inquiry'}
                  </p>

                  <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-line/50 text-[10px] text-ink-muted">
                    <span className="truncate">{msg.email}</span>
                    {msg.phone && <span className="font-mono">{msg.phone}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Message Detail & Reply Panel (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="bg-surface border border-line rounded-lg p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-line gap-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink">
                    {selectedMessage.subject || 'General Inquiry'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted mt-1">
                    <span className="font-semibold text-ink">{selectedMessage.name}</span>
                    <span>•</span>
                    <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                      {selectedMessage.email}
                    </a>
                    {selectedMessage.phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{selectedMessage.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleToggleRead(selectedMessage, e)}
                  >
                    {selectedMessage.read ? 'Mark Unread' : 'Mark Read'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => promptDelete(selectedMessage._id, e)}
                    leftIcon={Trash2}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Message Body */}
              <div className="bg-paper p-4 rounded border border-line text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              {/* Fast Reply Action Bar */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider font-mono block">
                  Quick Reply Channels:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedMessage.phone && (
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(selectedMessage.phone)}?text=${encodeURIComponent(
                        `Hi ${selectedMessage.name}, thank you for contacting CodeCraft regarding "${selectedMessage.subject || 'your inquiry'}". `
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded bg-primary text-surface text-xs font-medium hover:bg-primary-hover transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Reply via WhatsApp ({selectedMessage.phone})
                    </a>
                  )}

                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                      selectedMessage.subject || 'CodeCraft Inquiry'
                    )}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded border border-line bg-surface text-xs font-medium text-ink hover:bg-surface-alt transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Reply via Email
                  </a>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2 pt-4 border-t border-line">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider font-mono block">
                  Internal Staff Notes:
                </span>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private notes (e.g. 'Interested in installment plan, sent details on WhatsApp')..."
                  className="w-full text-xs p-3 border border-line rounded bg-paper focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-lg p-12 text-center text-xs text-ink-muted">
              Select an inquiry on the left to read the full message and send a reply.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setMessageToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Contact Inquiry"
        message="Are you sure you want to permanently delete this inquiry? This action cannot be undone."
        confirmText="Delete Message"
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminMessagesPage;
