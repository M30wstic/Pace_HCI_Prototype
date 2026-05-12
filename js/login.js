const USERS_KEY = "zenithUsers";
const SESSION_KEY = "zenithCurrentUser";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

const showAlert = (element, message) => {
  if (!element) return;
  element.querySelector("p").textContent = message;
  element.hidden = false;
};

const hideAlert = (element) => {
  if (element) element.hidden = true;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const loginForm = document.querySelector("#loginForm");
const loginAlert = document.querySelector("#loginAlert");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = normalizeEmail(document.querySelector("#loginEmail").value);
  const password = document.querySelector("#loginPassword").value;

  if (!email || !password) {
    showAlert(loginAlert, "Please enter your email and password");
    return;
  }

  const user = getUsers().find((account) => account.email === email && account.password === password);
  if (!user) {
    showAlert(loginAlert, "Invalid email or password");
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  hideAlert(loginAlert);
  window.location.href = "dashboard.html";
});
