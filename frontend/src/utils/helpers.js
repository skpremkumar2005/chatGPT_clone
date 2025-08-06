/**
 * Formats an ISO 8601 timestamp into a more readable format.
 * Example: '2024-08-07T10:00:00Z' -> '8/7/2024, 10:00 AM'
 * @param {string} timestamp - The ISO string from the database.
 * @returns {string} - A formatted date and time string.
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error("Failed to format timestamp:", error);
    return timestamp; // Return original if formatting fails
  }
};

/**
 * Truncates a string to a specified length and adds an ellipsis.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - The maximum length before truncating.
 * @returns {string} - The truncated text.
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

/**
 * A simple utility to check if an object is empty.
 * @param {object} obj - The object to check.
 * @returns {boolean} - True if the object has no own properties.
 */
export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};