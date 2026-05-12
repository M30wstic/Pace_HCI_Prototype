//Saves user data and tasks in localStorage ra, db handling is overkill
const SESSION_KEY = "zenithCurrentUser";
const TASKS_KEY = "zenithTasks";
const PROGRESS_KEY = "zenithProgress";
const XP_PER_TASK = 25;

const getTasks = (email) => {
  const taskStore = JSON.parse(localStorage.getItem(TASKS_KEY) || "{}");
  return taskStore[email] || [];
};

const saveTasks = (email, tasks) => {
  const taskStore = JSON.parse(localStorage.getItem(TASKS_KEY) || "{}");
  taskStore[email] = tasks;
  localStorage.setItem(TASKS_KEY, JSON.stringify(taskStore));
};

const getProgressStore = () => JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");

const getProgress = (email) => {
  const progressStore = getProgressStore();
  return progressStore[email] || { xp: 0 };
};

const saveProgress = (email, progress) => {
  const progressStore = getProgressStore();
  progressStore[email] = progress;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressStore));
};

const escapeHTML = (value) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[char]);

const currentUser = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

if (!currentUser) {
  window.location.href = "login.html";
  throw new Error("No signed-in user found.");
}

const state = {
  filter: "all",
  tasks: getTasks(currentUser.email),
  progress: getProgress(currentUser.email),
};

const profileName = document.querySelector("#profileName");
const profileEmail = document.querySelector("#profileEmail");
const avatarInitial = document.querySelector("#avatarInitial");
const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const taskDeadline = document.querySelector("#taskDeadline");
const taskList = document.querySelector("#taskList");
const filterTabs = document.querySelector("#filterTabs");
const completedCount = document.querySelector("#completedCount");
const streakCount = document.querySelector("#streakCount");
const levelCount = document.querySelector("#levelCount");
const levelTitle = document.querySelector("#levelTitle");
const xpText = document.querySelector("#xpText");
const xpBar = document.querySelector("#xpBar");
const stressCard = document.querySelector("#stressCard");
const stressLabel = document.querySelector("#stressLabel");
const stressBar = document.querySelector("#stressBar");
const stressMessage = document.querySelector("#stressMessage");
const fatigueAlert = document.querySelector("#fatigueAlert");
const fatigueIntro = document.querySelector("#fatigueIntro");
const fatigueTips = document.querySelector("#fatigueTips");
const fatigueClose = document.querySelector("#fatigueClose");
const logoutBtn = document.querySelector("#logoutBtn");

profileName.textContent = currentUser.name;
profileEmail.textContent = currentUser.email;
avatarInitial.textContent = currentUser.name.trim().charAt(0).toUpperCase() || "Z";

const migrateCompletedTaskXP = () => {
  let migrated = false;

  state.tasks.forEach((task) => {
    if (task.completed && !task.xpAwarded) {
      state.progress.xp += XP_PER_TASK;
      task.xpAwarded = true;
      migrated = true;
    }
  });

  if (migrated) {
    saveProgress(currentUser.email, state.progress);
    saveTasks(currentUser.email, state.tasks);
  }
};

const formatDeadline = (value) => {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const getTaskStatus = (task) => {
  if (task.completed || !task.deadline) return "steady";
  const hoursLeft = (new Date(task.deadline) - Date.now()) / 36e5;
  if (hoursLeft < 0) return "overdue";
  if (hoursLeft <= 24) return "soon";
  return "steady";
};

const calculateStress = (activeTasks) => {
  const urgentWeight = activeTasks.filter((task) => getTaskStatus(task) === "soon").length * 22;
  const overdueWeight = activeTasks.filter((task) => getTaskStatus(task) === "overdue").length * 32;
  return Math.min(100, activeTasks.length * 11 + urgentWeight + overdueWeight);
};

const getStreak = () => {
  const completedDates = state.tasks
    .filter((task) => task.completedAt)
    .map((task) => new Date(task.completedAt).toDateString());
  return completedDates.length ? 1 : 1;
};

const renderFatigueTips = (stress) => {
  if (stress >= 70) {
    stressLabel.textContent = "High";
    fatigueAlert.hidden = false;
    fatigueIntro.textContent = "Your current workload is high. Consider these:";
    fatigueTips.innerHTML = `
      <li>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12v5a6 6 0 0 1-12 0V8Z"></path><path d="M8 2v3"></path><path d="M16 2v3"></path><path d="M18 9h2a2 2 0 0 1 0 4h-2"></path></svg>
        Take a 5-minute break and hydrate
      </li>
      <li>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8c2-2 4 2 6 0s4-2 6 0 4 0 4 0"></path><path d="M4 14c2-2 4 2 6 0s4-2 6 0 4 0 4 0"></path><path d="M4 20c2-2 4 2 6 0s4-2 6 0 4 0 4 0"></path></svg>
        Try a breathing exercise (4-7-8 technique)
      </li>
      <li>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-8 0"></path><path d="M3 21a7 7 0 0 1 14 0"></path><path d="M18 8v6"></path><path d="M21 11h-6"></path></svg>
        Consider reaching out to a friend
      </li>
    `;
    return;
  }

  if (stress >= 35) {
    stressLabel.textContent = "Moderate";
    fatigueAlert.hidden = false;
    fatigueIntro.textContent = "Your current workload is rising. Consider this:";
    fatigueTips.innerHTML = `
      <li>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12v5a6 6 0 0 1-12 0V8Z"></path><path d="M8 2v3"></path><path d="M16 2v3"></path><path d="M18 9h2a2 2 0 0 1 0 4h-2"></path></svg>
        Take a 5-minute break and hydrate
      </li>
    `;
    return;
  }

  stressLabel.textContent = "Low";
  fatigueAlert.hidden = true;
};

const renderDashboard = () => {
  const activeTasks = state.tasks.filter((task) => !task.completed);
  const doneTasks = state.tasks.filter((task) => task.completed);
  const xpTotal = state.progress.xp;
  const level = Math.floor(xpTotal / 100) + 1;
  const xpInLevel = xpTotal % 100;
  const stress = calculateStress(activeTasks);

  completedCount.textContent = doneTasks.length;
  streakCount.textContent = getStreak();
  levelCount.textContent = level;
  levelTitle.textContent = `Level ${level}`;
  xpText.textContent = `${xpInLevel} / 100 XP`;
  xpBar.style.width = `${xpInLevel}%`;

  document.querySelector("#allCount").textContent = state.tasks.length;
  document.querySelector("#activeCount").textContent = activeTasks.length;
  document.querySelector("#doneCount").textContent = doneTasks.length;

  stressCard.classList.toggle("medium", stress >= 35 && stress < 70);
  stressCard.classList.toggle("high", stress >= 70);
  stressBar.style.width = `${stress}%`;
  stressMessage.textContent = "Based on workload and deadlines";
  renderFatigueTips(stress);

  const visibleTasks = state.tasks
    .filter((task) => {
      if (state.filter === "active") return !task.completed;
      if (state.filter === "completed") return task.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      if (!a.deadline && !b.deadline) return new Date(b.createdAt) - new Date(a.createdAt);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

  if (!visibleTasks.length) {
    taskList.innerHTML = `<p class="empty-state">${state.tasks.length ? "No tasks match this filter." : "No tasks yet. Add your first task above!"}</p>`;
    return;
  }

  taskList.innerHTML = visibleTasks
    .map((task) => {
      const status = getTaskStatus(task);
      const label = status === "overdue" ? "Overdue" : status === "soon" ? "Due soon" : "Planned";
      return `
        <article class="task-item ${task.completed ? "done" : ""}" data-id="${task.id}">
          <input class="task-check" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark ${escapeHTML(task.title)} complete">
          <div>
            <h3>${escapeHTML(task.title)}</h3>
            <p>${formatDeadline(task.deadline)}</p>
          </div>
          <div class="task-actions">
            <span class="task-pill ${status}">${task.completed ? "Completed" : label}</span>
            <button class="task-delete" type="button" aria-label="Delete ${escapeHTML(task.title)}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v5"></path>
                <path d="M14 11v5"></path>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join("");
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitle.value.trim();

  if (!title) {
    taskTitle.focus();
    return;
  }

  state.tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    deadline: taskDeadline.value,
    completed: false,
    xpAwarded: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks(currentUser.email, state.tasks);
  taskForm.reset();
  renderDashboard();
});

taskList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("task-check")) return;
  const taskItem = event.target.closest(".task-item");
  const task = state.tasks.find((item) => item.id === taskItem.dataset.id);
  task.completed = event.target.checked;
  task.completedAt = task.completed ? new Date().toISOString() : null;

  if (task.completed && !task.xpAwarded) {
    state.progress.xp += XP_PER_TASK;
    task.xpAwarded = true;
    saveProgress(currentUser.email, state.progress);
  }

  saveTasks(currentUser.email, state.tasks);
  renderDashboard();
});

taskList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".task-delete");
  if (!deleteButton) return;

  const taskItem = deleteButton.closest(".task-item");
  state.tasks = state.tasks.filter((item) => item.id !== taskItem.dataset.id);
  saveTasks(currentUser.email, state.tasks);
  renderDashboard();
});

filterTabs.addEventListener("click", (event) => {
  const tab = event.target.closest(".filter-tab");
  if (!tab) return;
  state.filter = tab.dataset.filter;
  filterTabs.querySelectorAll(".filter-tab").forEach((button) => {
    button.classList.toggle("active", button === tab);
  });
  renderDashboard();
});

fatigueClose.addEventListener("click", () => {
  fatigueAlert.hidden = true;
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
});

migrateCompletedTaskXP();
renderDashboard();
