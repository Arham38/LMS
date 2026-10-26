import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteContent } from '../../content/site';
import { useDocumentMeta } from '../../utils/seo';
import Button from '../../components/ui/Button';

export const RefundPolicyPage = () => {
  useDocumentMeta({
    title: 'Tuition Refund Policy — CodeCraft Bootcamp',
    description: siteContent.refundPolicy.summary,
    canonicalPath: '/refunds',
  });

  return (
    <div className="py-12 md:py-20 max-w-3xl mx-auto px-4 sm:px-6">
      <div className="mb-10 border-b border-line pb-6">
        <span className="text-xs font-mono text-ink-muted block mb-1">
          Last Updated: {siteContent.refundPolicy.lastUpdated}
        </span>
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink leading-tight">
          {siteContent.refundPolicy.headline}
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-2">
          {siteContent.refundPolicy.summary}
        </p>
      </div>

      {/* Week 1 Guarantee Highlight Callout */}
      <div className="p-6 bg-primary-soft/40 border border-primary/20 rounded-lg mb-10 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-sm text-ink mb-1">
            Zero-Risk Trial: 100% Full Week 1 Money-Back Guarantee
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Every enrolled student can attend all live sessions throughout the first week. If you decide the course does not meet your expectations, simply request a refund before Sunday 11:59 PM PKT of Week 1 for an immediate 100% reimbursement.
          </p>
        </div>
      </div>

      <div className="space-y-10 text-xs sm:text-sm text-ink-muted leading-relaxed">
        {siteContent.refundPolicy.sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="font-semibold text-base text-ink">{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 pt-8 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-sm text-ink">Ready to begin your cohort?</h4>
          <p className="text-xs text-ink-muted">Seats are strictly capped at 25 students.</p>
        </div>
        <Link to="/courses">
          <Button variant="primary" size="sm" rightIcon={ArrowRight}>
            View Available Cohorts
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
