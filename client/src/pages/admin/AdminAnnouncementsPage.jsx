import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  Edit,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Megaphone,
} from 'lucide-react';
import courseService from '../../services/course.service';
import announcementService from '../../services/announcement.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
  Modal,
  ConfirmDialog,
  FormField,
  Input,
  Textarea,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminAnnouncementsPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    pinned: false,
  });

  // Delete State
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await courseService.getAdminCourses({ limit: 100 });
        const items = res.items || [];
        setCourses(items);

        if (!selectedCourseId && items.length > 0) {
          setSelectedCourseId(items[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load courses.');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    if (!selectedCourseId) return;
    setLoadingAnnouncements(true);
    try {
      const res = await announcementService.getAdminAnnouncements(selectedCourseId);
      setAnnouncements(res?.items || []);
    } catch (err) {
      toast.error('Failed to load announcements.');
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      setSearchParams({ courseId: selectedCourseId });
      fetchAnnouncements();
    }
  }, [selectedCourseId]);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', body: '', pinned: false });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingAnnouncement(item);
    setFormData({
      title: item.title,
      body: item.body,
      pinned: Boolean(item.pinned),
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Title and message body are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement._id, formData);
        toast.success('Announcement updated.');
      } else {
        await announcementService.createAnnouncement(selectedCourseId, formData);
        toast.success('Announcement published and notifications sent to students.');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await announcementService.deleteAnnouncement(toDelete._id);
      toast.success('Announcement deleted.');
      setToDelete(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement.');
    } finally {
      setDeleting(false);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Announcements"
        subtitle="Broadcast updates, lecture rescheduling notices, and coding tips directly to enrolled students."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnnouncements}
              disabled={loadingAnnouncements}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              disabled={!selectedCourseId}
              icon={Plus}
            >
              Post Announcement
            </Button>
          </div>
        }
      />

      {/* Cohort Selector Card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Select Bootcamp Cohort
            </label>
            {loadingCourses ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                options={courses.map((c) => ({
                  value: c._id,
                  label: `${c.title} (${c.level || 'All Levels'})`,
                }))}
              />
            )}
          </div>

          <div className="text-right sm:border-l sm:border-line sm:pl-4">
            <span className="text-xs text-ink-muted block">Total Broadcasts</span>
            <span className="font-mono text-lg font-bold text-ink">
              {announcements.length} notices
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Feed */}
      {loadingAnnouncements ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Megaphone}
              title="No Announcements Posted Yet"
              description="Post an announcement to notify all enrolled students via in-app alerts and notifications."
              action={
                <Button variant="primary" size="sm" onClick={handleOpenCreate} icon={Plus}>
                  Post First Announcement
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card
              key={ann._id}
              className={`overflow-hidden transition-all ${
                ann.pinned ? 'border-primary/50 shadow-xs' : 'hover:border-ink/20'
              }`}
            >
              <CardHeader className="p-4 pb-2 border-b border-line bg-surface/30 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.pinned && (
                    <Badge variant="primary" className="text-[10px] flex items-center gap-1">
                      <Pin className="w-3 h-3" /> PINNED NOTICE
                    </Badge>
                  )}
                  <h3 className="text-sm font-bold text-ink">
                    {ann.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(ann)}
                    icon={Edit}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setToDelete(ann)}
                    className="text-danger hover:bg-danger/10"
                    icon={Trash2}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">
                  {ann.body}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[11px] text-ink-muted font-mono">
                  <span>Author: {ann.createdBy?.name || 'Instructor'}</span>
                  <span>{formatPKTDateTime(ann.createdAt)} PKT</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnnouncement ? 'Edit Announcement' : 'Post Cohort Announcement'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Announcement Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Saturday Masterclass Rescheduled"
              required
            />
          </FormField>

          <FormField label="Message Body (Markdown Supported)" required helperText="Supports paragraphs, lists, and links">
            <Textarea
              rows={5}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Enter announcement details..."
              required
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-ink pt-1">
            <input
              type="checkbox"
              checked={formData.pinned}
              onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
              className="rounded border-line text-primary focus:ring-0"
            />
            <span className="font-medium">Pin announcement to top of student feed</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
            >
              {editingAnnouncement ? 'Save Changes' : 'Broadcast Announcement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        title="Delete Announcement"
        message={`Are you sure you want to delete the announcement "${toDelete?.title}"?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default AdminAnnouncementsPage;
