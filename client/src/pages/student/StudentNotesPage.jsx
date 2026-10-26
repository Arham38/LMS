import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Download,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  FileCode,
  FileArchive,
  RefreshCw,
} from 'lucide-react';
import dashboardService from '../../services/dashboard.service';
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
  useToast,
} from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

export const StudentNotesPage = () => {
  useDocumentMeta({
    title: 'Lecture Notes & Materials — Student Workspace',
    description: 'Download PDF lecture slides, cheatsheets, and starter templates for your enrolled bootcamps.',
  });

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Materials state
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'notes' | 'assignments'

  // Downloading button loader tracking
  const [downloadingKey, setDownloadingKey] = useState(null);

  // 1. Fetch Enrolled Courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await dashboardService.getStudentDashboard();
        const courses = res?.courses || [];
        setEnrolledCourses(courses);

        // Preselect course from URL query or first course
        const queryCourseId = searchParams.get('courseId');
        if (queryCourseId && courses.some((c) => c._id === queryCourseId)) {
          setSelectedCourseId(queryCourseId);
        } else if (courses.length > 0) {
          setSelectedCourseId(courses[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load your enrolled bootcamps.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // 2. Fetch Sessions & Assignments for Selected Course to extract all materials
  useEffect(() => {
    if (!selectedCourseId) {
      setMaterials([]);
      return;
    }

    const fetchCourseMaterials = async () => {
      setLoadingMaterials(true);
      try {
        const [sessionsRes, assignmentsRes] = await Promise.all([
          sessionService.getCourseSessionsStudent(selectedCourseId).catch(() => ({ sessions: [] })),
          assignmentService.getCourseAssignmentsStudent(selectedCourseId).catch(() => ({ items: [] })),
        ]);

        const sessionsList = Array.isArray(sessionsRes) ? sessionsRes : sessionsRes?.sessions || [];
        const assignmentsList = Array.isArray(assignmentsRes) ? assignmentsRes : assignmentsRes?.items || [];

        const collected = [];

        // Collect Session Resources (Lecture Notes / PDF Slides)
        sessionsList.forEach((sess) => {
          if (Array.isArray(sess.resources) && sess.resources.length > 0) {
            sess.resources.forEach((res, idx) => {
              collected.push({
                id: `sess_${sess._id}_${idx}`,
                type: 'note',
                title: res.title || `Lecture Note: ${sess.title}`,
                fileName: res.fileName || storageService.getDisplayFilename(res.fileKey),
                fileKey: res.fileKey,
                week: sess.week || 1,
                order: sess.order || 1,
                parentTitle: sess.title,
                parentDate: sess.scheduledAt,
                isSession: true,
              });
            });
          }
        });

        // Collect Assignment Starter Files / Spec Attachments
        assignmentsList.forEach((assign) => {
          if (assign.attachmentKey) {
            collected.push({
              id: `assign_${assign._id}`,
              type: 'assignment_file',
              title: `${assign.title} (Starter / Spec)`,
              fileName: assign.attachmentName || storageService.getDisplayFilename(assign.attachmentKey),
              fileKey: assign.attachmentKey,
              week: assign.week || 1,
              order: 99,
              parentTitle: assign.title,
              parentDate: assign.dueAt,
              isSession: false,
            });
          }
        });

        // Sort by week ascending, then session order
        collected.sort((a, b) => {
          if (a.week !== b.week) return a.week - b.week;
          return a.order - b.order;
        });

        setMaterials(collected);
      } catch (err) {
        toast.error('Failed to load course materials.');
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchCourseMaterials();
  }, [selectedCourseId]);

  // Handle course switch
  const handleCourseChange = (id) => {
    setSelectedCourseId(id);
    setSearchParams(id ? { courseId: id } : {});
    setSearchQuery('');
    setSelectedWeek('all');
  };

  // Handle direct file download
  const handleDownload = async (item) => {
    if (!item.fileKey) return;
    setDownloadingKey(item.fileKey);

    try {
      const res = await storageService.getFileUrl(item.fileKey);
      if (res?.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${item.fileName || 'file'}...`);
      } else {
        toast.error('Unable to retrieve file download URL.');
      }
    } catch (err) {
      toast.error(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloadingKey(null);
    }
  };

  // Weeks available in current materials
  const availableWeeks = useMemo(() => {
    const weeks = new Set(materials.map((m) => m.week));
    return Array.from(weeks).sort((a, b) => a - b);
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesFile = item.fileName.toLowerCase().includes(q);
        const matchesParent = item.parentTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesFile && !matchesParent) return false;
      }

      // Week filter
      if (selectedWeek !== 'all' && item.week !== Number(selectedWeek)) {
        return false;
      }

      // Type filter
      if (selectedType === 'notes' && item.type !== 'note') return false;
      if (selectedType === 'assignments' && item.type !== 'assignment_file') return false;

      return true;
    });
  }, [materials, searchQuery, selectedWeek, selectedType]);

  // Group materials by Week for editorial layout
  const groupedByWeek = useMemo(() => {
    const map = new Map();
    filteredMaterials.forEach((item) => {
      if (!map.has(item.week)) {
        map.set(item.week, []);
      }
      map.get(item.week).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredMaterials]);

  const activeCourse = enrolledCourses.find((c) => c._id === selectedCourseId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <PageHeader
        title="Notes & Course Materials"
        subtitle="Download lecture slides, architecture cheatsheets, and starter templates provided by your instructor."
        breadcrumbs={[
          { label: 'Student', to: '/student/dashboard' },
          { label: 'Notes & Materials' },
        ]}
      />

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full max-w-sm rounded" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : enrolledCourses.length === 0 ? (
        /* Empty State: No Approved Courses */
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <EmptyState
              icon={BookOpen}
              title="No Enrolled Cohorts Found"
              description="You do not have an approved enrollment in any bootcamp yet. Once your enrollment is approved, your lecture notes, slides, and files will appear here."
              action={
                <Button variant="primary" size="md" onClick={() => navigate('/courses')}>
                  Explore Available Bootcamps
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top Bar: Course Selector & Search Filters */}
          <div className="bg-surface border border-line rounded-lg p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Course Selector Dropdown */}
              <div className="w-full md:w-80">
                <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                  Select Bootcamp Cohort
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full h-10 px-3 pr-8 bg-paper border border-line rounded text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {enrolledCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Field */}
              <div className="w-full md:w-72">
                <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                  Search Materials
                </label>
                <Input
                  icon={Search}
                  placeholder="Search slides, cheatsheets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
              <span className="text-[11px] font-medium text-ink-muted mr-1">Filter:</span>
              
              <button
                type="button"
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  selectedType === 'all'
                    ? 'bg-primary text-white border-primary font-medium'
                    : 'bg-paper text-ink-muted border-line hover:text-ink'
                }`}
              >
                All Files ({materials.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('notes')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  selectedType === 'notes'
                    ? 'bg-primary text-white border-primary font-medium'
                    : 'bg-paper text-ink-muted border-line hover:text-ink'
                }`}
              >
                Session Notes ({materials.filter((m) => m.type === 'note').length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedType('assignments')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  selectedType === 'assignments'
                    ? 'bg-primary text-white border-primary font-medium'
                    : 'bg-paper text-ink-muted border-line hover:text-ink'
                }`}
              >
                Assignment Starters ({materials.filter((m) => m.type === 'assignment_file').length})
              </button>

              {availableWeeks.length > 1 && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[11px] text-ink-muted">Week:</span>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="h-7 text-xs bg-paper border border-line rounded px-2 text-ink font-medium"
                  >
                    <option value="all">All Weeks</option>
                    {availableWeeks.map((w) => (
                      <option key={w} value={w}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Materials Content */}
          {loadingMaterials ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <EmptyState
                  icon={FileText}
                  title="No Materials Found"
                  description={
                    searchQuery || selectedWeek !== 'all' || selectedType !== 'all'
                      ? 'No notes match your active search filters. Try clearing your search keywords.'
                      : `No lecture notes or files have been uploaded yet for ${activeCourse?.title || 'this cohort'}. Files appear here as sessions take place.`
                  }
                  action={
                    searchQuery || selectedWeek !== 'all' || selectedType !== 'all' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedWeek('all');
                          setSelectedType('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : null
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedByWeek.map(([weekNum, items]) => (
                <div key={weekNum} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary bg-primary-soft px-2.5 py-1 rounded">
                      Week {weekNum}
                    </span>
                    <span className="text-xs text-ink-muted">
                      ({items.length} {items.length === 1 ? 'resource' : 'resources'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className="hover:border-ink/30 transition-all border-line bg-surface"
                      >
                        <CardContent className="p-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2.5 bg-paper rounded border border-line text-primary shrink-0 mt-0.5">
                              {item.type === 'note' ? (
                                <FileText className="w-5 h-5 text-primary" />
                              ) : (
                                <FileArchive className="w-5 h-5 text-warning" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <h4 className="text-sm font-semibold text-ink truncate" title={item.title}>
                                {item.title}
                              </h4>

                              <p className="text-[11px] text-ink-muted truncate" title={item.parentTitle}>
                                {item.isSession ? 'Lecture:' : 'Task:'} {item.parentTitle}
                              </p>

                              <div className="flex items-center gap-2 pt-0.5">
                                <span
                                  className="text-[10px] font-mono text-ink-muted bg-paper px-2 py-0.5 rounded border border-line truncate max-w-[200px]"
                                  title={item.fileName}
                                >
                                  {item.fileName}
                                </span>
                                <Badge variant={item.type === 'note' ? 'primary' : 'warning'} size="sm">
                                  {item.type === 'note' ? 'PDF Slide' : 'Starter Code'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            icon={Download}
                            onClick={() => handleDownload(item)}
                            loading={downloadingKey === item.fileKey}
                            className="shrink-0 text-xs"
                          >
                            Download
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentNotesPage;
