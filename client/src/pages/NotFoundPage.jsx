import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import { Wordmark } from '../config/brand';

export const NotFoundPage = () => {
  useEffect(() => {
    document.title = '404 Page Not Found — CodeCraft Academy';
  }, []);

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between p-6">
      <header className="max-w-6xl w-full mx-auto">
        <Link to="/">
          <Wordmark />
        </Link>
      </header>

      <main className="max-w-lg mx-auto text-center py-16">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent bg-accent-soft px-2.5 py-1 rounded">
          Error 404
        </span>

        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink mt-4 mb-3 tracking-tight">
          Page not found
        </h1>

        <p className="text-sm text-ink-muted leading-relaxed mb-8">
          The requested URL does not exist or may have been relocated. Please verify the web address or return to the main dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={ArrowLeft}>
              Return to Homepage
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="secondary" size="md">
              View Bootcamps
            </Button>
          </Link>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-ink-muted border-t border-line pt-4">
        <span>CodeCraft Academy • Lahore, Pakistan • Asia/Karachi (PKT)</span>
      </footer>
    </div>
  );
};

export default NotFoundPage;
