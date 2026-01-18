/**
 * utils.js
 * Optimized utility functions for AFMC VII Term Schedule
 */

/**
 * Formats a Date object into a 'YYYY-MM-DD' string using local date parts.
 * @param {Date} date 
 * @returns {string}
 */
export const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

/**
 * Returns a 'YYYY-MM-DD' string for the current local date.
 */
export const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Gets the start of the week (Monday) for a given date in UTC.
 * @param {Date} date 
 * @returns {Date}
 */
export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setUTCDate(diff));
};

/**
 * Returns Tailwind CSS border and background classes for dark mode based on department.
 */
export const getDeptStyles = (dept) => {
    const styles = { 
        "Internal Medicine": "border-blue-500 bg-blue-900/30 text-blue-200", 
        "Obs & Gynae": "border-rose-500 bg-rose-900/30 text-rose-200", 
        "Surgery": "border-slate-500 bg-slate-800/50 text-slate-200", 
        "Pediatrics": "border-cyan-500 bg-cyan-900/30 text-cyan-200", 
        "ENT": "border-amber-500 bg-amber-900/30 text-amber-200", 
        "Ophthalmology": "border-purple-500 bg-purple-900/30 text-purple-200", 
        "Orthopaedics": "border-orange-500 bg-orange-900/30 text-orange-200", 
        "Dermatology": "border-yellow-500 bg-yellow-900/30 text-yellow-200", 
        "Psychiatry": "border-red-500 bg-red-900/30 text-red-200", 
        "Radiodiagnosis": "border-indigo-500 bg-indigo-900/30 text-indigo-200", 
        "Anaesthesia": "border-lime-500 bg-lime-900/30 text-lime-200", 
        "Emergency Medicine": "border-red-700 bg-red-900/40 text-red-100", 
        "Electives": "border-violet-700 bg-violet-900/40 text-violet-100", 
        "AETCOM": "border-stone-500 bg-stone-800/40 text-stone-200" 
    };
    return styles[dept] || "border-slate-600 bg-slate-800 text-slate-300";
};

/**
 * Unit A: 1-38, Unit B: 39-76, Unit C: 77-114, Unit D: 115-148.
 */
export const getClinicBatch = (r) => {
    if (r >= 1 && r <= 38) return 'A'; 
    if (r >= 39 && r <= 76) return 'B'; 
    if (r >= 77 && r <= 114) return 'C'; 
    if (r >= 115 && r <= 148) return 'D';
    return null;
};

/**
 * Batch A: 1-50, Batch B: 51-100, Batch C: 101-148.
 */
export const getGeneralBatch = (r) => {
    if (r >= 1 && r <= 50) return 'A'; 
    if (r >= 51 && r <= 100) return 'B'; 
    if (r >= 101 && r <= 148) return 'C';
    return null;
};

/**
 * Generates and downloads an ICS file for the personalized schedule.
 */
export function downloadCalendar(events, rollNo) {
    const toICSDate = (date, time) => `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
    
    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AFMC//Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    events.forEach(e => {
        ics.push('BEGIN:VEVENT');
        ics.push(`SUMMARY:${e.topic}`);
        ics.push(`DTSTART;TZID=Asia/Kolkata:${toICSDate(e.date, e.startTime)}`);
        ics.push(`DTEND;TZID=Asia/Kolkata:${toICSDate(e.date, e.endTime)}`);
        ics.push(`LOCATION:${e.location}`);
        ics.push(`DESCRIPTION:DEPT: ${e.department}`);
        ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');

    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AFMC_Schedule_Roll_${rollNo}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
