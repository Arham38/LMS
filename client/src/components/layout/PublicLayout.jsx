import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowUpRight, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Wordmark, BRAND_NAME, TAGLINE, SUPPORT_EMAIL, WHATSAPP_NUMBER } from '../../config/brand';
import { siteContent } from '../../content/site';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import DropdownMenu from '../ui/DropdownMenu';
import Badge from '../ui/Badge';

export const PublicLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Courses', to: '/courses' },
    { label: 'Syllabus', to: '/#syllabus' },
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'FAQ', to: '/faq' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      id: 'dashboard',
      label: user?.role === 'admin' ? 'Admin Workspace' : 'Student Portal',
      icon: LayoutDashboard,
      onClick: () => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'),
    },
    {
      id: 'profile',
      label: 'My Account',
      icon: User,
      onClick: () => navigate(user?.role === 'admin' ? '/admin/profile' : '/student/profile'),
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

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-primary-soft selection:text-primary">
      {/* Top Banner / Announcement Strip */}
      <div className="bg-surface-alt border-b border-line px-4 py-2 text-xs text-center text-ink-muted">
        <span>Admissions open for Upcoming Cohort • Live online classes via Google Meet & Zoom • </span>
        <Link to="/courses" className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover">
          View Schedule & Fees
        </Link>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <Wordmark />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `transition-colors duration-150 ${
                    isActive ? 'text-primary font-semibold' : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
                  <Button variant="secondary" size="sm">
                    {user?.role === 'admin' ? 'Admin Dashboard' : 'My Portal'}
                  </Button>
                </Link>
                <DropdownMenu
                  align="right"
                  trigger={
                    <button type="button" className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-alt transition-colors">
                      <Avatar name={user?.name} size="sm" />
                      <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[1.5]" />
                    </button>
                  }
                  items={userMenuItems}
                />
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-ink-muted hover:text-ink transition-colors px-2 py-1"
                >
                  {siteContent.nav.loginText}
                </Link>
                <Link to="/courses">
                  <Button variant="primary" size="sm">
                    {siteContent.nav.ctaText}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              aria-label="Toggle Navigation Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-ink hover:bg-surface-alt rounded"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-line bg-surface px-4 pt-3 pb-6 flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2 border-b border-line/50 text-ink"
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2.5 p-2 bg-surface-alt rounded">
                    <Avatar name={user?.name} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-ink truncate">{user?.name}</span>
                      <span className="text-[11px] text-ink-muted truncate font-mono">{user?.email}</span>
                    </div>
                  </div>
                  <Link
                    to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-medium text-surface bg-primary rounded"
                  >
                    Open Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center py-2 text-sm font-medium text-danger border border-danger/30 rounded"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-medium text-ink border border-line rounded"
                  >
                    {siteContent.nav.loginText}
                  </Link>
                  <Link
                    to="/courses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-medium text-surface bg-primary rounded"
                  >
                    {siteContent.nav.ctaText}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface pt-16 pb-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <Wordmark className="mb-3" />
              <p className="text-xs text-ink-muted leading-relaxed max-w-sm mb-4">
                {siteContent.brand.tagline}
              </p>
              <div className="text-xs text-ink-muted space-y-1">
                <p>Support: <a href={`mailto:${siteContent.brand.supportEmail}`} className="underline text-ink">{siteContent.brand.supportEmail}</a></p>
                <p>WhatsApp: <a href={`https://wa.me/${siteContent.brand.whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="tabular-nums font-mono text-ink underline">{siteContent.brand.whatsappDisplay}</a></p>
                <p>Timezone: <span className="text-ink">{siteContent.brand.timezone}</span></p>
              </div>
            </div>

            {siteContent.footer.groups.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink mb-3 font-mono">
                  {group.title}
                </h4>
                <ul className="space-y-2 text-xs text-ink-muted">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('http') || link.href.startsWith('mailto:') ? (
                        <a
                          href={link.href}
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="hover:text-ink transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link to={link.href} className="hover:text-ink transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-ink-muted gap-4">
            <p>{siteContent.footer.copyright}</p>
            <div className="flex items-center space-x-6">
              <Link to="/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
              <Link to="/refunds" className="hover:text-ink transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
