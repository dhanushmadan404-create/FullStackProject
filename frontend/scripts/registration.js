
// ---------------- GLOBAL VARIABLES ----------------
let menuItems = [];
const token = localStorage.getItem("token");
let marker = null;
let selectedLat = null;
let selectedLng = null;

// ---------------- MAP INITIALIZATION ----------------
const mapElement = document.getElementById("map");

let map = null;

if (mapElement) {
  map = L.map("map").setView([13.0827, 80.2707], 11);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);
}

// Custom Icon
const foodIcon = L.icon({
  iconUrl: "/frontend/assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Map Click Event
if (map) {
  map.on("click", (e) => {
    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: foodIcon }).addTo(
      map,
    );

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    console.log("Selected Location:", selectedLat, selectedLng);
  });
}

// ---------------- MAP UI CONTROLS ----------------
const mapContainer = document.getElementById("mapContainer");
const locationIconBtn = document.querySelector(".location-icon");

if (locationIconBtn && mapContainer && map) {
  locationIconBtn.addEventListener("click", () => {
    mapContainer.style.display = "block";

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  });
}

const backBtn = document.getElementById("back");
if (backBtn && mapContainer) {
  backBtn.addEventListener("click", () => {
    mapContainer.style.display = "none";
  });
}

const saveBtn = document.getElementById("save");
if (saveBtn && mapContainer) {
  saveBtn.addEventListener("click", () => {
    if (!selectedLat || !selectedLng) {
      console.log("Please select a location on the map first");
      return;
    }

    mapContainer.style.display = "none";

    if (locationIconBtn) {
      locationIconBtn.innerHTML = "Location Selected ✅";
    }
  });
}

// ---------------- CURRENT LOCATION BUTTON ----------------
const currentLocBtn = document.getElementById("location");

if (currentLocBtn && map) {
  currentLocBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map.setView([lat, lng], 15);

        if (marker) map.removeLayer(marker);

        marker = L.marker([lat, lng], { icon: foodIcon }).addTo(map);

        selectedLat = lat;
        selectedLng = lng;

        console.log("Current Location Selected:", lat, lng);
      },
      (error) => {
        console.log("Unable to retrieve location:", error.message);
      },
    );
  });
}

// ---------------- MENU MANAGEMENT ----------------
function addMenuItem() {
  const nameInput = document.getElementById("menuName");
  const imageInput = document.getElementById("menuImage");

  if (!nameInput || !imageInput) return;

  const name = nameInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!name) {
    console.log("Please enter a food name");
    return;
  }

  if (!imageFile) {
    console.log("Please select a food image");
    return;
  }

  menuItems.push({
    name: name,
    image: imageFile,
  });

  renderMenu();

  nameInput.value = "";
  imageInput.value = "";
}

function renderMenu() {
  const list = document.getElementById("list_container");
  if (!list) return;

  list.innerHTML = "";

  menuItems.forEach((item, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${item.name}
      <button type="button"
              onclick="removeMenuItem(${index})"
              style="margin-left:10px; cursor:pointer;">
        ❌
      </button>
    `;

    list.appendChild(li);
  });
}

function removeMenuItem(index) {
  menuItems.splice(index, 1);
  renderMenu();
}

// ---------------- FORM SUBMISSION ----------------
const form = document.getElementById("vendorRegistration");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) {
      console.log("User must be logged in");
      return;
    }

    if (!selectedLat || !selectedLng) {
      console.log("Please select shop location");
      return;
    }

    if (menuItems.length === 0) {
      console.log("Add at least one menu item");
      return;
    }

    const phone = document.getElementById("number")?.value;
    const opening = document.getElementById("openingTime")?.value;
    const closing = document.getElementById("closingTime")?.value;
    const foodType = document.getElementById("foodType")?.value;
    const shopImage = document.getElementById("image")?.files[0];

    const ErrorFoodType = document.getElementById("foodTypeError")
    if (!foodType) {

      ErrorFoodType.textContent = "Please select food type";
      return;
    }

    const submitBtn = document.getElementById("submit");

    try {
      // Disable button and show loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";
      }

      // ---------- REGISTER VENDOR ----------
      const vendorFormData = new FormData();
      vendorFormData.append("phone_number", phone);
      vendorFormData.append("opening_time", opening);
      vendorFormData.append("closing_time", closing);
      vendorFormData.append("image", shopImage);

      let vendorId = null;

      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: vendorFormData,
      });

      if (response.ok) {
        const vendorData = await response.json();
        vendorId = vendorData.vendor_id;
        console.log("Vendor created:", vendorId);
      } else {
        const errorData = await response.json().catch(() => ({}));

        // If vendor already exists, try to fetch the existing one
        if (response.status === 400 && errorData.detail === "Vendor already exists") {
          console.log("Vendor already exists, fetching existing ID...");
          const meRes = await fetch(`${API_BASE_URL}/vendors/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            vendorId = meData.vendor_id;
            console.log("Existing vendor found:", vendorId);
          } else {
            throw new Error("Could not retrieve existing vendor info");
          }
        } else {
          throw new Error(errorData.detail || "Vendor registration failed");
        }
      }

      localStorage.setItem("vendorId", vendorId);

      // ---------- UPLOAD FOOD ITEMS ----------
      let successCount = 0;
      for (let item of menuItems) {
        const foodFormData = new FormData();
        foodFormData.append("food_name", item.name);
        foodFormData.append("category", foodType.toLowerCase());
        foodFormData.append("latitude", selectedLat);
        foodFormData.append("longitude", selectedLng);
        foodFormData.append("vendor_id", vendorId);
        foodFormData.append("image", item.image);

        const foodResponse = await fetch(`${API_BASE_URL}/foods`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: foodFormData,
        });

        if (foodResponse.ok) {
          successCount++;
        } else {
          console.error("Failed to upload:", item.name);
        }
      }

      Toastify({
        text: `Registration Successful! Uploaded ${successCount}/${menuItems.length} items.`,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "green" },
      }).showToast();

      setTimeout(() => {
        window.location.href = "./vendor-profile.html";
      }, 1500);

    } catch (error) {
      console.error("Registration Error:", error.message);
      Toastify({
        text: `Error: ${error.message}`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
      }).showToast();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    }
  });
}
