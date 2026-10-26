import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import PublicLayout from '../components/layout/PublicLayout';
import StudentLayout from '../components/layout/StudentLayout';
import AdminLayout from '../components/layout/AdminLayout';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleRoute from '../components/auth/RoleRoute';
import GuestRoute from '../components/auth/GuestRoute';

import HomePage from '../pages/public/HomePage';
import CoursesPage from '../pages/public/CoursesPage';
import CourseDetailPage from '../pages/public/CourseDetailPage';
import EnrollmentWizardPage from '../pages/student/EnrollmentWizardPage';
import MyEnrollmentsPage from '../pages/student/MyEnrollmentsPage';

import AdminCoursesPage from '../pages/admin/AdminCoursesPage';
import AdminCourseEditorPage from '../pages/admin/AdminCourseEditorPage';
import AdminEnrollmentsPage from '../pages/admin/AdminEnrollmentsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminSessionsPage from '../pages/admin/AdminSessionsPage';
import AdminTodayPage from '../pages/admin/AdminTodayPage';
import AdminQuizzesPage from '../pages/admin/AdminQuizzesPage';
import AdminQuizBuilderPage from '../pages/admin/AdminQuizBuilderPage';
import StudentCourseSpacePage from '../pages/student/StudentCourseSpacePage';
import StudentScheduleRouter from '../pages/student/StudentScheduleRouter';
import StudentQuizPage from '../pages/student/StudentQuizPage';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProfilePage from '../pages/profile/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import StyleguidePage from '../pages/dev/StyleguidePage';
import PhasePlaceholder from '../pages/PhasePlaceholder';

export const router = createBrowserRouter([
  // Public Route Group
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:slug', element: <CourseDetailPage /> },
      {
        path: 'about',
        element: (
          <PhasePlaceholder
            title="About CodeCraft Academy"
            subtitle="Meet the instructor and learn our engineering-first teaching philosophy."
            phaseNumber="1"
            phaseName="About & Admissions"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'About' }]}
          />
        ),
      },
      {
        path: 'admissions',
        element: (
          <PhasePlaceholder
            title="Admissions & Payment Instructions"
            subtitle="Step-by-step guidance for JazzCash, Easypaisa, and IBFT bank transfers."
            phaseNumber="1"
            phaseName="Admissions & Information"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Admissions' }]}
          />
        ),
      },
      {
        path: 'contact',
        element: (
          <PhasePlaceholder
            title="Contact Support"
            subtitle="Reach out via WhatsApp or email for enrollment queries."
            phaseNumber="1"
            phaseName="Contact & Support"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
          />
        ),
      },
      {
        path: 'terms',
        element: (
          <PhasePlaceholder
            title="Terms of Enrollment"
            subtitle="Bootcamp policies, refund schedules, and classroom code of conduct."
            phaseNumber="1"
            phaseName="Policies & Terms"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Terms' }]}
          />
        ),
      },
      {
        path: 'privacy',
        element: (
          <PhasePlaceholder
            title="Privacy Policy"
            subtitle="How student data and payment proofs are handled securely."
            phaseNumber="1"
            phaseName="Privacy Policy"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Privacy' }]}
          />
        ),
      },
    ],
  },

  // 3-Step Enrollment Wizard (Protected for Students)
  {
    path: '/enroll/:courseId',
    element: (
      <ProtectedRoute>
        <EnrollmentWizardPage />
      </ProtectedRoute>
    ),
  },

  // Focused Student Quiz Taking Experience (Protected)
  {
    path: '/student/quizzes/:quizId/take',
    element: (
      <ProtectedRoute>
        <StudentQuizPage />
      </ProtectedRoute>
    ),
  },

  // Guest-only Auth Routes (Redirect to dashboard if already authenticated)
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <GuestRoute>
        <ResetPasswordPage />
      </GuestRoute>
    ),
  },

  // Student Portal Route Group (Protected)
  {
    path: '/student',
    element: (
      <ProtectedRoute>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/student/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <PhasePlaceholder
            title="Student Overview"
            subtitle="Upcoming live lectures, attendance stats, and latest announcements."
            phaseNumber="2"
            phaseName="Student Dashboard"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Overview' }]}
          />
        ),
      },
      {
        path: 'courses',
        element: <MyEnrollmentsPage />,
      },
      {
        path: 'courses/:courseId',
        element: <StudentCourseSpacePage />,
      },
      {
        path: 'schedule',
        element: <StudentScheduleRouter />,
      },
      {
        path: 'assignments',
        element: (
          <PhasePlaceholder
            title="Assignments & Code Submissions"
            subtitle="Submit homework files (PDF/ZIP up to 50MB) and view instructor grades."
            phaseNumber="3"
            phaseName="Assignments & Grading"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Assignments' }]}
          />
        ),
      },
      {
        path: 'quizzes',
        element: (
          <PhasePlaceholder
            title="Knowledge Checks & Quizzes"
            subtitle="Multiple choice and timed coding questions."
            phaseNumber="3"
            phaseName="Quizzes Engine"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Quizzes' }]}
          />
        ),
      },
      {
        path: 'notes',
        element: (
          <PhasePlaceholder
            title="Lecture Notes & Materials"
            subtitle="PDF notes, code snippets, and session cheatsheets."
            phaseNumber="2.5"
            phaseName="R2 Storage & Notes"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Notes' }]}
          />
        ),
      },
      {
        path: 'payments',
        element: <MyEnrollmentsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },

  // Admin Portal Route Group (Protected & Role Guarded to 'admin' only)
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
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <PhasePlaceholder
            title="Admin Command Center"
            subtitle="Real-time cohort stats, revenue indicators, and quick moderation actions."
            phaseNumber="4"
            phaseName="Admin Overview & Reporting"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Overview' }]}
          />
        ),
      },
      {
        path: 'analytics',
        element: (
          <PhasePlaceholder
            title="Cohort Analytics & Attendance Insights"
            subtitle="Completion rates, drop-off tracking, and submission turnaround."
            phaseNumber="4"
            phaseName="Analytics & Insights"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Analytics' }]}
          />
        ),
      },
      {
        path: 'today',
        element: <AdminTodayPage />,
      },
      {
        path: 'courses',
        element: <AdminCoursesPage />,
      },
      {
        path: 'courses/new',
        element: <AdminCourseEditorPage />,
      },
      {
        path: 'courses/:id/edit',
        element: <AdminCourseEditorPage />,
      },
      {
        path: 'courses/:id/sessions',
        element: <AdminSessionsPage />,
      },
      {
        path: 'sessions',
        element: <AdminSessionsPage />,
      },
      {
        path: 'tasks',
        element: <AdminQuizzesPage />,
      },
      {
        path: 'quizzes',
        element: <AdminQuizzesPage />,
      },
      {
        path: 'quizzes/:id/builder',
        element: <AdminQuizBuilderPage />,
      },
      {
        path: 'materials',
        element: (
          <PhasePlaceholder
            title="Lecture Notes & Resource Uploads"
            subtitle="Upload PDFs (max 20MB) to private Cloudflare R2 bucket."
            phaseNumber="2.5"
            phaseName="Storage & Resource Distribution"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Notes & Files' }]}
          />
        ),
      },
      {
        path: 'students',
        element: (
          <PhasePlaceholder
            title="Student Roster"
            subtitle="View all registered and enrolled students, activity logs, and status."
            phaseNumber="2"
            phaseName="Student Management"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Students' }]}
          />
        ),
      },
      {
        path: 'enrollments',
        element: <AdminEnrollmentsPage />,
      },
      {
        path: 'attendance',
        element: <AdminSessionsPage />,
      },
      {
        path: 'payments',
        element: <AdminEnrollmentsPage />,
      },
      {
        path: 'ledger',
        element: (
          <PhasePlaceholder
            title="Financial Ledger & Revenue"
            subtitle="Detailed accounting of all cohort collections in PKR."
            phaseNumber="4"
            phaseName="Revenue Ledger & Export"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Financial Ledger' }]}
          />
        ),
      },
      {
        path: 'settings',
        element: <AdminSettingsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },

  // Dev Styleguide
  {
    path: '/dev/styleguide',
    element: <StyleguidePage />,
  },

  // Catch-all 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
