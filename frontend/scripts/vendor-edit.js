// ===============================
// Vendor Edit Script
// ===============================

// ---------------- API BASE URL ----------------
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "/api";

let menuItems = []; // Store only NEW food items
let marker = null;
let selectedLat = null;
let selectedLng = null;
let map = null;

// Food icon for map
const foodIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found. Redirecting to login...");
    window.location.href = "./login.html";
    return;
  }

  initMap();
  loadInitialData(token);
  setupFormListeners();
});

// ===============================
// Map Initialization
// ===============================
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  map = L.map("map").setView([13.0827, 80.2707], 11);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  map.on("click", (e) => {
    updateMarker(e.latlng.lat, e.latlng.lng);
  });
}

function updateMarker(lat, lng) {
  if (marker) map.removeLayer(marker);

  marker = L.marker([lat, lng], { icon: foodIcon }).addTo(map);
  selectedLat = lat;
  selectedLng = lng;

  const locationLabel = document.getElementById("location-label");
  if (locationLabel) locationLabel.innerHTML = "Location Selected ✅";

  console.log("Location:", lat, lng);
}

// ===============================
// Load Initial Data (User + Vendor + Food Category)
// ===============================
async function loadInitialData(token) {
  try {
    // 1. Get User Info
    const userRes = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) throw new Error("Failed to load user");
    const user = await userRes.json();
    localStorage.setItem("user_details", JSON.stringify(user));

    document.getElementById("userName").value = user.name || "";
    if (user.image_url) {
      document.getElementById("userImagePreview").src = getImageUrl(
        user.image_url,
      );
    }

    // 2. Get Vendor Info
    const vendorRes = await fetch(
      `${API_BASE_URL}/vendors/user/${user.user_id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (vendorRes.ok) {
      const vendor = await vendorRes.json();
      if (vendor.exists) {
        localStorage.setItem("vendor", JSON.stringify(vendor));

        document.getElementById("number").value = vendor.phone_number || "";
        if (vendor.opening_time)
          document.getElementById("openingTime").value =
            vendor.opening_time.slice(0, 5);
        if (vendor.closing_time)
          document.getElementById("closingTime").value =
            vendor.closing_time.slice(0, 5);

        // 3. Get Food Category & Location from Food Table
        const foodRes = await fetch(
          `${API_BASE_URL}/foods/vendor/${vendor.vendor_id}`,
        );
        if (foodRes.ok) {
          const foods = await foodRes.json();
          if (foods.length > 0) {
            const sampleFood = foods[0];
            // Prefill Category
            document.getElementById("foodType").value =
              sampleFood.category.toLowerCase();

            // Prefill Location
            selectedLat = sampleFood.latitude;
            selectedLng = sampleFood.longitude;
            if (map && selectedLat && selectedLng) {
              map.setView([selectedLat, selectedLng], 15);
              updateMarker(selectedLat, selectedLng);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Initial load failed:", error);
  }
}

// ===============================
// Setup Listeners
// ===============================
function setupFormListeners() {
  const form = document.getElementById("vendorRegistration");
  if (form) form.addEventListener("submit", handleSubmit);

  // Map Controls
  const mapContainer = document.getElementById("mapContainer");
  const locBtn = document.querySelector(".location-icon");
  if (locBtn && mapContainer) {
    locBtn.addEventListener("click", () => {
      mapContainer.style.display = "block";
      setTimeout(() => map.invalidateSize(), 150);
    });
  }

  const backBtn = document.getElementById("back");
  if (backBtn)
    backBtn.addEventListener(
      "click",
      () => (mapContainer.style.display = "none"),
    );

  const saveBtn = document.getElementById("save");
  if (saveBtn)
    saveBtn.addEventListener("click", () => {
      if (selectedLat && selectedLng) mapContainer.style.display = "none";
      else alert("Please select a location on the map.");
    });

  // Current Location
  const currentLocBtn = document.getElementById("location");
  if (currentLocBtn) {
    currentLocBtn.addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 15);
          updateMarker(pos.coords.latitude, pos.coords.longitude);
        });
      }
    });
  }

  // Image Preview
  const userImgInput = document.getElementById("userImage");
  if (userImgInput) {
    userImgInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) =>
          (document.getElementById("userImagePreview").src =
            event.target.result);
        reader.readAsDataURL(file);
      }
    });
  }
}

// ===============================
// Menu Management
// ===============================
window.addMenuItem = function () {
  const nameInput = document.getElementById("menuName");
  const imgInput = document.getElementById("menuImage");
  const listContainer = document.getElementById("list_container");

  const name = nameInput.value.trim();
  const file = imgInput.files[0];

  if (!name || !file) {
    alert("Food name and image are required.");
    return;
  }

  const itemId = Date.now();
  menuItems.push({ id: itemId, name, file });

  const li = document.createElement("li");
  li.innerHTML = `<span>${name}</span>`; // No delete button per requirement
  listContainer.appendChild(li);

  nameInput.value = "";
  imgInput.value = "";
};

// ===============================
// Main Submit
// ===============================
async function handleSubmit(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user_details") || "{}");
  const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");
  const submitBtn = document.getElementById("submit");

  if (!user.email || !vendor.vendor_id) {
    alert("Session data missing. Please refresh.");
    return;
  }

  submitBtn.innerText = "Processing...";
  submitBtn.disabled = true;

  try {
    // 1. Update User
    const userFormData = new FormData();
    userFormData.append(
      "name",
      document.getElementById("userName").value.trim(),
    );
    const userImg = document.getElementById("userImage").files[0];
    if (userImg) userFormData.append("image", userImg);

    const userRes = await fetch(`${API_BASE_URL}/users/email/${user.email}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: userFormData,
    });
    if (!userRes.ok) throw new Error("User update failed");

    // 2. Update Vendor
    const vendorFormData = new FormData();
    vendorFormData.append(
      "phone_number",
      document.getElementById("number").value.trim(),
    );
    vendorFormData.append(
      "opening_time",
      document.getElementById("openingTime").value,
    );
    vendorFormData.append(
      "closing_time",
      document.getElementById("closingTime").value,
    );
    const shopImg = document.getElementById("image").files[0];
    if (shopImg) vendorFormData.append("image", shopImg);

    const vendorRes = await fetch(`${API_BASE_URL}/vendors`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: vendorFormData,
    });
    if (!vendorRes.ok) throw new Error("Vendor update failed");

    // 3. Add New Food Items
    const foodType = document.getElementById("foodType").value;
    for (const item of menuItems) {
      const foodFormData = new FormData();
      foodFormData.append("food_name", item.name);
      foodFormData.append("category", foodType || "general");
      foodFormData.append("latitude", selectedLat || 0);
      foodFormData.append("longitude", selectedLng || 0);
      foodFormData.append("vendor_id", vendor.vendor_id);
      foodFormData.append("image", item.file);

      await fetch(`${API_BASE_URL}/foods`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: foodFormData,
      });
    }

    alert("Updates successful!");
    window.location.href = "./vendor-profile.html";
  } catch (error) {
    console.error("Submit failed:", error);
    alert(error.message);
  } finally {
    submitBtn.innerText = "Submit";
    submitBtn.disabled = false;
  }
}
