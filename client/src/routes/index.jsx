import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import PublicLayout from '../components/layout/PublicLayout';
import StudentLayout from '../components/layout/StudentLayout';
import AdminLayout from '../components/layout/AdminLayout';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleRoute from '../components/auth/RoleRoute';
import GuestRoute from '../components/auth/GuestRoute';
import RouteSuspense from '../components/common/RouteSuspense';

// Lazy Loaded Public Pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const CoursesPage = lazy(() => import('../pages/public/CoursesPage'));
const CourseDetailPage = lazy(() => import('../pages/public/CourseDetailPage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const FAQPage = lazy(() => import('../pages/public/FAQPage'));
const TermsPage = lazy(() => import('../pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('../pages/public/PrivacyPage'));
const RefundPolicyPage = lazy(() => import('../pages/public/RefundPolicyPage'));

// Lazy Loaded Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Lazy Loaded Student Pages
const EnrollmentWizardPage = lazy(() => import('../pages/student/EnrollmentWizardPage'));
const MyEnrollmentsPage = lazy(() => import('../pages/student/MyEnrollmentsPage'));
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage'));
const StudentCourseSpacePage = lazy(() => import('../pages/student/StudentCourseSpacePage'));
const StudentScheduleRouter = lazy(() => import('../pages/student/StudentScheduleRouter'));
const StudentQuizPage = lazy(() => import('../pages/student/StudentQuizPage'));
const StudentGradesPage = lazy(() => import('../pages/student/StudentGradesPage'));
const StudentNotesPage = lazy(() => import('../pages/student/StudentNotesPage'));

// Lazy Loaded Admin Pages
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminTodayPage = lazy(() => import('../pages/admin/AdminTodayPage'));
const AdminCoursesPage = lazy(() => import('../pages/admin/AdminCoursesPage'));
const AdminCourseEditorPage = lazy(() => import('../pages/admin/AdminCourseEditorPage'));
const AdminSessionsPage = lazy(() => import('../pages/admin/AdminSessionsPage'));
const AdminQuizzesPage = lazy(() => import('../pages/admin/AdminQuizzesPage'));
const AdminQuizBuilderPage = lazy(() => import('../pages/admin/AdminQuizBuilderPage'));
const AdminAssignmentsPage = lazy(() => import('../pages/admin/AdminAssignmentsPage'));
const AdminGradingSplitPage = lazy(() => import('../pages/admin/AdminGradingSplitPage'));
const AdminStudentsPage = lazy(() => import('../pages/admin/AdminStudentsPage'));
const AdminStudentDetailPage = lazy(() => import('../pages/admin/AdminStudentDetailPage'));
const AdminAnnouncementsPage = lazy(() => import('../pages/admin/AdminAnnouncementsPage'));
const AdminGradebookPage = lazy(() => import('../pages/admin/AdminGradebookPage'));
const AdminEnrollmentsPage = lazy(() => import('../pages/admin/AdminEnrollmentsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AdminMessagesPage = lazy(() => import('../pages/admin/AdminMessagesPage'));
const AdminMaterialsPage = lazy(() => import('../pages/admin/AdminMaterialsPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
const AdminLedgerPage = lazy(() => import('../pages/admin/AdminLedgerPage'));

// Lazy Loaded Common Pages
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const StyleguidePage = lazy(() => import('../pages/dev/StyleguidePage'));
const PhasePlaceholder = lazy(() => import('../pages/PhasePlaceholder'));

export const router = createBrowserRouter([
  // Public Route Group
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: (
          <RouteSuspense>
            <HomePage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses',
        element: (
          <RouteSuspense>
            <CoursesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:slug',
        element: (
          <RouteSuspense>
            <CourseDetailPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'about',
        element: (
          <RouteSuspense>
            <AboutPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'contact',
        element: (
          <RouteSuspense>
            <ContactPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'faq',
        element: (
          <RouteSuspense>
            <FAQPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'terms',
        element: (
          <RouteSuspense>
            <TermsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'privacy',
        element: (
          <RouteSuspense>
            <PrivacyPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'refunds',
        element: (
          <RouteSuspense>
            <RefundPolicyPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'admissions',
        element: <Navigate to="/courses" replace />,
      },
      {
        path: 'pricing',
        element: <Navigate to="/#tuition" replace />,
      },
    ],
  },

  // 3-Step Enrollment Wizard (Protected for Students)
  {
    path: '/enroll/:courseId',
    element: (
      <ProtectedRoute>
        <RouteSuspense>
          <EnrollmentWizardPage />
        </RouteSuspense>
      </ProtectedRoute>
    ),
  },

  // Focused Student Quiz Taking Experience (Protected)
  {
    path: '/student/quizzes/:quizId/take',
    element: (
      <ProtectedRoute>
        <RouteSuspense>
          <StudentQuizPage />
        </RouteSuspense>
      </ProtectedRoute>
    ),
  },

  // Guest-only Auth Routes (Redirect to dashboard if already authenticated)
  {
    path: '/login',
    element: (
      <GuestRoute>
        <RouteSuspense>
          <LoginPage />
        </RouteSuspense>
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RouteSuspense>
          <RegisterPage />
        </RouteSuspense>
      </GuestRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestRoute>
        <RouteSuspense>
          <ForgotPasswordPage />
        </RouteSuspense>
      </GuestRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <GuestRoute>
        <RouteSuspense>
          <ResetPasswordPage />
        </RouteSuspense>
      </GuestRoute>
    ),
  },

  // Student Workspace (Protected, Student role)
  {
    path: '/student',
    element: (
      <ProtectedRoute>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <RouteSuspense>
            <StudentDashboardPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses',
        element: (
          <RouteSuspense>
            <StudentDashboardPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id',
        element: (
          <RouteSuspense>
            <StudentCourseSpacePage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/learn',
        element: (
          <RouteSuspense>
            <StudentCourseSpacePage />
          </RouteSuspense>
        ),
      },
      {
        path: 'schedule',
        element: (
          <RouteSuspense>
            <StudentScheduleRouter />
          </RouteSuspense>
        ),
      },
      {
        path: 'assignments',
        element: (
          <RouteSuspense>
            <StudentCourseSpacePage />
          </RouteSuspense>
        ),
      },
      {
        path: 'quizzes',
        element: (
          <RouteSuspense>
            <StudentCourseSpacePage />
          </RouteSuspense>
        ),
      },
      {
        path: 'payments',
        element: (
          <RouteSuspense>
            <MyEnrollmentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'grades',
        element: (
          <RouteSuspense>
            <StudentGradesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'announcements',
        element: (
          <RouteSuspense>
            <NotificationsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RouteSuspense>
            <NotificationsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'notes',
        element: (
          <RouteSuspense>
            <StudentNotesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'materials',
        element: (
          <RouteSuspense>
            <StudentNotesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <RouteSuspense>
            <ProfilePage />
          </RouteSuspense>
        ),
      },
    ],
  },

  // Admin Workspace (Protected, Admin role)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['admin']}>
          <AdminLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <RouteSuspense>
            <AdminDashboardPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RouteSuspense>
            <AdminAnalyticsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'today',
        element: (
          <RouteSuspense>
            <AdminTodayPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses',
        element: (
          <RouteSuspense>
            <AdminCoursesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/new',
        element: (
          <RouteSuspense>
            <AdminCourseEditorPage isNew />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/edit',
        element: (
          <RouteSuspense>
            <AdminCourseEditorPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/sessions',
        element: (
          <RouteSuspense>
            <AdminSessionsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'sessions',
        element: (
          <RouteSuspense>
            <AdminSessionsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/quizzes',
        element: (
          <RouteSuspense>
            <AdminQuizzesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/quizzes/new',
        element: (
          <RouteSuspense>
            <AdminQuizBuilderPage isNew />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:courseId/quizzes/:quizId/edit',
        element: (
          <RouteSuspense>
            <AdminQuizBuilderPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'tasks',
        element: (
          <RouteSuspense>
            <AdminQuizzesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'assignments',
        element: (
          <RouteSuspense>
            <AdminAssignmentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/assignments',
        element: (
          <RouteSuspense>
            <AdminAssignmentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'assignments/:id/grading',
        element: (
          <RouteSuspense>
            <AdminGradingSplitPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'students',
        element: (
          <RouteSuspense>
            <AdminStudentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'students/:id',
        element: (
          <RouteSuspense>
            <AdminStudentDetailPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'messages',
        element: (
          <RouteSuspense>
            <AdminMessagesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'announcements',
        element: (
          <RouteSuspense>
            <AdminAnnouncementsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/announcements',
        element: (
          <RouteSuspense>
            <AdminAnnouncementsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'gradebook',
        element: (
          <RouteSuspense>
            <AdminGradebookPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'courses/:id/gradebook',
        element: (
          <RouteSuspense>
            <AdminGradebookPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RouteSuspense>
            <NotificationsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'enrollments',
        element: (
          <RouteSuspense>
            <AdminEnrollmentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'attendance',
        element: (
          <RouteSuspense>
            <AdminSessionsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'payments',
        element: (
          <RouteSuspense>
            <AdminEnrollmentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'materials',
        element: (
          <RouteSuspense>
            <AdminMaterialsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'notes',
        element: (
          <RouteSuspense>
            <AdminMaterialsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'ledger',
        element: (
          <RouteSuspense>
            <AdminLedgerPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'revenue',
        element: (
          <RouteSuspense>
            <AdminLedgerPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <RouteSuspense>
            <AdminSettingsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <RouteSuspense>
            <ProfilePage />
          </RouteSuspense>
        ),
      },
    ],
  },

  // Dev Styleguide
  {
    path: '/dev/styleguide',
    element: (
      <RouteSuspense>
        <StyleguidePage />
      </RouteSuspense>
    ),
  },

  // Catch-all 404
  {
    path: '*',
    element: (
      <RouteSuspense>
        <NotFoundPage />
      </RouteSuspense>
    ),
  },
]);

export default router;
