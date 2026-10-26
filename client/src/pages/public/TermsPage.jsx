import React from 'react';
import { siteContent } from '../../content/site';
import { useDocumentMeta } from '../../utils/seo';

export const TermsPage = () => {
  useDocumentMeta({
    title: 'Terms of Service — CodeCraft Bootcamp',
    description: siteContent.terms.summary,
    canonicalPath: '/terms',
  });

  return (
    <div className="py-12 md:py-20 max-w-3xl mx-auto px-4 sm:px-6">
      <div className="mb-10 border-b border-line pb-6">
        <span className="text-xs font-mono text-ink-muted block mb-1">
          Last Updated: {siteContent.terms.lastUpdated}
        </span>
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink leading-tight">
          {siteContent.terms.headline}
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-2">
          {siteContent.terms.summary}
        </p>
      </div>

      <div className="space-y-10 text-xs sm:text-sm text-ink-muted leading-relaxed">
        {siteContent.terms.sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="font-semibold text-base text-ink">{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsPage;
