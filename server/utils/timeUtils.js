/**
 * Showtime Expiry & Time Synchronization Utility
 * Parses show date & time strings and validates whether a showtime is in the past.
 */

const parseShowDateTime = (dateInput, timeStr) => {
  if (!dateInput || !timeStr) return null;

  try {
    let datePart = '';
    if (typeof dateInput === 'string') {
      datePart = dateInput.split('T')[0];
    } else if (dateInput instanceof Date && !isNaN(dateInput)) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      datePart = `${y}-${m}-${d}`;
    } else {
      return null;
    }

    const trimmedTime = String(timeStr).trim();
    // Match formats like "10:00 AM", "01:30 PM", "8:30 PM", "13:30", "13:30:00"
    const match = trimmedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[4] ? match[4].toUpperCase() : null;

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  } catch (err) {
    return null;
  }
};

/**
 * Checks whether a showtime has expired (already started or in past)
 * @param {string|Date} dateInput - Show date (e.g. "2026-10-28")
 * @param {string} timeStr - Show time (e.g. "10:00 AM")
 * @param {number} graceBufferMinutes - Optional cutoff buffer in minutes (default: 0)
 * @returns {{ expired: boolean, showDateTime: Date|null, message: string }}
 */
const isShowExpired = (dateInput, timeStr, graceBufferMinutes = 0) => {
  const showDateTime = parseShowDateTime(dateInput, timeStr);
  if (!showDateTime || isNaN(showDateTime.getTime())) {
    // If time cannot be parsed, allow it to prevent blocking valid custom formats
    return { expired: false, showDateTime: null, message: '' };
  }

  const now = new Date();
  const cutoffTime = new Date(now.getTime() - graceBufferMinutes * 60 * 1000);

  if (showDateTime.getTime() <= cutoffTime.getTime()) {
    const diffMinutes = Math.round((now.getTime() - showDateTime.getTime()) / (60 * 1000));
    return {
      expired: true,
      showDateTime,
      message: diffMinutes > 0
        ? `This show started ${diffMinutes} minute(s) ago. Online booking is closed.`
        : 'This show has already started or ended. Online booking is closed.',
    };
  }

  return { expired: false, showDateTime, message: '' };
};

module.exports = {
  parseShowDateTime,
  isShowExpired,
};
