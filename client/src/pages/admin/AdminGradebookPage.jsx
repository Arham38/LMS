import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import courseService from '../../services/course.service';
import gradebookService from '../../services/gradebook.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
  Avatar,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminGradebookPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [gradebookData, setGradebookData] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGradebook, setLoadingGradebook] = useState(false);

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

  // Fetch Gradebook
  const fetchGradebook = async () => {
    if (!selectedCourseId) return;
    setLoadingGradebook(true);
    try {
      const res = await gradebookService.getAdminGradebook(selectedCourseId);
      setGradebookData(res);
    } catch (err) {
      toast.error('Failed to load gradebook.');
      setGradebookData(null);
    } finally {
      setLoadingGradebook(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      setSearchParams({ courseId: selectedCourseId });
      fetchGradebook();
    }
  }, [selectedCourseId]);

  const course = gradebookData?.course || {};
  const meta = gradebookData?.meta || {};
  const students = gradebookData?.students || [];
  const weights = course?.gradeWeights || { attendance: 20, quizzes: 40, assignments: 40 };

  const getBadgeVariant = (badge) => {
    switch (badge) {
      case 'Excellent':
        return 'success';
      case 'Good':
        return 'primary';
      case 'Passing':
        return 'default';
      case 'At Risk':
      default:
        return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Gradebook"
        subtitle="Consolidated evaluation matrix combining live lecture attendance, auto-graded quizzes, and graded homework."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGradebook}
              disabled={loadingGradebook}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            {selectedCourseId && (
              <a
                href={gradebookService.getExportCSVUrl(selectedCourseId)}
                download
                className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-ink bg-surface border border-line rounded hover:bg-surface-hover hover:border-ink/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-ink-muted" />
                Export Gradebook CSV
              </a>
            )}
          </div>
        }
      />

      {/* Cohort Selector & Configurable Weights Card */}
      <Card>
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          {/* Configured Weights Display */}
          <div className="flex items-center gap-4 bg-surface p-3 rounded-md border border-line text-xs">
            <span className="font-semibold text-ink-muted uppercase tracking-wider text-[11px]">
              Grading Weights:
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span>Attendance: <strong className="text-ink">{weights.attendance}%</strong></span>
              <span>•</span>
              <span>Quizzes: <strong className="text-ink">{weights.quizzes}%</strong></span>
              <span>•</span>
              <span>Assignments: <strong className="text-ink">{weights.assignments}%</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gradebook Matrix Table with Sticky Column */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[640px] relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-paper z-20 shadow-xs border-b border-line">
                <tr className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider bg-surface/60">
                  {/* Sticky First Column */}
                  <th className="sticky left-0 bg-surface/90 backdrop-blur-xs z-30 p-3.5 border-r border-line min-w-[200px]">
                    Student
                  </th>

                  {/* Attendance */}
                  <th className="p-3 text-center border-r border-line min-w-[110px]">
                    Attendance
                  </th>

                  {/* Quizzes Columns */}
                  {meta.quizzes?.map((q) => (
                    <th key={q._id} className="p-3 text-center border-r border-line min-w-[100px] truncate max-w-[130px]" title={q.title}>
                      Q: {q.title}
                    </th>
                  ))}
                  <th className="p-3 text-center border-r border-line min-w-[90px] bg-surface-alt/40">
                    Quiz Avg %
                  </th>

                  {/* Assignments Columns */}
                  {meta.assignments?.map((a) => (
                    <th key={a._id} className="p-3 text-center border-r border-line min-w-[110px] truncate max-w-[140px]" title={a.title}>
                      HW: {a.title}
                    </th>
                  ))}
                  <th className="p-3 text-center border-r border-line min-w-[90px] bg-surface-alt/40">
                    HW Avg %
                  </th>

                  {/* Overall & Performance */}
                  <th className="p-3 text-center border-r border-line min-w-[100px] bg-primary/5">
                    Overall %
                  </th>
                  <th className="p-3 text-center min-w-[110px]">
                    Standing
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line text-xs font-mono">
                {loadingGradebook ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-ink-muted font-sans">
                      Loading gradebook matrix...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-ink-muted font-sans">
                      No enrolled students found for this cohort.
                    </td>
                  </tr>
                ) : (
                  students.map((row) => (
                    <tr key={row.student._id} className="hover:bg-surface/40 transition-colors">
                      {/* Sticky Student Profile Column */}
                      <td className="sticky left-0 bg-paper hover:bg-surface/80 transition-colors z-10 p-3 border-r border-line min-w-[200px]">
                        <div className="flex items-center gap-2 font-sans">
                          <Avatar name={row.student.name} src={row.student.avatar} size="xs" />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate text-xs">{row.student.name}</p>
                            <p className="text-[10px] text-ink-muted truncate font-mono">{row.student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="p-3 text-center border-r border-line">
                        <span className={`font-semibold ${row.attendance.percent >= 75 ? 'text-success' : 'text-warning'}`}>
                          {row.attendance.percent}%
                        </span>
                        <span className="block text-[10px] text-ink-muted">
                          ({row.attendance.attendedCount}/{row.attendance.completedSessionCount})
                        </span>
                      </td>

                      {/* Quiz Scores */}
                      {row.quizzes.items.map((q) => (
                        <td key={q.quizId} className="p-3 text-center border-r border-line">
                          {q.attempted ? (
                            <div>
                              <span className="font-semibold text-ink">{q.percent}%</span>
                              <span className="block text-[10px] text-ink-muted">({q.score}/{q.totalMarks})</span>
                            </div>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3 text-center border-r border-line bg-surface-alt/20 font-bold text-ink">
                        {row.quizzes.avgPercent}%
                      </td>

                      {/* Assignment Scores */}
                      {row.assignments.items.map((a) => (
                        <td key={a.assignmentId} className="p-3 text-center border-r border-line">
                          {a.marks !== null ? (
                            <div>
                              <span className="font-semibold text-ink">{a.percent}%</span>
                              <span className="block text-[10px] text-ink-muted">({a.marks}/{a.maxMarks})</span>
                            </div>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3 text-center border-r border-line bg-surface-alt/20 font-bold text-ink">
                        {row.assignments.avgPercent}%
                      </td>

                      {/* Overall % */}
                      <td className="p-3 text-center border-r border-line bg-primary/5">
                        <span className="text-sm font-bold text-primary">
                          {row.finalOverallPercent}%
                        </span>
                      </td>

                      {/* Standing Badge */}
                      <td className="p-3 text-center font-sans">
                        <Badge variant={getBadgeVariant(row.performanceBadge)} className="text-[10px]">
                          {row.performanceBadge}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGradebookPage;
