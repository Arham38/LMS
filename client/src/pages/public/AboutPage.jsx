import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { siteContent } from '../../content/site';
import { useDocumentMeta } from '../../utils/seo';
import Button from '../../components/ui/Button';

export const AboutPage = () => {
  useDocumentMeta({
    title: 'About CodeCraft — Engineering Standards & Pedagogy',
    description: siteContent.about.headline,
    canonicalPath: '/about',
  });

  return (
    <div className="py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-12 border-b border-line pb-8">
        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider block mb-2">
          About CodeCraft
        </span>
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink leading-tight tracking-tight">
          {siteContent.about.headline}
        </h1>
      </div>

      {/* Main Philosophy Narrative */}
      <div className="space-y-6 text-sm sm:text-base text-ink-muted leading-relaxed max-w-prose mb-16">
        {siteContent.about.paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>

      {/* Core Principles */}
      <div className="border-t border-line pt-12 mb-16">
        <h2 className="font-serif font-semibold text-2xl text-ink mb-8">
          Our Guiding Principles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {siteContent.about.principles.map((item, idx) => (
            <div key={idx} className="p-6 bg-surface border border-line rounded-lg">
              <span className="font-mono text-xs font-semibold text-primary block mb-2">
                0{idx + 1}
              </span>
              <h3 className="font-semibold text-base text-ink mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Location Note */}
      <div className="bg-surface-alt border border-line rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h4 className="font-semibold text-sm text-ink mb-1">
            Headquartered in Lahore, Pakistan
          </h4>
          <p className="text-xs text-ink-muted">
            All classes, mentoring sessions, and code reviews are conducted 100% online in Pakistan Standard Time (PKT).
          </p>
        </div>
        <Link to="/contact">
          <Button variant="secondary" size="sm" rightIcon={ArrowRight}>
            Get in touch
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
