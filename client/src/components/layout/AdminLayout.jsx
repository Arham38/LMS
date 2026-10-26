import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Video,
  FileCheck2,
  FileText,
  Users,
  UserCheck,
  ClipboardList,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  User,
} from 'lucide-react';
import { Wordmark } from '../../config/brand';
import { useAuth } from '../../context/AuthContext';
import enrollmentService from '../../services/enrollment.service';
import Avatar from '../ui/Avatar';
import DropdownMenu from '../ui/DropdownMenu';
import Badge from '../ui/Badge';

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingEnrollmentCount, setPendingEnrollmentCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await enrollmentService.getPendingCount();
        setPendingEnrollmentCount(res?.count || 0);
      } catch {
        // ignore background badge poll errors
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [location.pathname]);

  const navigationGroups = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
      ],
    },
    {
      group: 'Teaching',
      items: [
        { label: 'Courses & Batches', to: '/admin/courses', icon: BookOpen },
        { label: 'Live Sessions', to: '/admin/sessions', icon: Video },
        { label: 'Quizzes & Tasks', to: '/admin/tasks', icon: FileCheck2 },
        { label: 'Notes & Materials', to: '/admin/materials', icon: FileText },
      ],
    },
    {
      group: 'People',
      items: [
        { label: 'All Students', to: '/admin/students', icon: Users },
        {
          label: 'Enrollment Requests',
          to: '/admin/enrollments',
          icon: UserCheck,
          badge: pendingEnrollmentCount > 0 ? String(pendingEnrollmentCount) : null,
        },
        { label: 'Live Attendance', to: '/admin/attendance', icon: ClipboardList },
      ],
    },
    {
      group: 'Money',
      items: [
        { label: 'Payment Proofs', to: '/admin/payments', icon: CreditCard },
        { label: 'Ledger & Revenue', to: '/admin/ledger', icon: Receipt },
        { label: 'System Settings', to: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenuItems = [
    {
      id: 'profile',
      label: 'Admin Profile',
      icon: User,
      onClick: () => navigate('/admin/profile'),
    },
    {
      id: 'settings',
      label: 'Admin Settings',
      icon: Settings,
      onClick: () => navigate('/admin/settings'),
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

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-surface">
      {/* Brand & Admin Indicator */}
      <div className="h-16 px-5 border-b border-line flex items-center justify-between">
        <NavLink to="/admin/dashboard" className="flex items-center">
          <Wordmark textSize="text-base" markSize="w-2 h-2" />
        </NavLink>
        <Badge variant="primary" dot>
          Admin
        </Badge>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <h5 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              {group.group}
            </h5>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary-soft text-primary font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 stroke-[1.5]" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-accent-soft text-accent">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3 border-t border-line bg-surface-alt/30">
        <div className="flex items-center justify-between p-2 rounded hover:bg-surface-alt transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name || 'Admin'} size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-ink truncate">{user?.name || 'Administrator'}</span>
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
    </div>
  );

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      {/* Desktop Sidebar (248px) */}
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 border-r border-line fixed inset-y-0 left-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-ink/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-[248px] h-full shadow-popover z-10">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col lg:pl-[248px] min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-line px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-ink hover:bg-surface-alt rounded"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Admin Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-ink-muted font-mono hidden sm:inline">
              Asia/Karachi (PKT)
            </span>
            <DropdownMenu
              align="right"
              trigger={
                <button type="button" className="flex items-center gap-2 rounded-full focus:outline-none p-1 hover:bg-surface-alt transition-colors">
                  <Avatar name={user?.name || 'Admin'} size="sm" />
                  <span className="text-xs font-medium text-ink hidden sm:inline max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <Badge variant="primary" className="hidden md:inline-flex">Admin</Badge>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[1.5]" />
                </button>
              }
              items={adminMenuItems}
            />
          </div>
        </header>

        {/* Content Page (Dense admin layout, 24px gutters) */}
        <main className="flex-1 p-6 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
