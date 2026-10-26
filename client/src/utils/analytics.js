/**
 * Privacy-Preserving Analytics Wrapper
 * 
 * DESIGN PRINCIPLE:
 * The CodeCraft website is 100% cookie-free by default. We do NOT drop
 * marketing cookies, session trackers, or third-party ad pixels.
 * 
 * If the academy owner connects a privacy-friendly self-hosted or cookieless
 * service (e.g. Plausible, Umami, Cloudflare Web Analytics), calls can be
 * enabled through this module without touching page components.
 */

export const analytics = {
  /**
   * Log a page view event
   * @param {string} path - Current pathname
   */
  pageView(path = window.location.pathname) {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('pageview', { u: path });
    }
  },

  /**
   * Log a custom conversion goal (e.g. 'enroll_click', 'whatsapp_click', 'contact_submit')
   * @param {string} eventName
   * @param {Object} props
   */
  trackEvent(eventName, props = {}) {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(eventName, { props });
    }
  },
};

export default analytics;
