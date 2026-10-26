import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  UserX,
  ExternalLink,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import studentManagementService from '../../services/studentManagement.service';
import courseService from '../../services/course.service';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Avatar,
  Table,
  EmptyState,
  Skeleton,
  Pagination,
  ConfirmDialog,
  useToast,
} from '../../components/ui';

export const AdminStudentsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [courseId, setCourseId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Status Toggle Confirmation
  const [studentToToggle, setStudentToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Load Courses for Filter
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await courseService.getAdminCourses({ limit: 100 });
        setCourses(res?.items || []);
      } catch {
        // ignore
      }
    };
    loadCourses();
  }, []);

  // Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentManagementService.getStudents({
        page,
        limit: 15,
        search,
        isActive,
        courseId,
      });
      setStudents(res?.items || []);
      if (res?.pagination) setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, isActive, courseId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleToggleStatus = async () => {
    if (!studentToToggle) return;
    setToggling(true);
    try {
      const nextStatus = !studentToToggle.isActive;
      await studentManagementService.updateStudentStatus(studentToToggle._id, nextStatus);
      toast.success(
        `Student account ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      );
      setStudentToToggle(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to update account status.');
    } finally {
      setToggling(false);
    }
  };

  const formatPKTDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        subtitle="Manage student accounts, moderation flags, private instructor notes, and enrolled cohort records."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            disabled={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                size="sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, email, or phone..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <Select
                size="sm"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Cohorts' },
                  ...courses.map((c) => ({ value: c._id, label: c.title })),
                ]}
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <Select
                size="sm"
                value={isActive}
                onChange={(e) => {
                  setIsActive(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'true', label: 'Active Only' },
                  { value: 'false', label: 'Deactivated' },
                ]}
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <thead>
              <tr className="border-b border-line bg-surface/50 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                <th className="py-3 px-4 text-left">Student</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-center">Approved Cohorts</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-left">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-ink-muted">
                    Loading student roster...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-ink-muted">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={student.name} src={student.avatar} size="sm" />
                        <div>
                          <p className="font-semibold text-ink">{student.name}</p>
                          <p className="text-[11px] text-ink-muted font-mono">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-muted">
                      {student.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {student.approvedEnrollmentsCount || 0}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {student.attendancePercent !== null ? (
                        <span className={`font-semibold ${student.attendancePercent >= 75 ? 'text-success' : 'text-warning'}`}>
                          {student.attendancePercent}%
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={student.isActive ? 'success' : 'danger'} dot className="text-[10px]">
                        {student.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-ink-muted font-mono">
                      {formatPKTDate(student.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/students/${student._id}`)}
                          className="text-xs"
                        >
                          Profile &rarr;
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStudentToToggle(student)}
                          title={student.isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`text-xs px-2 ${student.isActive ? 'text-danger hover:bg-danger/10' : 'text-success hover:bg-success/10'}`}
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-line flex justify-center">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(studentToToggle)}
        title={studentToToggle?.isActive ? 'Deactivate Student Account' : 'Activate Student Account'}
        message={
          studentToToggle?.isActive
            ? `Are you sure you want to deactivate ${studentToToggle?.name}'s account? They will be immediately blocked from signing in or accessing the student portal.`
            : `Are you sure you want to reactivate ${studentToToggle?.name}'s account?`
        }
        confirmText={studentToToggle?.isActive ? 'Deactivate Account' : 'Activate Account'}
        confirmVariant={studentToToggle?.isActive ? 'danger' : 'primary'}
        loading={toggling}
        onConfirm={handleToggleStatus}
        onClose={() => setStudentToToggle(null)}
      />
    </div>
  );
};

export default AdminStudentsPage;
