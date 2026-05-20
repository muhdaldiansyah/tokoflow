// lib/monitoring/analytics/gtag.js
// Helper functions for Google Analytics events

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-NR1C3VBCGS';

// Log the pageview with their URL
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Log specific events happening
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track form submissions
export const trackFormSubmit = (formName) => {
  event({
    action: 'submit',
    category: 'Form',
    label: formName,
  });
};

// Track button clicks
export const trackButtonClick = (buttonName) => {
  event({
    action: 'click',
    category: 'Button',
    label: buttonName,
  });
};

// Track page scroll depth
export const trackScrollDepth = (percentage) => {
  event({
    action: 'scroll',
    category: 'Engagement',
    label: `${percentage}%`,
    value: percentage,
  });
};

// Track external link clicks
export const trackOutboundLink = (url) => {
  event({
    action: 'click',
    category: 'Outbound Link',
    label: url,
  });
};
