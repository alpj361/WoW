/**
 * Process recurring event dates to set the closest future date as main date
 * and remaining future dates as recurring_dates.
 *
 * For recurring events: IGNORE the main date field (often wrong from AI) and use only recurring_dates.
 * For non-recurring events: use the main date.
 *
 * @param mainDateStr - The main date from analysis (format: YYYY-MM-DD or DD-MM-YYYY)
 * @param recurringDatesStr - Array of recurring dates (format: YYYY-MM-DD)
 * @param isRecurringEvent - Whether the event is marked as recurring
 * @returns { mainDate: Date | null, recurringDates: Date[], isRecurring: boolean }
 */
export const processRecurringDates = (
    mainDateStr: string | null | undefined,
    recurringDatesStr: string[] | null | undefined,
    isRecurringEvent: boolean = false
): { mainDate: Date | null; recurringDates: Date[]; isRecurring: boolean } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to parse a date string (handles YYYY-MM-DD and DD-MM-YYYY)
    const parseDate = (dateStr: string): Date | null => {
        const parts = dateStr.split(/[-/]/).map(Number);
        if (parts.length === 3) {
            let year: number, month: number, day: number;
            if (parts[0] > 1000) {
                // YYYY-MM-DD
                [year, month, day] = parts;
            } else {
                // DD-MM-YYYY
                [day, month, year] = parts;
            }
            const date = new Date(year, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
        } else if (parts.length === 2) {
            // DD-MM format, add current year
            const currentYear = new Date().getFullYear();
            const [day, month] = parts;
            const date = new Date(currentYear, month - 1, day);
            return isNaN(date.getTime()) ? null : date;
        }
        return null;
    };

    // For recurring events with recurring_dates: ONLY use recurring_dates (ignore mainDateStr)
    // The AI often puts wrong dates in the main date field for recurring events
    if (isRecurringEvent && recurringDatesStr && recurringDatesStr.length > 0) {
        const recurringParsed: Date[] = [];
        for (const dateStr of recurringDatesStr) {
            const date = parseDate(dateStr);
            if (date) recurringParsed.push(date);
        }

        if (recurringParsed.length > 0) {
            // Sort all dates
            recurringParsed.sort((a, b) => a.getTime() - b.getTime());

            // Filter future dates
            const futureDates = recurringParsed.filter(d => d >= today);

            if (futureDates.length > 0) {
                // First future date is main, rest are recurring
                return {
                    mainDate: futureDates[0],
                    recurringDates: futureDates.slice(1),
                    isRecurring: futureDates.length > 1
                };
            } else {
                // All dates in past - use the last (most recent) one
                return {
                    mainDate: recurringParsed[recurringParsed.length - 1],
                    recurringDates: recurringParsed.slice(0, -1),
                    isRecurring: recurringParsed.length > 1
                };
            }
        }
    }

    // Non-recurring event or no recurring_dates: just use main date
    if (mainDateStr && mainDateStr !== 'No especificado') {
        const mainDate = parseDate(mainDateStr);
        if (mainDate) {
            return { mainDate, recurringDates: [], isRecurring: false };
        }
    }

    return { mainDate: null, recurringDates: [], isRecurring: false };
};
