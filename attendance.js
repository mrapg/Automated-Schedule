import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Import all the new functions from utils
import * as utils from './utils.js';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyC6jkkGL8OA47muh3Bwer9qFRMUejmnso8",
    authDomain: "training-schedule-7c862.firebaseapp.com",
    projectId: "training-schedule-7c862",
    storageBucket: "training-schedule-7c862.firebasestorage.app",
    messagingSenderId: "395637809585",
    appId: "1:395637809585:web:9a5eea7f80741083f49d90",
    measurementId: "G-S9EXHXY981"
};
const appId = "training-schedule-7c862";

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
signInAnonymously(auth).catch((error) => console.error("Anonymous sign-in failed:", error));

// (DOM element variables remain the same)
const rollNumberInput = document.getElementById('roll-number');
const targetAttendanceInput = document.getElementById('target-attendance');
const loadingEl = document.getElementById('loading');
const mainContentEl = document.getElementById('main-content');
const classesNeededEl = document.getElementById('classes-needed');
const weeksNeededEl = document.getElementById('weeks-needed');
const targetDisplayEl = document.getElementById('target-display');
const attendanceBreakdownEl = document.getElementById('attendance-breakdown');
const summaryTabBtn = document.getElementById('summary-tab-btn');
const classlistTabBtn = document.getElementById('classlist-tab-btn');
const summaryView = document.getElementById('summary-view');
const classlistView = document.getElementById('classlist-view');
const pastClassesContainer = document.getElementById('past-classes-container');
const upcomingClassesContainer = document.getElementById('upcoming-classes-container');


// --- APP STATE ---
let scheduleData = [];
let userRollNo = null;
let userAttendance = new Set();
const ATTENDANCE_SUBJECTS = ['Community Medicine', 'Forensic Medicine', 'ENT', 'Ophthalmology'];

/**
 * Creates a unique ID for a schedule event.
 * @param {object} event The schedule event.
 * @returns {string} A unique identifier.
 */
function getEventId(event) {
    return `${event.date}_${event.startTime}_${event.department}_${event.topic}`.replace(/\s+/g, '-');
}

/**
 * Determines if an event is relevant for a specific student's attendance.
 * @param {object} event The schedule event.
 * @param {number} rollNo The student's roll number.
 * @returns {boolean} True if the event counts for the student.
 */
function isEventRelevantForUser(event, rollNo) {
    if (!ATTENDANCE_SUBJECTS.includes(event.department) || event.isHoliday) {
        return false;
    }
    const topic = event.topic.toLowerCase();
    if (topic.includes('clinic')) {
        const clinicBatch = utils.getClinicBatch(rollNo);
        return event.batch.includes(clinicBatch);
    }
    const generalBatch = utils.getGeneralBatch(rollNo);
    return event.batch.includes('ALL') || event.batch.includes(generalBatch);
}

/**
 * **[UPDATED]** Determines the attendance type (Theory or Practical).
 * @param {object} event The schedule event.
 * @returns {string|null} 'Theory', 'Practical', or null.
 */
function getAttendanceType(event) {
    const topic = event.topic.toLowerCase();
    const practicalKeywords = {
        'Community Medicine': ['clinic', 'tutorial', 'practical', 'field visit'],
        'Forensic Medicine': ['tutorial', 'demo', 'autopsy'],
        'ENT': ['clinic', 'tutorial', 'practical', 'demo'],
        'Ophthalmology': ['clinic', 'tutorial', 'demo', 'surgery']
    };

    if (practicalKeywords[event.department]) {
        for (const keyword of practicalKeywords[event.department]) {
            if (topic.includes(keyword)) {
                return 'Practical';
            }
        }
    }
    return 'Theory';
}


/**
 * **[UPDATED]** Fetches the specific schedule from Firestore and merges it with the generic term schedule.
 */
async function fetchSchedule() {
    loadingEl.style.display = 'block';
    mainContentEl.style.display = 'none';

    // 1. Fetch specific schedule from Firestore
    const scheduleCollectionRef = collection(db, `artifacts/${appId}/public/data/schedule`);
    const querySnapshot = await getDocs(scheduleCollectionRef);
    const specificSchedule = querySnapshot.docs.map(doc => doc.data());

    // 2. Generate the generic term schedule
    const genericSchedule = utils.generateGenericSchedule();

    // 3. Merge them together, with specific events and holidays overriding generic ones
    scheduleData = utils.mergeSchedules(genericSchedule, specificSchedule)
                        .sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    await loadUserAttendance();
}

// (The rest of attendance.js remains the same as the previous version)
async function loadUserAttendance() {
    if (!userRollNo) return;
    const docRef = doc(db, `artifacts/${appId}/public/data/attendanceRecords`, `roll-${userRollNo}`);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            userAttendance = new Set(docSnap.data().attendedClasses || []);
        } else {
            userAttendance.clear();
        }
    } catch (error) {
        console.error("Error loading attendance:", error);
    }
    processAllData();
}

async function saveUserAttendance() {
    if (!userRollNo) return;
    const docRef = doc(db, `artifacts/${appId}/public/data/attendanceRecords`, `roll-${userRollNo}`);
    try {
        await setDoc(docRef, { attendedClasses: Array.from(userAttendance) });
        console.log("Attendance saved!");
    } catch (error) {
        console.error("Error saving attendance:", error);
    }
}

function processAllData() {
    if (!userRollNo || scheduleData.length === 0) {
        loadingEl.style.display = 'none';
        mainContentEl.style.display = 'block';
        return;
    }
    
    const now = new Date();
    const relevantEvents = scheduleData.filter(e => isEventRelevantForUser(e, userRollNo));
    
    const pastEvents = relevantEvents.filter(e => new Date(e.date) < now);
    const upcomingEvents = relevantEvents.filter(e => new Date(e.date) >= now);

    renderClassList(pastEvents, upcomingEvents);
    
    const summaryData = calculateSummary(relevantEvents);
    renderSummary(summaryData);
    
    calculateProjections(summaryData, upcomingEvents.length);
    
    loadingEl.style.display = 'none';
    mainContentEl.style.display = 'block';
}

function calculateSummary(relevantEvents) {
    const summary = {};
    ATTENDANCE_SUBJECTS.forEach(subject => {
        summary[subject] = {
            'Theory': { total: 0, attended: 0 },
            'Practical': { total: 0, attended: 0 }
        };
    });

    const now = new Date();
    relevantEvents.forEach(event => {
        if (new Date(event.date) < now) {
            const type = getAttendanceType(event);
            if (summary[event.department] && summary[event.department][type]) {
                summary[event.department][type].total++;
                if (userAttendance.has(getEventId(event))) {
                    summary[event.department][type].attended++;
                }
            }
        }
    });
    return summary;
}

function renderSummary(summaryData) {
    let html = '<h2 class="text-xl font-semibold mb-4">Subject Breakdown</h2>';
    ATTENDANCE_SUBJECTS.forEach(subject => {
        html += `<div class="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">`;
        html += `<h3 class="text-lg font-semibold">${subject}</h3>`;

        ['Theory', 'Practical'].forEach(type => {
            const data = summaryData[subject][type];
            if (data.total > 0) {
                const percentage = Math.round((data.attended / data.total) * 100);
                html += `
                    <div class="mt-2">
                        <div class="flex justify-between items-center mb-1 text-sm">
                            <span>${type}</span>
                            <span class="font-medium">${data.attended} / ${data.total} (${percentage}%)</span>
                        </div>
                        <div class="progress-bar-container w-full h-2">
                            <div class="progress-bar" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                `;
            }
        });
        html += `</div>`;
    });
    attendanceBreakdownEl.innerHTML = html;
}

function renderClassList(pastEvents, upcomingEvents) {
    let pastHtml = '<h2 class="text-xl font-semibold mb-4">Past Classes</h2>';
    if(pastEvents.length > 0) {
        pastEvents.forEach(event => {
            const eventId = getEventId(event);
            const isAttended = userAttendance.has(eventId);
            pastHtml += `
                <div class="flex items-center justify-between p-3 mb-2 bg-gray-50 border border-gray-200 rounded-md">
                    <div>
                        <p class="font-semibold">${event.topic} <span class="text-xs text-gray-500">(${event.department})</span></p>
                        <p class="text-sm text-gray-600">${new Date(event.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})} | ${event.startTime}-${event.endTime}</p>
                    </div>
                    <input type="checkbox" data-event-id="${eventId}" class="h-6 w-6 rounded text-blue-600 focus:ring-blue-500" ${isAttended ? 'checked' : ''}>
                </div>
            `;
        });
    } else {
        pastHtml += `<p class="text-sm text-gray-500">No past classes found in the schedule.</p>`;
    }
    
    let upcomingHtml = '<h2 class="text-xl font-semibold mb-4">Upcoming Classes</h2>';
    if(upcomingEvents.length > 0) {
         upcomingEvents.forEach(event => {
            upcomingHtml += `
                <div class="p-3 mb-2 bg-gray-50 border border-gray-200 rounded-md">
                    <p class="font-semibold">${event.topic} <span class="text-xs text-gray-500">(${event.department})</span></p>
                    <p class="text-sm text-gray-600">${new Date(event.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})} | ${event.startTime}-${event.endTime}</p>
                </div>
            `;
        });
    } else {
        upcomingHtml += `<p class="text-sm text-gray-500">No upcoming classes for attendance.</p>`;
    }

    pastClassesContainer.innerHTML = pastHtml;
    upcomingClassesContainer.innerHTML = upcomingHtml;
}

function calculateProjections(summaryData, upcomingClassCount) {
    const targetPercentage = parseInt(targetAttendanceInput.value) || 75;
    targetDisplayEl.textContent = `${targetPercentage}%`;

    let totalHeld = 0;
    let totalAttended = 0;
    Object.values(summaryData).forEach(subject => {
        Object.values(subject).forEach(type => {
            totalHeld += type.total;
            totalAttended += type.attended;
        });
    });

    const totalClassesForTerm = totalHeld + upcomingClassCount;
    const requiredAttended = Math.ceil((targetPercentage / 100) * totalClassesForTerm);
    const classesNeeded = Math.max(0, requiredAttended - totalAttended);

    classesNeededEl.textContent = classesNeeded;

    const today = new Date();
    const remainingWeeks = (utils.termEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const avgUpcomingPerWeek = remainingWeeks > 0 ? upcomingClassCount / remainingWeeks : 0;
    
    const weeksNeeded = (avgUpcomingPerWeek > 0) ? Math.ceil(classesNeeded / avgUpcomingPerWeek) : 0;
    weeksNeededEl.textContent = weeksNeeded;
}

let debounceTimer;
rollNumberInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const val = parseInt(rollNumberInput.value);
        if (val && val >= 1 && val <= 150) {
            userRollNo = val;
            localStorage.setItem('userRollNo', userRollNo);
            fetchSchedule();
        }
    }, 500);
});

targetAttendanceInput.addEventListener('input', () => {
    localStorage.setItem('targetAttendance', targetAttendanceInput.value);
    processAllData();
});

pastClassesContainer.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const eventId = e.target.dataset.eventId;
        if (e.target.checked) {
            userAttendance.add(eventId);
        } else {
            userAttendance.delete(eventId);
        }
        saveUserAttendance();
        processAllData();
    }
});

summaryTabBtn.addEventListener('click', () => {
    summaryView.style.display = 'block';
    classlistView.style.display = 'none';
    summaryTabBtn.classList.add('active');
    classlistTabBtn.classList.remove('active');
});

classlistTabBtn.addEventListener('click', () => {
    summaryView.style.display = 'none';
    classlistView.style.display = 'block';
    summaryTabBtn.classList.remove('active');
    classlistTabBtn.classList.add('active');
});

function initialize() {
    const savedRollNo = localStorage.getItem('userRollNo');
    const savedTarget = localStorage.getItem('targetAttendance');
    if (savedRollNo) {
        rollNumberInput.value = savedRollNo;
        userRollNo = parseInt(savedRollNo);
    }
    if (savedTarget) {
        targetAttendanceInput.value = savedTarget;
    }
    fetchSchedule();
}

initialize();
