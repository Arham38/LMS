import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark, BRAND_NAME } from '../../config/brand';
import Badge from '../ui/Badge';

export const AuthSplitLayout = ({
  title,
  subtitle,
  children,
  badgeText = 'Student & Faculty Portal',
  quoteText = 'Engineering bootcamps taught live by senior practitioners. Real code reviews, no shortcuts.',
  quoteAuthor = 'CodeCraft Academy Teaching Philosophy',
}) => {
  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      {/* Left Editorial Panel (Desktop only or top header on mobile) */}
      <div className="w-full md:w-5/12 lg:w-4/12 bg-surface-alt border-b md:border-b-0 md:border-r border-line p-8 md:p-12 flex flex-col justify-between shrink-0">
        <div>
          <Link to="/" className="inline-block mb-10">
            <Wordmark textSize="text-xl" />
          </Link>

          <div className="space-y-4">
            <Badge variant="primary" dot>
              {badgeText}
            </Badge>

            <h2 className="font-display font-semibold text-2xl lg:text-3xl text-ink tracking-tight leading-snug">
              Rigorous live software engineering education.
            </h2>

            <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
              All classes are conducted live on Google Meet or Zoom. We enforce active code participation, weekly assignments, and direct instructor feedback.
            </p>
          </div>
        </div>

        {/* Short Editorial Quote Placeholder */}
        <div className="mt-12 pt-8 border-t border-line hidden md:block">
          <blockquote className="text-xs font-serif italic text-ink leading-relaxed">
            "{quoteText}"
          </blockquote>
          <span className="block text-[11px] font-mono text-ink-muted mt-2">
            — {quoteAuthor}
          </span>

          <div className="mt-6 flex items-center gap-4 text-[11px] text-ink-muted">
            <span>Pakistan Standard Time (PKT)</span>
            <span>•</span>
            <span>Domestic Payments</span>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-form">
          <div className="mb-8">
            <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthSplitLayout;
