import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

// --- DOM ELEMENTS ---
const targetAttendanceInput = document.getElementById('target-attendance');
const classesNeededEl = document.getElementById('classes-needed');
const weeksNeededEl = document.getElementById('weeks-needed');
const attendanceBreakdownEl = document.getElementById('attendance-breakdown');

// --- APP STATE ---
let scheduleData = [];
let attendanceData = {};
const ATTENDANCE_SUBJECTS = ['Community Medicine', 'Forensic Medicine', 'ENT', 'Ophthalmology'];

// --- FUNCTIONS ---

/**
 * Fetches schedule data from Firestore.
 */
async function fetchSchedule() {
    const scheduleCollectionRef = collection(db, `artifacts/${appId}/public/data/schedule`);
    const querySnapshot = await getDocs(scheduleCollectionRef);
    scheduleData = querySnapshot.docs.map(doc => doc.data());
    console.log('Schedule data loaded:', scheduleData);
    updateAttendance();
}

/**
 * Determines the attendance type (Theory or Practical) for an event.
 * @param {object} event The schedule event.
 * @returns {string|null} 'Theory', 'Practical', or null if not an attendance event.
 */
function getAttendanceType(event) {
    const topic = event.topic.toLowerCase();
    const department = event.department;

    if (!ATTENDANCE_SUBJECTS.includes(department)) {
        return null;
    }

    switch (department) {
        case 'Community Medicine':
            return (topic.includes('clinic') || topic.includes('tutorial')) ? 'Practical' : 'Theory';
        case 'Forensic Medicine':
            return topic.includes('tutorial') ? 'Practical' : 'Theory';
        case 'ENT':
            return topic.includes('clinic') ? 'Practical' : 'Theory';
        case 'Ophthalmology':
            return topic.includes('clinic') ? 'Practical' : 'Theory';
        default:
            return null;
    }
}

/**
 * Processes the schedule to calculate attendance.
 */
function updateAttendance() {
    const targetPercentage = parseInt(targetAttendanceInput.value) || 75;
    attendanceData = {};

    // Initialize attendance data structure
    ATTENDANCE_SUBJECTS.forEach(subject => {
        attendanceData[subject] = {
            'Theory': { total: 0, attended: 0, upcoming: 0 },
            'Practical': { total: 0, attended: 0, upcoming: 0 }
        };
    });

    const now = new Date();
    scheduleData.forEach(event => {
        const eventDate = new Date(event.date);
        const type = getAttendanceType(event);
        if (type) {
            const subject = event.department;
            if (eventDate < now) {
                attendanceData[subject][type].total++;
            } else {
                attendanceData[subject][type].upcoming++;
            }
        }
    });

    // TODO: Add logic to get "attended" classes from user input/storage

    renderAttendance();
    calculateProjections(targetPercentage);
}

/**
 * Renders the attendance breakdown by subject.
 */
function renderAttendance() {
    let html = '<h2 class="text-xl font-semibold mb-4">Subject Breakdown</h2>';
    ATTENDANCE_SUBJECTS.forEach(subject => {
        html += `<div class="mb-4 p-4 border border-gray-200 rounded-lg">`;
        html += `<h3 class="text-lg font-semibold">${subject}</h3>`;

        ['Theory', 'Practical'].forEach(type => {
            const data = attendanceData[subject][type];
            const percentage = data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0;
            html += `
                <div class="mt-2">
                    <div class="flex justify-between items-center mb-1">
                        <span>${type}</span>
                        <span>${data.attended} / ${data.total} (${percentage}%)</span>
                    </div>
                    <div class="progress-bar-container w-full">
                        <div class="progress-bar" style="width: ${percentage}%;"></div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    });
    attendanceBreakdownEl.innerHTML = html;
}

/**
 * Calculates the number of classes and weeks needed to reach the target.
 * @param {number} targetPercentage The user's target attendance percentage.
 */
function calculateProjections(targetPercentage) {
    let totalClasses = 0;
    let totalAttended = 0;
    let totalUpcoming = 0;

    ATTENDANCE_SUBJECTS.forEach(subject => {
        ['Theory', 'Practical'].forEach(type => {
            totalClasses += attendanceData[subject][type].total;
            totalAttended += attendanceData[subject][type].attended;
            totalUpcoming += attendanceData[subject][type].upcoming;
        });
    });

    const classesNeeded = Math.ceil((targetPercentage / 100) * (totalClasses + totalUpcoming) - totalAttended);
    classesNeededEl.textContent = classesNeeded > 0 ? classesNeeded : 0;

    // Simplified projection: assumes an average number of classes per week
    const avgClassesPerWeek = 5; // This should be calculated more accurately
    const weeksNeeded = classesNeeded > 0 ? Math.ceil(classesNeeded / avgClassesPerWeek) : 0;
    weeksNeededEl.textContent = weeksNeeded;
}


// --- EVENT LISTENERS ---
targetAttendanceInput.addEventListener('input', updateAttendance);

// --- INITIALIZATION ---
fetchSchedule();
