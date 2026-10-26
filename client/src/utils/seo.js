import { useEffect } from 'react';

/**
 * Custom hook to update document meta tags, Open Graph, Twitter cards, and JSON-LD schema
 * for optimal SEO and rich WhatsApp link previews.
 * 
 * @param {Object} options
 * @param {string} options.title - Page title
 * @param {string} options.description - Meta description
 * @param {string} [options.canonicalPath] - Relative canonical path (e.g. '/courses')
 * @param {string} [options.ogImage] - Social share image URL
 * @param {string} [options.ogType] - Open Graph type (default: 'website')
 * @param {Object} [options.jsonLd] - Structured JSON-LD data object
 */
export function useDocumentMeta({
  title,
  description,
  canonicalPath = '',
  ogImage = '/og-image.png',
  ogType = 'website',
  jsonLd = null,
} = {}) {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title
      ? `${title} — CodeCraft Bootcamp`
      : 'CodeCraft Bootcamp — Build Production-Grade Web Apps in 12 Weeks';
    document.title = formattedTitle;

    // Helper to set or create meta tag
    const setMetaTag = (selector, attributeName, attributeValue, content) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attributeName, attributeValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content || '');
    };

    // 2. Standard Meta Description
    if (description) {
      setMetaTag('meta[name="description"]', 'name', 'description', description);
    }

    // 3. Open Graph / WhatsApp Preview Tags
    const fullUrl = window.location.origin + (canonicalPath || window.location.pathname);
    const fullImageUrl = ogImage.startsWith('http')
      ? ogImage
      : window.location.origin + ogImage;

    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description || '');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', fullUrl);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'CodeCraft Bootcamp');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', fullImageUrl);
    setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
    setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
    setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', formattedTitle);

    // 4. Twitter Cards
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description || '');
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', fullImageUrl);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // 6. JSON-LD Structured Data
    let jsonLdScript = document.getElementById('page-json-ld');
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'page-json-ld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      // Clean up script on unmount if needed
      const existingScript = document.getElementById('page-json-ld');
      if (existingScript) existingScript.remove();
    };
  }, [title, description, canonicalPath, ogImage, ogType, jsonLd]);
}

/**
 * Generates Schema.org Course JSON-LD for rich course snippets
 */
export function generateCourseSchema({ title, description, fee, startDate }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'CodeCraft Bootcamp',
      sameAs: 'https://codecraft.pk',
    },
    offers: {
      '@type': 'Offer',
      price: fee ? String(fee).replace(/[^0-9]/g, '') : '45000',
      priceCurrency: 'PKR',
      category: 'Paid',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      startDate: startDate || '2026-11-15',
    },
  };
}

export default useDocumentMeta;
