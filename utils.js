// utils.js

// --- CONSTANTS MOVED FROM INDEX.HTML ---
export const termStartDate = new Date('2025-06-30T00:00:00Z');
export const termEndDate = new Date('2025-11-28T00:00:00Z');

export const scheduleRules = {
    "1": { // Monday
        "08:00-09:00": { topic: "Medicine Theory", department: "Internal Medicine", weeks: { from: 1, to: 22 } },
        "09:00-10:00": { topic: "Comm Medicine Theory", department: "Community Medicine", weeks: { from: 1, to: 22 } },
        "14:00-15:00": { topic: "Tutorial Medicine", department: "Internal Medicine", weeks: { from: 1, to: 19 } },
        "15:00-16:00": { topic: "Tutorial FM&T", department: "Forensic Medicine", weeks: { from: 1, to: 19 } },
    },
    "2": { // Tuesday
        "08:00-09:00": { topic: "Surgery", department: "Surgery", weeks: { from: 1, to: 22 } },
        "09:00-10:00": { topic: "PANDEMICS MODULE", department: "Community Medicine", weeks: { from: 1, to: 22 } },
        "14:00-15:00": [
            { topic: "Tutorial Surgery", department: "Surgery", weeks: { from: 1, to: 13 } },
            { topic: "Tutorial Dermatology", department: "Dermatology", weeks: { from: 14, to: 19 } },
        ],
        "15:00-16:00": [
            { topic: "SDL FM&T", department: "Forensic Medicine", weeks: { from: 1, to: 2 } },
            { topic: "SDL Dermatology", department: "Dermatology", weeks: { from: 3, to: 4 } },
            { topic: "SDL Orthopaedics", department: "Orthopaedics", weeks: { from: 5, to: 6 } },
            { topic: "SDL Paediatrics", department: "Pediatrics", weeks: { from: 7, to: 8 } },
            { topic: "SDL Resp Med", department: "Respiratory Medicine", weeks: { from: 11, to: 12 } },
        ]
    },
    "3": { // Wednesday
        "08:00-09:00": [
            { topic: "Pediatrics", department: "Pediatrics", weeks: { from: 1, to: 13 } },
            { topic: "Radiodiagnosis", department: "Radiodiagnosis", weeks: { from: 14, to: 22 } },
        ],
        "09:00-10:00": [
            { topic: "ENT Theory", department: "ENT", weeks: { from: 1, to: 10 } },
            { topic: "Tutorial ENT", department: "ENT", weeks: { from: 11, to: 22 } },
        ],
        "14:00-15:00": [
            { topic: "SDL Comm Med", department: "Community Medicine", weeks: [1, 5, 10] },
            { topic: "SDL ENT", department: "ENT", weeks: [2, 3, 6, 8] },
            { topic: "SDL Orthopaedics", department: "Orthopaedics", weeks: [7, 9, 11] },
            { topic: "SDL Psychiatry", department: "Psychiatry", weeks: [4, 10] },
            { topic: "SDL Radio diagnosis", department: "Radiodiagnosis", weeks: [12, 13] },
        ]
    },
    "4": { // Thursday
        "08:00-09:00": { topic: "Obst & Gynae", department: "Obs & Gynae", weeks: { from: 1, to: 22 } },
        "09:00-10:00": [
            { topic: "Dermat", department: "Dermatology", weeks: { from: 1, to: 8 } },
            { topic: "Anaes", department: "Anaesthesiology", weeks: { from: 9, to: 19 } },
        ],
        "14:00-15:00": { topic: "Tutorial Obst & Gynae", department: "Obs & Gynae", weeks: { from: 1, to: 19 } },
        "15:00-16:00": { topic: "Tutorial Community Medicine", department: "Community Medicine", weeks: { from: 1, to: 19 } },
    },
    "5": { // Friday
        "08:00-09:00": { topic: "FM&T", department: "Forensic Medicine", weeks: { from: 1, to: 22 } },
        "09:00-10:00": [
            { topic: "FM&T", department: "Forensic Medicine", weeks: { from: 1, to: 5 } },
            { topic: "Community Medicine", department: "Community Medicine", weeks: { from: 6, to: 10 } },
            { topic: "Ophthalmology", department: "Ophthalmology", weeks: { from: 11, to: 15 } },
            { topic: "ENT", department: "ENT", weeks: { from: 16, to: 20 } },
        ],
        "14:00-15:00": [
            { topic: "Tutorial Paediatrics", department: "Pediatrics", weeks: { from: 1, to: 14 } },
            { topic: "Tutorial Anaesthesiology", department: "Anaesthesiology", weeks: { from: 15, to: 19 } },
        ],
        "15:00-16:00": [
            { topic: "Tutorial Psy", department: "Psychiatry", weeks: { from: 1, to: 10 } },
            { topic: "Tutorial Anaesthesiology", department: "Anaesthesiology", weeks: { from: 11, to: 14 } },
            { topic: "Tutorial Resp Med", department: "Respiratory Medicine", weeks: { from: 15, to: 17 } },
        ]
    },
    "6": { // Saturday
        "08:00-09:00": { topic: "Orthopaedics", department: "Orthopaedics", weeks: { from: 1, to: 19 } },
        "09:00-10:00": { topic: "Ophthalmology", department: "Ophthalmology", weeks: { from: 1, to: 19 } },
        "14:00-15:00": { topic: "Tutorial Community Medicine", department: "Community Medicine", weeks: { from: 1, to: 19 } }
    }
};


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
 * Generates a more compatible ICS calendar file string from an array of events.
 * @param {Array<object>} events Array of schedule event objects.
 * @returns {string} A string in iCalendar format.
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

// --- FUNCTIONS MOVED FROM INDEX.HTML ---

/**
 * Generates a baseline schedule from the predefined term rules.
 * @returns {Array<object>} An array of generic schedule events.
 */
export function generateGenericSchedule() {
    const genericSchedule = [];
    const getTermWeek = (currentDate) => {
        const diff = currentDate.getTime() - termStartDate.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
    };

    let currentDate = new Date(termStartDate);
    while (currentDate <= termEndDate) {
        const dayOfWeek = currentDate.getUTCDay();
        if (dayOfWeek === 0) { // Skip Sundays
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            continue;
        }
        const termWeek = getTermWeek(currentDate);
        const dayRules = scheduleRules[dayOfWeek];
        if (dayRules) {
            for (const timeSlot in dayRules) {
                let events = dayRules[timeSlot];
                if (!Array.isArray(events)) events = [events];
                events.forEach(rule => {
                    const { topic, department, weeks } = rule;
                    let isInWeek = false;
                    if (Array.isArray(weeks)) {
                        if (weeks.includes(termWeek)) isInWeek = true;
                    } else if (weeks && weeks.from && weeks.to) {
                        if (termWeek >= weeks.from && termWeek <= weeks.to) isInWeek = true;
                    }
                    if (isInWeek) {
                        const [startTime, endTime] = timeSlot.split('-');
                        genericSchedule.push({
                            date: formatDate(currentDate), startTime, endTime, topic, department,
                            instructor: "TBD", location: "TBD", batch: ["ALL"],
                            isHoliday: false, isClinic: false, isGeneric: true 
                        });
                    }
                });
            }
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    return genericSchedule;
}

/**
 * Standardizes department names to a consistent format.
 * @param {string} dept The original department name.
 * @returns {string} The standardized department name.
 */
export function standardizeDepartmentName(dept) {
    if (!dept) return dept;
    const d = dept.toLowerCase().trim();
    const aliases = {
        'psm': 'Community Medicine', 'comm medicine': 'Community Medicine',
        'medicine': 'Internal Medicine', 'obstetrics & gynaecology': 'Obs & Gynae',
        'gynae': 'Obs & Gynae', 'fm&t': 'Forensic Medicine',
        'forensic medicine & toxicology': 'Forensic Medicine', 'dermat': 'Dermatology',
        'paediatrics': 'Pediatrics', 'ortho': 'Orthopaedics',
        'resp med': 'Respiratory Medicine', 'radio diagnosis': 'Radiodiagnosis',
        'radiodiagnosis': 'Radiodiagnosis', 'psy': 'Psychiatry',
        'anaes': 'Anaesthesiology'
    };
    if (aliases[d]) return aliases[d];
    if (d.includes('comm med')) return 'Community Medicine';
    if (d.includes('fm&t')) return 'Forensic Medicine';
    return dept;
}

/**
 * Merges the generic term schedule with specific weekly schedules from Firestore.
 * Specific events and holidays override generic ones.
 * @param {Array<object>} genericSchedule The baseline term schedule.
 * @param {Array<object>} specificSchedule The schedule from Firestore.
 * @returns {Array<object>} The final, merged schedule.
 */
export function mergeSchedules(genericSchedule, specificSchedule) {
    // Standardize department names in both schedules first
    genericSchedule.forEach(e => e.department = standardizeDepartmentName(e.department));
    specificSchedule.forEach(e => e.department = standardizeDepartmentName(e.department));

    const finalScheduleMap = new Map();
    // Find all dates that are marked as holidays in the specific schedule
    const holidayDates = new Set(specificSchedule.filter(e => e.isHoliday).map(e => e.date));

    // Add generic events, but skip any that fall on a holiday
    genericSchedule.forEach(event => {
        if (!holidayDates.has(event.date)) {
            const key = `${event.date}|${event.startTime}|${event.department}`;
            finalScheduleMap.set(key, event);
        }
    });

    // Add all specific events, overwriting any generic ones at the same time/dept
    specificSchedule.forEach(event => {
        if (event.isHoliday) {
            // Give holidays a unique key to avoid collisions
            const key = `${event.date}|holiday|${event.topic}`;
            finalScheduleMap.set(key, event);
        } else {
            const key = `${event.date}|${event.startTime}|${event.department}`;
            finalScheduleMap.set(key, event);
        }
    });

    return Array.from(finalScheduleMap.values());
}
