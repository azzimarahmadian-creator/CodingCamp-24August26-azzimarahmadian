/* --- 1. CLOCK & GREETING  --- */
function updateClockAndGreeting() {
    const now = new Date();
    
    // Format Jam (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;

    // Format Tanggal dalam Bahasa Indonesia ('id-ID')
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('id-ID', options);

    // Sapaan Dinamis Bahasa Indonesia
    const currentHour = now.getHours();
    let greetingText = 'Selamat Malam';
    if (currentHour >= 3 && currentHour < 11) {
        greetingText = 'Selamat Pagi';
    } else if (currentHour >= 11 && currentHour < 15) {
        greetingText = 'Selamat Siang';
    } else if (currentHour >= 15 && currentHour < 18) {
        greetingText = 'Selamat Sore';
    }
    document.getElementById('greeting').textContent = greetingText;
}
setInterval(updateClockAndGreeting, 1000);
updateClockAndGreeting();

/* --- 2. FOCUS TIMER --- */
let timerSeconds = 25 * 60;
let timerInterval = null;
const timerDisplay = document.getElementById('timerDisplay');

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

document.getElementById('startBtn').addEventListener('click', () => {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            alert('Sesi fokus selesai!');
        }
    }, 1000);
});

document.getElementById('stopBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
});

document.getElementById('resetBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 25 * 60;
    updateTimerDisplay();
});

/* --- 3. TASKS MANAGEMENT --- */
let tasks = JSON.parse(localStorage.getItem('dashboard_tasks')) || [
    { text: 'belanja', completed: false },
    { text: 'belajar', completed: false }
];

const taskList = document.getElementById('taskList');
const taskInput = document.getElementById('taskInput');

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="task-left" style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${index})">
                <span>${task.text}</span>
            </div>
            <button class="btn-danger" onclick="deleteTask(${index})">Hapus</button>
        `;
        taskList.appendChild(li);
    });
    localStorage.setItem('dashboard_tasks', JSON.stringify(tasks));
}

function addTask() {
    const text = taskInput.value.trim();
    if (text) {
        tasks.push({ text, completed: false });
        taskInput.value = '';
        renderTasks();
    }
}

window.toggleTask = function(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

window.deleteTask = function(index) {
    tasks.splice(index, 1);
    renderTasks();
}

document.getElementById('addTaskBtn').addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

renderTasks();

/* --- 4. QUICK LINKS --- */
let quickLinks = JSON.parse(localStorage.getItem('dashboard_links')) || [
    { name: 'Google', url: 'https://google.com' },
    { name: 'Gmail', url: 'https://gmail.com' },
    { name: 'Calendar', url: 'https://calendar.google.com' }
];

const linksContainer = document.getElementById('linksContainer');
const linkNameInput = document.getElementById('linkNameInput');
const linkUrlInput = document.getElementById('linkUrlInput');

function renderLinks() {
    linksContainer.innerHTML = '';
    quickLinks.quickLinks = quickLinks || [];
    quickLinks.forEach((link, index) => {
        const a = document.createElement('a');
        a.className = 'quick-link-badge';
        a.href = link.url;
        a.target = '_blank';
        a.innerHTML = `
            ${link.name}
            <button class="remove-link" onclick="event.preventDefault(); deleteLink(${index})">×</button>
        `;
        linksContainer.appendChild(a);
    });
    localStorage.setItem('dashboard_links', JSON.stringify(quickLinks));
}

function addLink() {
    let name = linkNameInput.value.trim();
    let url = linkUrlInput.value.trim();
    if (name && url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        quickLinks.push({ name, url });
        linkNameInput.value = '';
        linkUrlInput.value = '';
        renderLinks();
    }
}

window.deleteLink = function(index) {
    quickLinks.splice(index, 1);
    renderLinks();
}

document.getElementById('addLinkBtn').addEventListener('click', addLink);
renderLinks();
