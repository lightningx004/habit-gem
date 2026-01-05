// --- DOM Elements ---
const monthYearText = document.getElementById('monthYear');
const calendarGrid = document.getElementById('calendarGrid');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');

// Progress Elements
const progressCircle = document.getElementById('progressCircle');
const progressText = document.getElementById('progressText');
const fractionText = document.getElementById('fractionText');

const monthCircle = document.getElementById('monthCircle');
const monthText = document.getElementById('monthText');

// Input Elements
const habitInput = document.getElementById('habitInput');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitList = document.getElementById('habitList');

// Year Elements
const yearBarFill = document.getElementById('yearBarFill');
const yearPercentText = document.getElementById('yearPercent');

// --- State ---
let currentDate = new Date(); 
let selectedDate = new Date(); 
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let completions = JSON.parse(localStorage.getItem('completions')) || {};

// --- 1. Year & Month Progress Logic ---
function updateTimeProgress() {
    const now = new Date();
    
    // YEAR PROGRESS
    const startYear = new Date(now.getFullYear(), 0, 0);
    const diffYear = now - startYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diffYear / oneDay);
    const isLeap = (now.getFullYear() % 400 === 0) || (now.getFullYear() % 100 !== 0 && now.getFullYear() % 4 === 0);
    const totalDaysYear = isLeap ? 366 : 365;
    const yearPercent = ((dayOfYear / totalDaysYear) * 100).toFixed(0); 
    
    yearPercentText.innerText = `${yearPercent}%`;
    yearBarFill.style.width = `${yearPercent}%`;

    // MONTH PROGRESS
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthPercent = Math.round((dayOfMonth / daysInMonth) * 100);

    monthText.innerText = `${monthPercent}%`;
    const degrees = monthPercent * 3.6;
    monthCircle.style.setProperty('--month-deg', `${degrees}deg`);
}

// --- 2. Calendar Logic (UPDATED) ---
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    monthYearText.innerText = `${monthNames[month]} ${year}`.toUpperCase();
    calendarGrid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get today's date with time stripped
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.innerText = i;

        const thisDate = new Date(year, month, i);
        const dateKey = thisDate.toDateString();

        const completedCount = completions[dateKey] ? completions[dateKey].length : 0;
        const totalHabits = habits.length;
        let percentage = 0;
        
        if (totalHabits > 0) {
            percentage = (completedCount / totalHabits) * 100;
        }

        // --- STATUS LOGIC ---
        if (totalHabits > 0 && thisDate <= today) {
            if (percentage === 100) {
                // 100% -> Perfect (Filled Green + Glow)
                dayDiv.classList.add('perfect');
            } else if (percentage >= 60) {
                // 60-99% -> Success (Green Border)
                dayDiv.classList.add('success');
            } else if (percentage === 0) {
                // 0% -> Critical Fail (Filled Red + Glow)
                dayDiv.classList.add('fail', 'neon'); 
            } else {
                // 1-59% -> Fail (Red Border)
                dayDiv.classList.add('fail');
            }
        }

        // Selected State
        if (i === selectedDate.getDate() && 
            month === selectedDate.getMonth() && 
            year === selectedDate.getFullYear()) {
            dayDiv.classList.add('selected');
        }

        dayDiv.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            renderCalendar(); 
            renderHabits();   
            updateHabitProgress(); 
        });

        calendarGrid.appendChild(dayDiv);
    }
}

// --- 3. Habit List Logic ---
function renderHabits() {
    habitList.innerHTML = "";
    const dateKey = selectedDate.toDateString(); 

    habits.forEach((habit, index) => {
        const li = document.createElement('li');
        li.classList.add('habit-item');
        
        const isCompleted = completions[dateKey] && completions[dateKey].includes(index);
        if (isCompleted) li.classList.add('completed');

        li.innerHTML = `
            <div style="display:flex; align-items:center; width:100%;">
                <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleHabit(${index})">
                <span class="habit-text">${habit}</span>
            </div>
            <button class="delete-btn" onclick="deleteHabit(${index})">×</button>
        `;
        habitList.appendChild(li);
    });
}

function addHabit() {
    const text = habitInput.value.trim();
    if (text) {
        habits.push(text);
        saveData();
        habitInput.value = "";
        
        renderHabits();
        updateHabitProgress();
        renderCalendar(); 
    }
}

function deleteHabit(index) {
    if(confirm("Remove habit?")) {
        habits.splice(index, 1);
        saveData();
        renderHabits();
        updateHabitProgress();
        renderCalendar();
    }
}

window.toggleHabit = function(index) {
    const dateKey = selectedDate.toDateString();
    if (!completions[dateKey]) completions[dateKey] = [];

    const habitIndex = completions[dateKey].indexOf(index);
    if (habitIndex > -1) {
        completions[dateKey].splice(habitIndex, 1);
    } else {
        completions[dateKey].push(index);
    }

    saveData();
    renderHabits();
    updateHabitProgress();
    renderCalendar(); 
}

window.deleteHabit = deleteHabit; 

// --- 4. Today Progress Logic ---
function updateHabitProgress() {
    if (habits.length === 0) {
        progressText.innerText = "0%";
        fractionText.innerText = "0/0";
        progressCircle.style.setProperty('--progress-deg', '0deg');
        return;
    }

    const dateKey = selectedDate.toDateString();
    const completedCount = completions[dateKey] ? completions[dateKey].length : 0;
    const totalHabits = habits.length;

    const percentage = Math.round((completedCount / totalHabits) * 100);
    const degrees = percentage * 3.6; 
    
    progressCircle.style.setProperty('--progress-deg', `${degrees}deg`);
    
    progressText.innerText = `${percentage}%`;
    fractionText.innerText = `${completedCount}/${totalHabits}`;
}

// --- 5. Save & Init ---
function saveData() {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('completions', JSON.stringify(completions));
}

prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});
addHabitBtn.addEventListener('click', addHabit);

renderCalendar();
renderHabits();
updateHabitProgress();
updateTimeProgress();