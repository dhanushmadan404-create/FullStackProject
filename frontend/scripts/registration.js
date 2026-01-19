// Redundant API_URL removed - using centralized api-helper.js
const token = localStorage.getItem("token");
const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");

// ---------------- MENU LIST ----------------
const ul = document.getElementById("list_container");
const input = document.getElementById("menuName");
const imageInput = document.getElementById("menuImage");
const menuError = document.getElementById("menuError");

function addMenuItem() {
  const name = input?.value.trim();
  const file = imageInput?.files?.[0];

  menuError.textContent = "";

  if (!name) {
    menuError.textContent = "Please enter a menu item name.";
    return;
  }
  if (!file) {
    menuError.textContent = "Please select an image.";
    return;
  }

  const list = document.createElement("li");

  // ✅ Method 1 → store FILE
  list.imageFile = file;

  const imgTag = `
    <img src="${URL.createObjectURL(file)}"
         class="menu_image"
         width="50"
         style="margin-left:10px; object-fit: cover;">
  `;

  list.innerHTML = `*${name} ${imgTag}
    <button type="button" onclick="removeItem(event)">Delete</button>`;

  ul.appendChild(list);

  input.value = "";
  imageInput.value = "";
}

function removeItem(e) {
  e.target.parentElement.remove();
}

// ---------------- MAP OPEN / CLOSE ----------------
const mapCon = document.getElementById("mapContainer");

document.querySelector(".location-group")?.addEventListener("click", () => {
  mapCon.style.display = "block";
});
document.getElementById("back")?.addEventListener("click", () => {
  mapCon.style.display = "none";
});
document.getElementById("save")?.addEventListener("click", () => {
  mapCon.style.display = "none";
});

// ---------------- MAP INIT ----------------
const map = L.map("map").setView([13.0827, 80.2707], 11);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20
}).addTo(map);

const foodIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40]
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

// ---------------- CURRENT LOCATION ----------------
document.getElementById("location")?.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;
    map.setView([latitude, longitude], 15);
    if (marker) map.removeLayer(marker);
    marker = L.marker([latitude, longitude], { icon: foodIcon }).addTo(map);
  });
});

// ---------------- VENDOR REGISTRATION ----------------
document.getElementById("vendorRegistration")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  let hasError = false;

  document.querySelectorAll(".error-message")
    .forEach(span => (span.textContent = ""));

  // --- Food Type ---
  const foodType = document.getElementById("foodType");
  if (!foodType?.value) {
    document.getElementById("foodTypeError").textContent = "Select food type";
    hasError = true;
  }

  // --- Phone ---
  const phone = document.getElementById("number");
  if (!phone?.value || !/^\d{10}$/.test(phone.value)) {
    document.getElementById("numberError").textContent =
      "Enter a valid 10-digit phone number";
    hasError = true;
  }

  // --- Vendor Image ---
  const image = document.getElementById("image");
  if (!image?.files?.length) {
    document.getElementById("imageError").textContent = "Upload an image";
    hasError = true;
  }

  // --- Menu ---
  if (!ul || ul.children.length === 0) {
    menuError.textContent = "Add at least one menu item";
    hasError = true;
  }

  // --- Location ---
  if (latitude === null || longitude === null) {
    document.getElementById("locationError").textContent =
      "Select shop location";
    hasError = true;
  }

  // --- Time ---
  const openingTime = document.getElementById("openingTime");
  const closingTime = document.getElementById("closingTime");

  if (!openingTime?.value) {
    document.getElementById("openingTimeError").textContent =
      "Select opening time";
    hasError = true;
  }
  if (!closingTime?.value) {
    document.getElementById("closingTimeError").textContent =
      "Select closing time";
    hasError = true;
  }

  if (hasError) return;

  // -------- VENDOR UPLOAD (Method 1) --------
  const vendorForm = new FormData();
  vendorForm.append("phone_number", phone.value);
  vendorForm.append("opening_time", openingTime.value);
  vendorForm.append("closing_time", closingTime.value);
  vendorForm.append("user_id", vendor.user_id);
  vendorForm.append("image", image.files[0]); // ✅ FILE

  let data;
  try {
    const res = await fetch(`${API_URL}/vendors`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: vendorForm
    });
    data = await res.json();
  } catch (err) {
    alert("Vendor details upload failed ❌");
    return;
  }


  // -------- MENU ITEMS UPLOAD (Method 1) --------
  try {
    for (let li of ul.children) {
      const foodForm = new FormData();

      foodForm.append(
        "food_name",
        li.textContent.replace("Delete", "").trim()
      );
      foodForm.append("category", foodType.value.toLowerCase());
      foodForm.append("latitude", latitude);
      foodForm.append("longitude", longitude);
      foodForm.append("vendor_id", data.vendor_id);
      foodForm.append("image", li.imageFile); // ✅ FILE

      await fetch(`${API_URL}/foods`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: foodForm
      });
    }

    alert("Vendor registration successful ✅");
    location.href = "./vendor-profile.html";
  } catch (err) {
    alert("Upload failed ❌");
    console.error(err);
  }
});
