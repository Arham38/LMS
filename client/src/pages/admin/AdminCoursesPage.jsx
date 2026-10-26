import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import courseService from '../../services/course.service';
import {
  PageHeader,
  Button,
  IconButton,
  Table,
  Badge,
  DropdownMenu,
  ConfirmDialog,
  useToast,
} from '../../components/ui';

export const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Course deletion state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAdminCourses({
        page,
        limit: 10,
        search,
      });
      setCourses(response.items || []);
      setTotal(response.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Courses & Batches — Admin Workspace';
    fetchCourses();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleTogglePublish = async (course) => {
    try {
      await courseService.updateCourse(course._id, {
        isPublished: !course.isPublished,
      });
      toast.success(`Course ${course.isPublished ? 'unpublished' : 'published'} successfully.`);
      fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Failed to update course status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await courseService.deleteCourse(deleteTarget._id);
      toast.success('Course deleted successfully.');
      setDeleteTarget(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Cannot delete course.');
    } finally {
      setDeleting(false);
    }
  };

  const formatPKR = (val) => `Rs. ${Number(val || 0).toLocaleString('en-PK')}`;

  const columns = [
    {
      key: 'title',
      header: 'Course & Cohort',
      render: (val, row) => (
        <div className="flex flex-col">
          <Link
            to={`/admin/courses/${row._id}/edit`}
            className="font-medium text-ink hover:text-primary transition-colors truncate max-w-[280px]"
          >
            {val}
          </Link>
          <span className="text-[11px] text-ink-muted font-mono">{row.level} • {row.durationWeeks} Weeks</span>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Live Schedule',
      render: (val) => <span className="text-xs text-ink-muted">{val}</span>,
    },
    {
      key: 'seats',
      header: 'Enrolled / Capacity',
      render: (_, row) => (
        <span className="text-xs font-mono tabular-nums">
          <span className="font-semibold text-ink">{row.enrolledCount || 0}</span>
          <span className="text-ink-muted"> / {row.seatsTotal}</span>
          {row.pendingCount > 0 && (
            <span className="ml-1 text-[11px] text-warning font-semibold">
              ({row.pendingCount} pend)
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'fee',
      header: 'Tuition Fee',
      align: 'right',
      render: (val) => (
        <span className="font-display font-semibold text-xs text-ink tabular-nums">
          {formatPKR(val)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.isPublished ? (
            <Badge variant="success" dot>Published</Badge>
          ) : (
            <Badge variant="neutral">Draft</Badge>
          )}
          {row.isEnrollmentOpen ? (
            <Badge variant="primary" dot>Open</Badge>
          ) : (
            <Badge variant="danger">Closed</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <DropdownMenu
          align="right"
          trigger={<IconButton icon={MoreVertical} size="sm" aria-label="Course actions" />}
          items={[
            {
              label: 'Edit Bootcamp',
              icon: Edit,
              onClick: () => navigate(`/admin/courses/${row._id}/edit`),
            },
            {
              label: row.isPublished ? 'Unpublish Course' : 'Publish Course',
              icon: row.isPublished ? XCircle : CheckCircle2,
              onClick: () => handleTogglePublish(row),
            },
            { divider: true },
            {
              label: 'Delete Course',
              icon: Trash2,
              variant: 'danger',
              onClick: () => setDeleteTarget(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses & Batches"
        description="Manage live bootcamp cohorts, seat limits, syllabi, and publishing status."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Courses' },
        ]}
        action={
          <Link to="/admin/courses/new">
            <Button variant="primary" size="md" leftIcon={Plus}>
              Create Bootcamp
            </Button>
          </Link>
        }
      />

      <Table
        columns={columns}
        data={courses}
        isLoading={loading}
        emptyTitle="No Bootcamps Created"
        emptyDescription="Create your first bootcamp course to begin accepting student enrollments."
        emptyActionLabel="Create Bootcamp"
        onEmptyAction={() => navigate('/admin/courses/new')}
        pagination={{
          page,
          limit: 10,
          total,
          totalPages: Math.ceil(total / 10) || 1,
        }}
        onPageChange={(p) => setPage(p)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Bootcamp Course"
        message={`Are you sure you want to delete '${deleteTarget?.title}'? Courses with existing enrollments cannot be deleted and must be unpublished instead.`}
        confirmText="Delete Course"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default AdminCoursesPage;
