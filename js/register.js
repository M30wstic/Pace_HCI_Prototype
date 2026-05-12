const USERS_KEY = "zenithUsers";
const SESSION_KEY = "zenithCurrentUser";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const showAlert = (element, message) => {
  if (!element) return;
  element.querySelector("p").textContent = message;
  element.hidden = false;
};

const hideAlert = (element) => {
  if (element) element.hidden = true;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const signupForm = document.querySelector("#signupForm");
const signupAlert = document.querySelector("#signupAlert");

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.querySelector("#signupName").value.trim();
  const email = normalizeEmail(document.querySelector("#signupEmail").value);
  const password = document.querySelector("#signupPassword").value;
  const confirm = document.querySelector("#signupConfirm").value;

  if (!name || !email || !password || !confirm) {
    showAlert(signupAlert, "Please fill in all fields");
    return;
  }

  if (password !== confirm) {
    showAlert(signupAlert, "Passwords do not match");
    return;
  }

  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    showAlert(signupAlert, "An account with this email already exists");
    return;
  }

  users.push({ name, email, password });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
  hideAlert(signupAlert);
  window.location.href = "dashboard.html";
});
