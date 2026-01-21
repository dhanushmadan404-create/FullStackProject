// Using centralized api-helper.js for API_URL and fetchAPI

let menuItems = [];
const token = localStorage.getItem("token");

// ---------------- MAP INIT ----------------
const map = L.map("map").setView([13.0827, 80.2707], 11);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

const foodIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

let marker = null;
let latitude = null;
let longitude = null;

map.on("click", (e) => {
  if (marker) map.removeLayer(marker);
  marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: foodIcon }).addTo(map);
  latitude = e.latlng.lat;
  longitude = e.latlng.lng;
});

// Location helper
const locIconBtn = document.querySelector(".location-icon");
const mapContainer = document.getElementById("mapContainer");
if (locIconBtn) {
  locIconBtn.addEventListener("click", () => {
    mapContainer.style.display = "block";
    setTimeout(() => map.invalidateSize(), 100);
  });
}

document.getElementById("back").addEventListener("click", () => {
  mapContainer.style.display = "none";
});
document.getElementById("save").addEventListener("click", () => {
  mapContainer.style.display = "none";
});

document.getElementById("location").addEventListener("click", () => {
  if (!navigator.geolocation) return alert("No geolocation supported");
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    map.setView([lat, lon], 15);
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon], { icon: foodIcon }).addTo(map);
    latitude = lat;
    longitude = lon;
  });
});

// ---------------- MENU HANDLING ----------------
function addMenuItem() {
  const nameInput = document.getElementById("menuName");
  const imageInput = document.getElementById("menuImage");

  if (!nameInput.value.trim()) return alert("Enter food name");
  if (!imageInput.files[0]) return alert("Select food image");

  menuItems.push({
    name: nameInput.value.trim(),
    image: imageInput.files[0]
  });

  renderMenu();
  nameInput.value = "";
  imageInput.value = "";
}

function renderMenu() {
  const list = document.getElementById("list_container");
  list.innerHTML = "";
  menuItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} <button type="button" onclick="removeMenuItem(${index})">❌</button>`;
    list.appendChild(li);
  });
}

function removeMenuItem(index) {
  menuItems.splice(index, 1);
  renderMenu();
}

// ---------------- SUBMIT ----------------
const registrationForm = document.getElementById("vendorRegistration");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!token) return alert("Log in first");
    if (!latitude || !longitude) return alert("Select shop location on map");

    const phone = document.getElementById("number").value;
    const openTime = document.getElementById("openingTime").value;
    const closeTime = document.getElementById("closingTime").value;
    const shopImage = document.getElementById("image").files[0];
    const foodType = document.getElementById("foodType").value;

    if (!foodType) return alert("Select food type");
    if (menuItems.length === 0) return alert("Add at least one food item");

    try {
      // 1. Create Vendor
      console.log("Creating vendor profile...");
      const vendorFD = new FormData();
      vendorFD.append("phone_number", phone);
      vendorFD.append("opening_time", openTime);
      vendorFD.append("closing_time", closeTime);
      vendorFD.append("image", shopImage);

      const vendor = await fetchAPI("/vendors", {
        method: "POST",
        body: vendorFD
      });

      console.log("Vendor created:", vendor);

      // 2. Add Food Items
      console.log(`Uploading ${menuItems.length} food items...`);
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        try {
          const foodFD = new FormData();
          foodFD.append("food_name", item.name);
          foodFD.append("category", foodType.toLowerCase());
          foodFD.append("latitude", latitude);
          foodFD.append("longitude", longitude);
          foodFD.append("vendor_id", vendor.vendor_id);
          foodFD.append("image", item.image);

          await fetchAPI("/foods", {
            method: "POST",
            body: foodFD
          });
          console.log(`Food item ${i + 1}/${menuItems.length} uploaded: ${item.name}`);
        } catch (itemErr) {
          console.error(`Failed to upload food item ${item.name}:`, itemErr);
          alert(`Warning: Failed to upload "${item.name}". You can add it later from your profile. Error: ${itemErr.message}`);
        }
      }

      alert("Registration Successful! ✅ All items uploaded.");
      window.location.href = "./vendor-profile.html";

    } catch (err) {
      console.error("Registration failed:", err);
      alert("Registration failed ❌: " + err.message);
    }
  });
}
