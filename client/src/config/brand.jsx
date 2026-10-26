import React from 'react';

export const BRAND_NAME = 'CodeCraft Academy';
export const TAGLINE = 'Intensive live bootcamps in full-stack engineering, Python, and machine learning.';
export const SUPPORT_EMAIL = 'admissions@codecraft.academy';
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '+92 300 1234567';

export const Wordmark = ({ className = '', markSize = 'w-2.5 h-2.5', textSize = 'text-lg' }) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span
        aria-hidden="true"
        className={`${markSize} bg-primary rounded-sm shrink-0 inline-block`}
      />
      <span className={`font-display font-semibold tracking-tight text-ink ${textSize}`}>
        {BRAND_NAME}
      </span>
    </div>
  );
};

export default {
  BRAND_NAME,
  TAGLINE,
  SUPPORT_EMAIL,
  WHATSAPP_NUMBER,
  Wordmark,
};
