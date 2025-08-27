// utils.js

/**
 * Formats a Date object into a 'YYYY-MM-DD' string.
 * @param {Date} date The date to format.
 * @returns {string} The formatted date string. 
 */
export function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Gets the start of the week (Monday) for a given date.
 * @param {Date} date The date to find the start of the week for.
 * @returns {Date} A new Date object representing the start of the week.
 */
export function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setUTCDate(diff));
}

/**
 * Returns a Tailwind CSS border color class based on the department.
 * @param {string} department The name of the department.
 * @returns {string} A Tailwind CSS class.
 */
export function getDeptColor(department) {
    const colors = {
        // Core Colors
        "Internal Medicine": "border-blue-500",
        "Community Medicine": "border-green-500",
        "Ophthalmology": "border-purple-500",
        "Obs & Gynae": "border-pink-500",
        "ENT": "border-yellow-500",
        "Forensic Medicine": "border-red-500",
        "Orthopaedics": "border-orange-500",
        
        // Additional Department Colors
        "Surgery": "border-slate-500",
        "Dermatology": "border-amber-500",
        "Pediatrics": "border-cyan-500",
        "Respiratory Medicine": "border-teal-500",
        "Radiodiagnosis": "border-indigo-500",
        "Psychiatry": "border-rose-500",
        "Anaesthesiology": "border-lime-500"
    };
    return colors[department] || "border-gray-500"; // Defaults to gray if not found
}

/**
 * Determines the clinical batch from a roll number.
 * @param {number} rollNo The student's roll number.
 * @returns {string|null} The batch letter ('A', 'B', 'C', 'D') or null.
 */
export function getClinicBatch(rollNo) {
    if (rollNo >= 1 && rollNo <= 38) return 'A';
    if (rollNo >= 39 && rollNo <= 76) return 'B';
    if (rollNo >= 77 && rollNo <= 114) return 'C';
    if (rollNo >= 115 && rollNo <= 150) return 'D';
    return null;
}

/**
 * Determines the general batch from a roll number.
 * @param {number} rollNo The student's roll number.
 * @returns {string|null} The batch letter ('A', 'B', 'C') or null.
 */
export function getGeneralBatch(rollNo) {
    if (rollNo >= 1 && rollNo <= 50) return 'A';
    if (rollNo >= 51 && rollNo <= 100) return 'B';
    if (rollNo >= 101 && rollNo <= 150) return 'C';
    return null;
}

/**
 * Displays a custom alert modal with a message.
 * @param {string} message The message to display.
 */
export function customAlert(message) {
    document.getElementById('alert-message').textContent = message;
    document.getElementById('alert-modal').classList.remove('hidden');
}

/**
 * Generates an ICS calendar file string from an array of events.
 * @param {Array<object>} events Array of schedule event objects.
 * @returns {string} A string in iCalendar format.
 */
export function generateICS(events) {
    let icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AFMCScheduleApp//EN'
    ];
    const toICSDate = (date, time) => `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
    
    events.forEach(event => {
        icsString.push('BEGIN:VEVENT');
        icsString.push(`UID:${event.date}-${event.startTime}@afmc.schedule`);
        icsString.push(`DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}Z`);
        icsString.push(`DTSTART;TZID=Asia/Kolkata:${toICSDate(event.date, event.startTime)}`);
        icsString.push(`DTEND;TZID=Asia/Kolkata:${toICSDate(event.date, event.endTime)}`);
        icsString.push(`SUMMARY:${event.topic} (${event.department})`);
        icsString.push(`LOCATION:${event.location}`);
        icsString.push(`DESCRIPTION:Instructor: ${event.instructor}`);
        icsString.push('END:VEVENT');
    });
    icsString.push('END:VCALENDAR');
    return icsString.join('\r\n');
}

/**
 * Triggers a browser download for a blob of data.
 * @param {string} icsData The ICS data string.
 * @param {string} filename The desired filename for the download.
 */
export function downloadICS(icsData, filename = 'MySchedule.ics') {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
