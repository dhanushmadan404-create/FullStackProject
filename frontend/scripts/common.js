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

  window.location.href = "/index.html";
}


// -----------------------------
// Get Image URL
// -----------------------------
function getImageUrl(path, fallback = "../assets/default_user.png") {
  if (!path) return fallback;

  // If it's already a full URL or base64, return it
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  // Cleanup potential double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Backend uploads usually go to /uploads directory
  // If the path doesn't start with assets/ or uploads/, assume it's an upload
  if (!cleanPath.startsWith("assets/") && !cleanPath.startsWith("uploads/")) {
    // API_BASE_URL is /api or http://127.0.0.1:8000/api
    const base = API_BASE_URL.replace("/api", "");
    return `${base}/uploads/${cleanPath}`;
  }

  // If it's an assets or uploads path already, just join it with the base
  const base = API_BASE_URL.replace("/api", "");
  return `${base}/${cleanPath}`;
}
