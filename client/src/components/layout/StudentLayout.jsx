import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileCheck2,
  HelpCircle,
  FileText,
  CreditCard,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import { Wordmark } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import DropdownMenu from '../ui/DropdownMenu';
import Badge from '../ui/Badge';

export const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState('MERN Full-Stack Bootcamp (Batch 04)');

  const courses = [
    'MERN Full-Stack Bootcamp (Batch 04)',
    'Python for Software Engineers (Batch 02)',
    'Applied AI & Deep Learning (Batch 01)',
  ];

  const navItems = [
    { label: 'Overview', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Live Schedule', to: '/student/schedule', icon: Calendar },
    { label: 'Assignments', to: '/student/assignments', icon: FileCheck2 },
    { label: 'Quizzes', to: '/student/quizzes', icon: HelpCircle },
    { label: 'Notes & Files', to: '/student/notes', icon: FileText },
    { label: 'Fee & Payments', to: '/student/payments', icon: CreditCard },
  ];

  // Mobile bottom tab items (key navigation only)
  const mobileTabItems = [
    { label: 'Overview', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Courses', to: '/student/courses', icon: BookOpen },
    { label: 'Schedule', to: '/student/schedule', icon: Calendar },
    { label: 'Tasks', to: '/student/assignments', icon: FileCheck2 },
    { label: 'Profile', to: '/student/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      id: 'profile',
      label: 'My Account',
      icon: User,
      onClick: () => navigate('/student/profile'),
    },
    { divider: true },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOut,
      variant: 'danger',
      onClick: handleLogout,
    },
  ];

  const courseSwitcherItems = courses.map((c) => ({
    id: c,
    label: c,
    onClick: () => setSelectedCourse(c),
  }));

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      {/* Desktop Sidebar (232px) */}
      <aside className="hidden md:flex flex-col w-[232px] shrink-0 bg-surface border-r border-line fixed inset-y-0 left-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-line flex items-center">
          <NavLink to="/student/dashboard" className="flex items-center">
            <Wordmark textSize="text-base" markSize="w-2 h-2" />
          </NavLink>
        </div>

        {/* Enrollment Status indicator */}
        <div className="px-5 py-3 border-b border-line bg-surface-alt/40 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted">
            Student Portal
          </span>
          <Badge variant="success" dot>
            Active
          </Badge>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-line bg-surface-alt/20">
          <div className="flex items-center justify-between p-2 rounded hover:bg-surface-alt transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user?.name || 'Student'} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-ink truncate">{user?.name || 'Student'}</span>
                <span className="text-[11px] text-ink-muted truncate font-mono">{user?.email}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="text-ink-muted hover:text-danger p-1 rounded transition-colors"
            >
              <LogOut className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[232px] pb-16 md:pb-0 min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-line px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Course Switcher */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-medium text-ink-muted">Course:</span>
            <DropdownMenu
              align="left"
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium bg-surface-alt border border-line rounded hover:bg-line transition-colors text-ink max-w-[280px] sm:max-w-none truncate"
                >
                  <span className="truncate">{selectedCourse}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0 stroke-[1.5]" />
                </button>
              }
              items={courseSwitcherItems}
            />
          </div>

          {/* Right: Notification & Profile */}
          <div className="flex items-center gap-3">
            <DropdownMenu
              align="right"
              trigger={
                <button type="button" className="flex items-center gap-2 rounded-full focus:outline-none p-1 hover:bg-surface-alt transition-colors">
                  <Avatar name={user?.name || 'Student'} size="sm" />
                  <span className="text-xs font-medium text-ink hidden sm:inline max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <Badge variant="success" className="hidden md:inline-flex">Student</Badge>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[1.5]" />
                </button>
              }
              items={userMenuItems}
            />
          </div>
        </header>

        {/* Content Page (Max width 1080px, 24px gutters) */}
        <main className="flex-1 p-6 max-w-container w-full mx-auto">
          <Outlet context={{ selectedCourse }} />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-line h-14 flex items-center justify-around z-40 px-2"
      >
        {mobileTabItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.5]" />
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default StudentLayout;
