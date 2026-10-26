import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Calendar,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import enrollmentService from '../../services/enrollment.service';
import gradebookService from '../../services/gradebook.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const StudentGradesPage = () => {
  const { courseId: paramCourseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(paramCourseId || '');
  const [gradeData, setGradeData] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Load enrolled courses
  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoadingCourses(true);
      try {
        const enrollments = await enrollmentService.getMyEnrollments();
        const approved = enrollments.filter((e) => e.status === 'approved');
        setCourses(approved.map((e) => e.course));

        if (!selectedCourseId && approved.length > 0) {
          setSelectedCourseId(approved[0].course?._id || approved[0].course);
        }
      } catch (err) {
        toast.error('Failed to load enrolled courses.');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchEnrollments();
  }, []);

  // Fetch student gradebook row
  const fetchGrades = async () => {
    if (!selectedCourseId) return;
    setLoadingGrades(true);
    try {
      const res = await gradebookService.getMyGrades(selectedCourseId);
      setGradeData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load course grades.');
      setGradeData(null);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchGrades();
    }
  }, [selectedCourseId]);

  const course = gradeData?.course || {};
  const gradebook = gradeData?.gradebook || {};
  const weights = course?.gradeWeights || { attendance: 20, quizzes: 40, assignments: 40 };

  const attendance = gradebook.attendance || {};
  const quizzes = gradebook.quizzes || { items: [] };
  const assignments = gradebook.assignments || { items: [] };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Gradebook & Transcripts"
        subtitle="Itemized breakdown of your homework submissions, auto-graded quizzes, and live lecture turnout."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGrades}
            disabled={loadingGrades}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        }
      />

      {/* Cohort Selector */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Select Bootcamp Cohort
            </label>
            {loadingCourses ? (
              <Skeleton className="h-10 w-full" />
            ) : courses.length === 0 ? (
              <p className="text-xs text-ink-muted">No approved enrollments.</p>
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

          <div className="flex items-center gap-4 bg-surface p-3 rounded-md border border-line text-xs">
            <span className="font-semibold text-ink-muted uppercase tracking-wider text-[11px]">
              Weights:
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span>Attendance: <strong>{weights.attendance}%</strong></span>
              <span>•</span>
              <span>Quizzes: <strong>{weights.quizzes}%</strong></span>
              <span>•</span>
              <span>Assignments: <strong>{weights.assignments}%</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score Summary Hero */}
      {loadingGrades ? (
        <Skeleton className="h-32 w-full" />
      ) : !gradeData ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Award}
              title="No Grades Available"
              description="Grades will appear here once lecture sessions are completed and assignments are evaluated."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-primary/5 border-primary/30">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Overall Final Grade
              </span>
              <p className="font-mono text-3xl font-bold text-primary mt-1">
                {gradebook.finalOverallPercent}%
              </p>
              <Badge variant="primary" className="mt-2 text-[10px]">
                {gradebook.performanceBadge}
              </Badge>
            </Card>

            <Card className="p-4 bg-paper">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Attendance ({weights.attendance}%)
              </span>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {attendance.percent}%
              </p>
              <p className="text-[11px] text-ink-muted font-mono mt-1">
                {attendance.weightedScore} / {weights.attendance} pts
              </p>
            </Card>

            <Card className="p-4 bg-paper">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Quizzes ({weights.quizzes}%)
              </span>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {quizzes.avgPercent}%
              </p>
              <p className="text-[11px] text-ink-muted font-mono mt-1">
                {quizzes.weightedScore} / {weights.quizzes} pts
              </p>
            </Card>

            <Card className="p-4 bg-paper">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Homework ({weights.assignments}%)
              </span>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {assignments.avgPercent}%
              </p>
              <p className="text-[11px] text-ink-muted font-mono mt-1">
                {assignments.weightedScore} / {weights.assignments} pts
              </p>
            </Card>
          </div>

          {/* Quizzes Evaluation Table */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-warning" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Quizzes & Knowledge Checks ({quizzes.items?.length || 0})
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-ink">
                Average: {quizzes.avgPercent}%
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-line">
                  <thead className="bg-surface/50 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Quiz Title</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Percentage</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono">
                    {quizzes.items?.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-ink-muted font-sans">No quizzes published yet.</td></tr>
                    ) : (
                      quizzes.items?.map((q) => (
                        <tr key={q.quizId} className="hover:bg-surface/30">
                          <td className="py-3 px-4 font-sans font-semibold text-ink">{q.title}</td>
                          <td className="py-3 px-4 text-center">{q.attempted ? `${q.score} / ${q.totalMarks}` : '—'}</td>
                          <td className="py-3 px-4 text-center font-bold text-ink">{q.attempted ? `${q.percent}%` : '—'}</td>
                          <td className="py-3 px-4 text-center font-sans">
                            <Badge variant={q.attempted ? (q.percent >= 60 ? 'success' : 'danger') : 'muted'} className="text-[10px]">
                              {q.attempted ? (q.percent >= 60 ? 'PASSED' : 'FAILED') : 'NOT ATTEMPTED'}
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

          {/* Assignments Evaluation Table */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Homework Tasks & Code Solutions ({assignments.items?.length || 0})
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-ink">
                Average: {assignments.avgPercent}%
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-line">
                  <thead className="bg-surface/50 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Assignment</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Percentage</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-mono">
                    {assignments.items?.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-ink-muted font-sans">No assignments published yet.</td></tr>
                    ) : (
                      assignments.items?.map((a) => (
                        <tr key={a.assignmentId} className="hover:bg-surface/30">
                          <td className="py-3 px-4 font-sans font-semibold text-ink">{a.title}</td>
                          <td className="py-3 px-4 text-center">{a.marks !== null ? `${a.marks} / ${a.maxMarks}` : '—'}</td>
                          <td className="py-3 px-4 text-center font-bold text-ink">{a.marks !== null ? `${a.percent}%` : '—'}</td>
                          <td className="py-3 px-4 text-center font-sans">
                            <Badge variant={a.status === 'graded' ? 'success' : a.status === 'late' ? 'warning' : 'muted'} className="text-[10px]">
                              {a.status.toUpperCase()}
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
      )}
    </div>
  );
};

export default StudentGradesPage;
