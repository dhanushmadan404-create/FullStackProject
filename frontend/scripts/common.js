// -----------------------------
// API BASE URL (Local + Vercel)
// -----------------------------
const API_BASE_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "/api";

// Make it globally accessible
window.API_BASE_URL = API_BASE_URL;


// -----------------------------
// Run on page load
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
});


// -----------------------------
// Check Login Status
// -----------------------------
function checkLoginStatus() {
  const token = localStorage.getItem("token");

  const loginBtn = document.getElementById("login");
  const profileBtn = document.getElementById("profile");

  // If login button doesn't exist on page, skip
  if (!loginBtn && !profileBtn) return;

  if (token) {
    // Logged in
    if (loginBtn) loginBtn.style.display = "none";
    if (profileBtn) profileBtn.style.display = "inline-block";
  } else {
    // Not logged in
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (profileBtn) profileBtn.style.display = "none";
  }
}


// -----------------------------
// Logout Function
// -----------------------------
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");

  window.location.href = "/login";
}

