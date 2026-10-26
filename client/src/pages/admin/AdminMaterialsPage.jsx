import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Search,
  BookOpen,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Filter,
  FileArchive,
  RefreshCw,
  FolderOpen,
  Eye,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import courseService from '../../services/course.service';
import sessionService from '../../services/session.service';
import assignmentService from '../../services/assignment.service';
import storageService from '../../services/storage.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Skeleton,
  EmptyState,
  Modal,
  FormField,
  FileUploader,
  useToast,
} from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

export const AdminMaterialsPage = () => {
  useDocumentMeta({
    title: 'Course Materials & Notes Manager — Instructor Admin',
    description: 'Central repository for downloadable PDF lecture notes, cheatsheets, and starter templates across all bootcamp cohorts.',
  });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'note' | 'assignment'

  const [downloadingKey, setDownloadingKey] = useState(null);

  // Quick Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [courseSessions, setCourseSessions] = useState([]);
  const [uploadSessionId, setUploadSessionId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadedKey, setUploadedKey] = useState('');
  const [uploadedName, setUploadedName] = useState('');
  const [savingUpload, setSavingUpload] = useState(false);

  // 1. Fetch All Courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await courseService.getCoursesAdmin();
        const list = Array.isArray(res) ? res : res?.items || [];
        setCourses(list);

        const queryId = searchParams.get('courseId');
        if (queryId && (queryId === 'all' || list.some((c) => c._id === queryId))) {
          setSelectedCourseId(queryId);
        } else if (list.length > 0) {
          setSelectedCourseId(list[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 2. Fetch Materials based on selectedCourseId
  const fetchAllMaterials = async () => {
    if (courses.length === 0) return;
    setLoadingMaterials(true);

    try {
      const targetCourses =
        selectedCourseId === 'all'
          ? courses
          : courses.filter((c) => c._id === selectedCourseId);

      const allCollected = [];

      await Promise.all(
        targetCourses.map(async (c) => {
          try {
            const [sessRes, assignRes] = await Promise.all([
              sessionService.getCourseSessionsAdmin(c._id).catch(() => []),
              assignmentService.getAssignmentsByCourse(c._id).catch(() => ({ items: [] })),
            ]);

            const sessList = Array.isArray(sessRes) ? sessRes : sessRes?.sessions || [];
            const assignList = Array.isArray(assignRes) ? assignRes : assignRes?.items || [];

            // Add session resources
            sessList.forEach((sess) => {
              if (Array.isArray(sess.resources)) {
                sess.resources.forEach((res, idx) => {
                  allCollected.push({
                    id: `sess_${sess._id}_${idx}`,
                    type: 'note',
                    title: res.title || `Lecture Note (${sess.title})`,
                    fileName: res.fileName || storageService.getDisplayFilename(res.fileKey),
                    fileKey: res.fileKey,
                    courseId: c._id,
                    courseTitle: c.title,
                    week: sess.week || 1,
                    order: sess.order || 1,
                    parentTitle: sess.title,
                    sessionId: sess._id,
                    createdAt: sess.scheduledAt,
                  });
                });
              }
            });

            // Add assignment attachments
            assignList.forEach((assign) => {
              if (assign.attachmentKey) {
                allCollected.push({
                  id: `assign_${assign._id}`,
                  type: 'assignment',
                  title: `${assign.title} (Starter / Spec)`,
                  fileName: assign.attachmentName || storageService.getDisplayFilename(assign.attachmentKey),
                  fileKey: assign.attachmentKey,
                  courseId: c._id,
                  courseTitle: c.title,
                  week: assign.week || 1,
                  order: 99,
                  parentTitle: assign.title,
                  assignmentId: assign._id,
                  createdAt: assign.dueAt,
                });
              }
            });
          } catch {
            // Ignore single course failure
          }
        })
      );

      // Sort by week and title
      allCollected.sort((a, b) => a.week - b.week);
      setMaterials(allCollected);
    } catch (err) {
      toast.error('Failed to load course materials.');
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchAllMaterials();
  }, [selectedCourseId, courses]);

  // Handle course switch
  const handleCourseFilterChange = (id) => {
    setSelectedCourseId(id);
    setSearchParams(id ? { courseId: id } : {});
  };

  // Handle Download
  const handleDownload = async (item) => {
    if (!item.fileKey) return;
    setDownloadingKey(item.fileKey);

    try {
      const res = await storageService.getFileUrl(item.fileKey);
      if (res?.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${item.fileName || 'file'}...`);
      } else {
        toast.error('Unable to retrieve signed download URL.');
      }
    } catch (err) {
      toast.error(err.message || 'Download failed.');
    } finally {
      setDownloadingKey(null);
    }
  };

  // Open Upload Modal
  const handleOpenUploadModal = async () => {
    const defaultCourse = selectedCourseId !== 'all' ? selectedCourseId : courses[0]?._id;
    setUploadCourseId(defaultCourse || '');
    setUploadTitle('');
    setUploadedKey('');
    setUploadedName('');
    setUploadModalOpen(true);

    if (defaultCourse) {
      loadSessionsForCourse(defaultCourse);
    }
  };

  const loadSessionsForCourse = async (courseId) => {
    try {
      const res = await sessionService.getCourseSessionsAdmin(courseId);
      const list = Array.isArray(res) ? res : res?.sessions || [];
      setCourseSessions(list);
      if (list.length > 0) {
        setUploadSessionId(list[0]._id);
      } else {
        setUploadSessionId('');
      }
    } catch {
      setCourseSessions([]);
    }
  };

  // Attach Uploaded PDF Note to Session
  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!uploadSessionId) {
      toast.error('Please select an active session to attach this note to.');
      return;
    }
    if (!uploadedKey) {
      toast.error('Please upload a PDF note file first.');
      return;
    }

    setSavingUpload(true);
    try {
      const session = courseSessions.find((s) => s._id === uploadSessionId);
      if (!session) throw new Error('Session not found.');

      const existingResources = session.resources || [];
      const newResource = {
        title: uploadTitle.trim() || 'Lecture Notes',
        fileKey: uploadedKey,
        fileName: uploadedName || storageService.getDisplayFilename(uploadedKey),
      };

      await sessionService.updateSessionAdmin(uploadSessionId, {
        resources: [...existingResources, newResource],
      });

      toast.success('Lecture note attached successfully!');
      setUploadModalOpen(false);
      fetchAllMaterials();
    } catch (err) {
      toast.error(err.message || 'Failed to attach material.');
    } finally {
      setSavingUpload(false);
    }
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFile = item.fileName.toLowerCase().includes(q);
        const matchesParent = item.parentTitle.toLowerCase().includes(q);
        const matchesCourse = item.courseTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesFile && !matchesParent && !matchesCourse) return false;
      }

      if (selectedType === 'note' && item.type !== 'note') return false;
      if (selectedType === 'assignment' && item.type !== 'assignment') return false;

      return true;
    });
  }, [materials, searchQuery, selectedType]);

  // Statistics
  const totalNotes = materials.filter((m) => m.type === 'note').length;
  const totalStarters = materials.filter((m) => m.type === 'assignment').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <PageHeader
        title="Notes & Materials Repository"
        subtitle="Manage and inspect all downloadable PDF lecture notes, cheatsheets, and starter templates across bootcamp cohorts."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Notes & Materials' },
        ]}
        action={
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenUploadModal}
          >
            Upload Lecture Note
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-paper rounded border border-line text-primary">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Total Files
              </span>
              <span className="text-xl font-bold font-mono text-ink">
                {materials.length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-paper rounded border border-line text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Session Lecture Notes (PDF)
              </span>
              <span className="text-xl font-bold font-mono text-ink">
                {totalNotes}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-line">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-paper rounded border border-line text-warning">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                Assignment Starter Templates
              </span>
              <span className="text-xl font-bold font-mono text-ink">
                {totalStarters}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-surface border border-line rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Course Selector */}
          <div className="w-full md:w-80">
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Filter by Bootcamp Cohort
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseFilterChange(e.target.value)}
              className="w-full h-10 px-3 pr-8 bg-paper border border-line rounded text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Bootcamps ({courses.length})</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search Field */}
          <div className="w-full md:w-80">
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Search Material Records
            </label>
            <Input
              icon={Search}
              placeholder="Search filename, title, session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-xs"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
          <span className="text-[11px] font-medium text-ink-muted mr-1">File Type:</span>
          
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              selectedType === 'all'
                ? 'bg-primary text-white border-primary font-medium'
                : 'bg-paper text-ink-muted border-line hover:text-ink'
            }`}
          >
            All Types ({materials.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('note')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              selectedType === 'note'
                ? 'bg-primary text-white border-primary font-medium'
                : 'bg-paper text-ink-muted border-line hover:text-ink'
            }`}
          >
            Lecture Notes ({totalNotes})
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('assignment')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              selectedType === 'assignment'
                ? 'bg-primary text-white border-primary font-medium'
                : 'bg-paper text-ink-muted border-line hover:text-ink'
            }`}
          >
            Assignment Files ({totalStarters})
          </button>
        </div>
      </div>

      {/* Materials Table */}
      {loadingMaterials ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <EmptyState
              icon={FileText}
              title="No Course Materials Found"
              description={
                searchQuery || selectedType !== 'all'
                  ? 'No documents match your active search filters.'
                  : 'No downloadable notes or starter code have been attached to this cohort yet. Click "Upload Lecture Note" to attach a file.'
              }
              action={
                <Button variant="primary" size="md" icon={Plus} onClick={handleOpenUploadModal}>
                  Upload First Material
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface border-b border-line text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Bootcamp Cohort</th>
                  <th className="py-3 px-4">Context</th>
                  <th className="py-3 px-4">Stored Filename</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-paper rounded border border-line shrink-0">
                          {item.type === 'note' ? (
                            <FileText className="w-4 h-4 text-primary" />
                          ) : (
                            <FileArchive className="w-4 h-4 text-warning" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-ink block truncate max-w-xs" title={item.title}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-ink-muted font-mono">
                            Week {item.week}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-ink font-medium">
                      <span className="truncate block max-w-[200px]" title={item.courseTitle}>
                        {item.courseTitle}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-ink-muted">
                      <span className="truncate block max-w-[180px]" title={item.parentTitle}>
                        {item.type === 'note' ? 'Lecture:' : 'Task:'} {item.parentTitle}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-ink-muted">
                      <span className="truncate block max-w-[180px]" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownload(item)}
                          loading={downloadingKey === item.fileKey}
                          className="h-7 text-xs px-2.5"
                        >
                          Download
                        </Button>

                        {item.sessionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={ExternalLink}
                            onClick={() => navigate(`/admin/courses/${item.courseId}/sessions`)}
                            className="h-7 text-xs px-2 text-ink-muted hover:text-ink"
                            title="Manage in Sessions View"
                          >
                            Session
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Material Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload & Attach Lecture Note"
        size="md"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          {/* Target Course */}
          <FormField label="Target Bootcamp Cohort" required>
            <select
              value={uploadCourseId}
              onChange={(e) => {
                setUploadCourseId(e.target.value);
                loadSessionsForCourse(e.target.value);
              }}
              className="w-full h-10 px-3 bg-paper border border-line rounded text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </FormField>

          {/* Target Session */}
          <FormField
            label="Associate with Live Session"
            required
            helperText="The note will appear in the student classroom space for this class session"
          >
            {courseSessions.length === 0 ? (
              <div className="p-3 bg-paper border border-line rounded text-xs text-ink-muted">
                No sessions found for this course yet. Please schedule a session first in the Sessions tab.
              </div>
            ) : (
              <select
                value={uploadSessionId}
                onChange={(e) => setUploadSessionId(e.target.value)}
                className="w-full h-10 px-3 bg-paper border border-line rounded text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {courseSessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    Week {s.week} • {s.title}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          {/* Title */}
          <FormField label="Material / Note Title" required>
            <Input
              placeholder="e.g. Session 05 Architecture & Data Modeling Cheatsheet"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="h-10 text-xs"
            />
          </FormField>

          {/* FileUploader */}
          <div className="space-y-1.5">
            <FileUploader
              kind="pdf"
              courseId={uploadCourseId}
              accept="application/pdf"
              label="Upload PDF Document"
              helperText="PDF up to 20MB. Uploads directly to Supabase Storage with original filename."
              value={uploadedKey}
              fileName={uploadedName}
              onChange={(key, name) => {
                setUploadedKey(key);
                setUploadedName(name);
              }}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-line">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!uploadedKey || !uploadSessionId}
              isLoading={savingUpload}
            >
              Save & Attach Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminMaterialsPage;
