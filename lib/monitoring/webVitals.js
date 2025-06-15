// lib/monitoring/webVitals.js
// Monitor Core Web Vitals for performance

export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
}

// Log performance metrics in development
if (process.env.NODE_ENV === 'development') {
  reportWebVitals((metric) => {
    console.log(`[Web Vital] ${metric.name}:`, Math.round(metric.value), 'ms');
  });
}
