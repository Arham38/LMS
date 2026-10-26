import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import PublicLayout from '../components/layout/PublicLayout';
import StudentLayout from '../components/layout/StudentLayout';
import AdminLayout from '../components/layout/AdminLayout';

import HomePage from '../pages/public/HomePage';
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
      {
        path: 'courses',
        element: (
          <PhasePlaceholder
            title="Course Catalog & Cohorts"
            subtitle="Browse live bootcamps, syllabi, fee schedules, and upcoming dates."
            phaseNumber="1"
            phaseName="Public Catalog & Course Pages"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Courses' }]}
          />
        ),
      },
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
        path: 'login',
        element: (
          <PhasePlaceholder
            title="Student & Instructor Sign In"
            subtitle="Secure authentication and account management."
            phaseNumber="1"
            phaseName="Authentication & Authorization"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Sign In' }]}
          />
        ),
      },
      {
        path: 'register',
        element: (
          <PhasePlaceholder
            title="Student Registration & Application"
            subtitle="Apply for upcoming cohort and reserve your seat."
            phaseNumber="1"
            phaseName="Student Registration"
            breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Register' }]}
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

  // Student Portal Route Group
  {
    path: '/student',
    element: <StudentLayout />,
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
        element: (
          <PhasePlaceholder
            title="My Enrolled Courses"
            subtitle="Syllabus progress, batch details, and class timings."
            phaseNumber="2"
            phaseName="Enrolled Courses"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Courses' }]}
          />
        ),
      },
      {
        path: 'schedule',
        element: (
          <PhasePlaceholder
            title="Live Class Schedule & Join Link"
            subtitle="Google Meet/Zoom access link (active 15m prior to start)."
            phaseNumber="2"
            phaseName="Live Sessions & Attendance"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Schedule' }]}
          />
        ),
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
        element: (
          <PhasePlaceholder
            title="Payment History & Proofs"
            subtitle="Upload JazzCash/Easypaisa/Bank receipt screenshots and check approval status."
            phaseNumber="2"
            phaseName="Payment Verification"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Payments' }]}
          />
        ),
      },
      {
        path: 'profile',
        element: (
          <PhasePlaceholder
            title="Account Settings"
            subtitle="Update contact number and change password."
            phaseNumber="1"
            phaseName="User Profile"
            breadcrumbs={[{ label: 'Portal', to: '/student/dashboard' }, { label: 'Profile' }]}
          />
        ),
      },
    ],
  },

  // Admin Portal Route Group
  {
    path: '/admin',
    element: <AdminLayout />,
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
        path: 'courses',
        element: (
          <PhasePlaceholder
            title="Course & Batch Management"
            subtitle="Create and configure bootcamps, batches, seats, and fees."
            phaseNumber="2"
            phaseName="Course Management"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Courses' }]}
          />
        ),
      },
      {
        path: 'sessions',
        element: (
          <PhasePlaceholder
            title="Live Sessions & Join Links"
            subtitle="Schedule Google Meet/Zoom classes and configure meeting URLs."
            phaseNumber="2"
            phaseName="Live Sessions & Class Control"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Live Sessions' }]}
          />
        ),
      },
      {
        path: 'tasks',
        element: (
          <PhasePlaceholder
            title="Quizzes & Homework Assignments"
            subtitle="Create assessments, configure deadlines, and review student work."
            phaseNumber="3"
            phaseName="Quizzes & Grading Engine"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Quizzes & Tasks' }]}
          />
        ),
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
        element: (
          <PhasePlaceholder
            title="Enrollment Requests"
            subtitle="Review pending student admissions and verify payment receipts."
            phaseNumber="2"
            phaseName="Enrollment Approvals"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Enrollments' }]}
          />
        ),
      },
      {
        path: 'attendance',
        element: (
          <PhasePlaceholder
            title="Live Attendance Records"
            subtitle="Track student join/leave logs for each live session."
            phaseNumber="2"
            phaseName="Attendance Tracking"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Attendance' }]}
          />
        ),
      },
      {
        path: 'payments',
        element: (
          <PhasePlaceholder
            title="Payment Proofs Verification"
            subtitle="Inspect JazzCash/Easypaisa/IBFT receipt screenshots and approve seats."
            phaseNumber="2"
            phaseName="Manual Payment Approval"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Payment Proofs' }]}
          />
        ),
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
        element: (
          <PhasePlaceholder
            title="System & Account Settings"
            subtitle="Update instructor profile, bank details, and notification preferences."
            phaseNumber="4"
            phaseName="System Settings"
            breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings' }]}
          />
        ),
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
