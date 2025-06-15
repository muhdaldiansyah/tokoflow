// lib/utils/dates.js

/**
 * Formats a date string into a localized date string
 * @param {string | null | undefined} dateString - The date string to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return "Jadwal Fleksibel";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Tgl Invalid";
    
    const defaultOptions = {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    };
    
    return date.toLocaleDateString('id-ID', { ...defaultOptions, ...options });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "Tgl Invalid";
  }
}
