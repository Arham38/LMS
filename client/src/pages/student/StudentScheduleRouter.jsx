import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, BookOpen } from 'lucide-react';
import enrollmentService from '../../services/enrollment.service';
import { EmptyState, Skeleton } from '../../components/ui';

export const StudentScheduleRouter = () => {
  const [loading, setLoading] = useState(true);
  const [approvedCourseId, setApprovedCourseId] = useState(null);

  useEffect(() => {
    const checkEnrollments = async () => {
      try {
        const enrollments = await enrollmentService.getMyEnrollments();
        const approved = enrollments.find((e) => e.status === 'approved');
        if (approved) {
          const cId = approved.course?._id || approved.course;
          setApprovedCourseId(cId);
        }
      } catch (err) {
        console.error('Error fetching enrollments for schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    checkEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="py-12 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (approvedCourseId) {
    return <Navigate to={`/student/courses/${approvedCourseId}`} replace />;
  }

  return (
    <EmptyState
      icon={Calendar}
      title="No Active Live Schedule"
      description="You do not have an approved tuition enrollment yet. Enroll in a bootcamp to unlock live classes and lecture notes."
      actionText="Browse Bootcamp Courses"
      onAction={() => window.location.assign('/courses')}
    />
  );
};

export default StudentScheduleRouter;
