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
 */
export function getDeptColor(department) {
    const colors = {
        "Internal Medicine": "border-blue-500",
        "Community Medicine": "border-green-500",
        "Ophthalmology": "border-purple-500",
        "Obs & Gynae": "border-pink-500",
        "ENT": "border-yellow-500",
        "Forensic Medicine": "border-red-500",
        "Orthopaedics": "border-orange-500",
        "Surgery": "border-slate-500",
        "Dermatology": "border-amber-500",
        "Pediatrics": "border-cyan-500",
        "Respiratory Medicine": "border-teal-500",
        "Radiodiagnosis": "border-indigo-500",
        "Psychiatry": "border-rose-500",
        "Anaesthesiology": "border-lime-500"
    };
    return colors[department] || "border-gray-500";
}

/**
 * Determines the batch from a roll number for Term VII (A, B, C).
 * Batch-A (1-50), Batch-B (51-100), Batch-C (101-148).
 */
export function getClinicBatch(rollNo) {
    if (rollNo >= 1 && rollNo <= 50) return 'A';    
    if (rollNo >= 51 && rollNo <= 100) return 'B';   
    if (rollNo >= 101 && rollNo <= 150) return 'C';  
    return null;
}

export function getGeneralBatch(rollNo) {
    return getClinicBatch(rollNo);
}

/**
 * Displays a custom alert modal with a message.
 */
export function customAlert(message) {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        document.getElementById('alert-message').textContent = message;
        alertModal.classList.remove('hidden');
    } else {
        alert(message);
    }
}

/**
 * Generates an ICS calendar file string from an array of events.
 */
export function generateICS(events) {
    const toICSDate = (date, time) => `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
    const now = new Date();
    const timestamp = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}T${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}${now.getUTCSeconds().toString().padStart(2, '0')}Z`;

    let icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//YourAppName//AFMC Schedule//EN'
    ];
    
    events.forEach(event => {
        const uid = `${event.date}-${event.startTime}-${event.topic.replace(/[^a-zA-Z0-9]/g, "")}@afmc.schedule`;
        icsString.push('BEGIN:VEVENT');
        icsString.push(`UID:${uid}`);
        icsString.push(`DTSTAMP:${timestamp}`);
        icsString.push(`DTSTART;TZID=Asia/Kolkata:${toICSDate(event.date, event.startTime)}`);
        icsString.push(`DTEND;TZID=Asia/Kolkata:${toICSDate(event.date, event.endTime)}`);
        icsString.push(`SUMMARY:${event.topic} (${event.department})`);
        icsString.push(`LOCATION:${event.location}`);
        icsString.push(`DESCRIPTION:Instructor: ${event.instructor}`);
        icsString.push('BEGIN:VALARM');
        icsString.push('TRIGGER:-PT10M');
        icsString.push('ACTION:DISPLAY');
        icsString.push(`DESCRIPTION:${event.topic}`);
        icsString.push('END:VALARM');
        icsString.push('END:VEVENT');
    });

    icsString.push('END:VCALENDAR');
    return icsString.join('\r\n');
}

export function downloadICS(icsData, filename = 'MySchedule.ics') {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
