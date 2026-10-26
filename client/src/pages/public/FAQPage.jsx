import React, { useState } from 'react';
import { Search, ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { siteContent } from '../../content/site';
import { useDocumentMeta } from '../../utils/seo';
import Input from '../../components/ui/Input';

export const FAQPage = () => {
  useDocumentMeta({
    title: 'Frequently Asked Questions — CodeCraft Bootcamp',
    description: 'Everything you need to know about class timings, prerequisites, laptop requirements, and our 100% refund guarantee.',
    canonicalPath: '/faq',
  });

  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(0);

  const filteredFaqs = siteContent.faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  const whatsappLink = `https://wa.me/${siteContent.brand.whatsappDigits}?text=${encodeURIComponent(
    'Hi! I checked your FAQ and have a question about the bootcamp.'
  )}`;

  return (
    <div className="py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="max-w-2xl mb-10">
        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider block mb-2">
          Help & Answers
        </span>
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-ink leading-tight tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-ink-muted mt-3 leading-relaxed">
          Comprehensive, honest answers to the most common questions prospective students ask before enrolling.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search questions (e.g. laptop, refund, timings, certificate)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={Search}
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="border-t border-line divide-y divide-line bg-surface rounded-lg border px-6">
        {filteredFaqs.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            No questions matched your search query. Try typing another keyword or message us directly on WhatsApp.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full flex items-center justify-between text-left group focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-sm sm:text-base text-ink group-hover:text-primary transition-colors pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-ink-muted transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pt-3 pr-6 text-xs sm:text-sm text-ink-muted leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Help Banner */}
      <div className="mt-12 p-6 bg-surface-alt border border-line rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-semibold text-sm text-ink">Have a specific question not listed here?</h4>
          <p className="text-xs text-ink-muted mt-0.5">
            Our admissions team is available daily on WhatsApp for quick, direct answers.
          </p>
        </div>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-surface text-xs font-medium hover:bg-primary-hover transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
};

export default FAQPage;
