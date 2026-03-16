// API BASE URL (Local + Vercel)
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "/api";

// Make it globally accessible
window.API_BASE_URL = API_BASE_URL;

// Get Image URL helper
function getImageUrl(path, fallback = "/frontend/assets/default_user.png") {
  if (!path) return fallback;

  // If it's already a full URL or base64, return it
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  // Cleanup potential double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Backend returns paths like "/uploads/foods/filename.jpg"
  // On local, we need to prefix with backend origin if it's an upload
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    // API_BASE_URL is http://127.0.0.1:8000/api
    const origin = "http://127.0.0.1:8000";
    return `${origin}/${cleanPath}`;
  }

  // On Vercel, paths like /uploads/... work as root-relative relative to the frontend domain
  return `/${cleanPath}`;
}
window.getImageUrl = getImageUrl;
// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  renderNav();
});

// Check Login Status
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

// Logout Function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");

  window.location.href = "/index.html";
}

//? NavBar
function renderNav() {
  const head = document.getElementById("Nav");
  if (!head) return;

  head.innerHTML = `
 <div class="header_container">
      <!-- Logo -->
      <img class="logo" src="/frontend/assets/annesana.png" alt="Annesana Logo"
        onclick="window.location.href = '/index.html'" />

      <!-- Location search -->
       ${
         window.hideSearch
           ? `
        <div class="search">
          <input type="text" id="searchInput" placeholder="Search..." name="Search"/>
          <img src="/frontend/assets/search.png" alt="Error">
        </div>
        `
           : ""
       }
        
      <div class="right-align right">
        <a href='/index.html' class="navBtn">
          Home
        </a>
        <a href="/frontend/pages/map.html" class="navBtn">
          Location
        </a>
        <a id="profile" class="navBtn" onclick="window.location.href = '/frontend/pages/profile.html'">
          Profile
        </a>
        <a class="navBtn" href="/frontend/pages/login.html" id="login">Log in</a>
      </div>
    </div>
  `;

  // Re-run login check to ensure profile/login buttons show correctly in the new innerHTML
  checkLoginStatus();
}

// Search Helper (filters data and calls renderFunc)
function setupSearch(inputSelector, data, renderFunc) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  input.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderFunc(data);
      return;
    }

    const filtered = data.filter((item) => {
      const name = (item.food_name || item.name || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      return name.includes(query) || cat.includes(query);
    });

    renderFunc(filtered);
  });
}
window.setupSearch = setupSearch;

// --- GEOCODING HELPERS ---
const addressCache = new Map();
let geocodeQueue = Promise.resolve();

/**
 * Fetch address from Nominatim (Reverse Geocoding)
 * Includes a mandatory delay to respect rate limits (max 1 per sec)
 */
function fetchAddress(lat, lng) {
  const cacheKey = `${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
  if (addressCache.has(cacheKey)) return Promise.resolve(addressCache.get(cacheKey));

  // Enqueue the request to ensure at least 1100ms between calls
  geocodeQueue = geocodeQueue.then(() => {
    return new Promise(resolve => setTimeout(resolve, 1100));
  }).then(async () => {
    // Check cache again in case another queued call fetched it
    if (addressCache.has(cacheKey)) return addressCache.get(cacheKey);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "AnnesanaFoodApp/1.0" },
      });
      const data = await res.json();
      const addressData = data.address || {};

      const road = addressData.road || addressData.pedestrian || "";
      const suburb = addressData.suburb || addressData.neighbourhood || addressData.city_district || "";
      const city = addressData.city || addressData.town || addressData.village || "";

      const result = {
        road: road,
        suburb: suburb,
        city: city,
        display_name: data.display_name || "Address unavailable",
      };

      addressCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Geocoding error:", error);
      return {
        road: "",
        suburb: "",
        city: "",
        display_name: "Address unavailable",
      };
    }
  });

  return geocodeQueue;
}
window.fetchAddress = fetchAddress;
