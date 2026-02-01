// ---------------- AUTH ----------------
const token = localStorage.getItem("token");
const vendorStr = localStorage.getItem("vendor");
const vendorId = vendorStr ? JSON.parse(vendorStr).vendor_id : null;

if (!token) location.href = "./login.html";
if (!vendorId) location.href = "./vendor-profile.html";

// ---------------- STATE ----------------
let currentVendorData = null;
let newMenuItems = [];

let latitude = null;
let longitude = null;
let marker = null;

// ---------------- MAP ----------------
const map = L.map("map").setView([13.0827, 80.2707], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

const foodIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

map.on("click", (e) => {
  if (marker) map.removeLayer(marker);
  marker = L.marker(e.latlng, { icon: foodIcon }).addTo(map);
  latitude = e.latlng.lat;
  longitude = e.latlng.lng;
});

// ---------------- MAP UI ----------------
const mapContainer = document.getElementById("mapContainer");

document.querySelector(".location-group").onclick = () => {
  mapContainer.style.display = "block";
  setTimeout(() => map.invalidateSize(), 100);
};

document.getElementById("back").onclick = () => {
  mapContainer.style.display = "none";
};

document.getElementById("save").onclick = () => {
  mapContainer.style.display = "none";
};

document.getElementById("location").onclick = () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    map.setView([lat, lon], 15);
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lon], { icon: foodIcon }).addTo(map);
    latitude = lat;
    longitude = lon;
  });
};

// ---------------- LOAD VENDOR DATA ----------------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentVendorData = await fetchAPI(`/vendors/${vendorId}`);

    document.getElementById("number").value =
      currentVendorData.phone_number || "";

    document.getElementById("openTime").value =
      currentVendorData.opening_time || "";

    document.getElementById("closeTime").value =
      currentVendorData.closing_time || "";

  } catch (err) {
    alert("Failed to load vendor data ❌");
    console.error(err);
  }
});

// ---------------- MENU ADD ----------------
function addMenuItem() {
  const input = document.getElementById("list");
  const value = input.value.trim();
  if (!value) return;

  newMenuItems.push(value);

  const b = document.createElement("b");
  b.innerHTML = `${value} <button type="button" onclick="removeMenuItem('${value}')">❌</button><br/>`;

  document.querySelector(".menu-list").appendChild(b);
  input.value = "";
}

function removeMenuItem(name) {
  newMenuItems = newMenuItems.filter(item => item !== name);
  renderMenu();
}

function renderMenu() {
  const menu = document.querySelector(".menu-list");
  menu.innerHTML = "";
  newMenuItems.forEach(item => {
    const b = document.createElement("b");
    b.innerHTML = `${item} <button type="button" onclick="removeMenuItem('${item}')">❌</button><br/>`;
    menu.appendChild(b);
  });
}

// ---------------- SUBMIT UPDATE ----------------
const editForm = document.getElementById("vendorEditForm");

editForm.onsubmit = async (e) => {
  e.preventDefault();

  try {
    // ---- UPDATE VENDOR ----
    const vendorFD = new FormData();
    vendorFD.append("phone_number", number.value);
    vendorFD.append("opening_time", openTime.value);
    vendorFD.append("closing_time", closeTime.value);

    await fetchAPI(`/vendors/${vendorId}`, {
      method: "PUT",
      body: vendorFD
    });

    // ---- ADD NEW FOODS ----
    if (newMenuItems.length > 0) {
      const imageFile = image.files[0];
      const foodType = document.getElementById("foodType").value;

      if (!imageFile) throw new Error("Upload image for new foods");
      if (!foodType) throw new Error("Select food type");
      if (latitude === null || longitude === null)
        throw new Error("Pick location for foods");

      for (const foodName of newMenuItems) {
        const fd = new FormData();
        fd.append("food_name", foodName);
        fd.append("category", foodType.toLowerCase());
        fd.append("latitude", latitude);
        fd.append("longitude", longitude);
        fd.append("vendor_id", vendorId);
        fd.append("image", imageFile);

        await fetchAPI("/foods", {
          method: "POST",
          body: fd
        });
      }
    }

    alert("Vendor Profile Updated Successfully ✅");
    location.href = "./vendor-profile.html";

  } catch (err) {
    alert("Update failed ❌ " + err.message);
    console.error(err);
  }
};
