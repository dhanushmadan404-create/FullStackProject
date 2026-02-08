// --- Global Variables ---
let menuItems = [];
const token = localStorage.getItem("token");
let marker = null;
let selectedLat = null;
let selectedLng = null;

// --- Map Initialization ---
const map = L.map("map").setView([13.0827, 80.2707], 11); // Default to Chennai
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Custom Icon
const foodIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Map Click Event
map.on("click", (e) => {
  // Remove existing marker if any
  if (marker) {
    map.removeLayer(marker);
  }

  // Add new marker
  marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: foodIcon }).addTo(map);

  // Save coordinates
  selectedLat = e.latlng.lat;
  selectedLng = e.latlng.lng;
});

// --- Map UI Controls ---
const mapContainer = document.getElementById("mapContainer");
const locationIconBtn = document.querySelector(".location-icon");

// Show Map
if (locationIconBtn) {
  locationIconBtn.addEventListener("click", () => {
    mapContainer.style.display = "block";
    // Fix map rendering issue when hidden
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  });
}

// Hide Map (Back/Save buttons)
document.getElementById("back").addEventListener("click", () => {
  mapContainer.style.display = "none";
});

document.getElementById("save").addEventListener("click", () => {
  if (!selectedLat || !selectedLng) {
    alert("Please select a location on the map first!");
    return;
  }
  mapContainer.style.display = "none";

  // Show selected status (optional UI feedback)
  const locText = document.querySelector(".location-icon");
  if (locText) locText.innerHTML = "Location Selected ✅";
});

// Current Location Button
document.getElementById("location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Center map
      map.setView([lat, lng], 15);

      // Add marker
      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng], { icon: foodIcon }).addTo(map);

      selectedLat = lat;
      selectedLng = lng;
    },
    () => {
      alert("Unable to retrieve your location");
    }
  );
});


// --- Menu Management ---

function addMenuItem() {
  const nameInput = document.getElementById("menuName");
  const imageInput = document.getElementById("menuImage");
  const name = nameInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!name) return alert("Please enter a food name");
  if (!imageFile) return alert("Please select a food image");

  // Add to list
  menuItems.push({
    name: name,
    image: imageFile,
  });

  // Update UI
  renderMenu();

  // Clear inputs
  nameInput.value = "";
  imageInput.value = "";
}

function renderMenu() {
  const list = document.getElementById("list_container");
  list.innerHTML = ""; // Clear current list

  // Loop through items and display them
  menuItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
            ${item.name} 
            <button type="button" onclick="removeMenuItem(${index})" style="margin-left:10px; cursor:pointer;">❌</button>
        `;
    list.appendChild(li);
  });
}

function removeMenuItem(index) {
  menuItems.splice(index, 1); // Remove item at index
  renderMenu(); // Re-render list
}


// --- Form Submission ---

const form = document.getElementById("vendorRegistration");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Validation
    if (!token) return alert("You must be logged in to register as a vendor.");
    if (!selectedLat || !selectedLng) return alert("Please select your shop location on the map.");
    if (menuItems.length === 0) return alert("Please add at least one item to your menu.");

    const phone = document.getElementById("number").value;
    const opening = document.getElementById("openingTime").value;
    const closing = document.getElementById("closingTime").value;
    const foodType = document.getElementById("foodType").value;
    const shopImage = document.getElementById("image").files[0];

    if (!foodType) return alert("Please select a food type.");

    try {
      // 2. Register Vendor
      const vendorFormData = new FormData();
      vendorFormData.append("phone_number", phone);
      vendorFormData.append("opening_time", opening);
      vendorFormData.append("closing_time", closing);
      vendorFormData.append("image", shopImage);

      // fetchAPI handles FormData automatically
      const vendorResponse = await fetchAPI("/vendors", {
        method: "POST",
        body: vendorFormData,
      });

      const vendorId = vendorResponse.vendor_id;
      console.log("Vendor created, ID:", vendorId);

      // 3. Upload Menu Items (One by one)
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        const foodFormData = new FormData();

        foodFormData.append("food_name", item.name);
        foodFormData.append("category", foodType.toLowerCase()); // e.g., "lunch"
        foodFormData.append("latitude", selectedLat);
        foodFormData.append("longitude", selectedLng);
        foodFormData.append("vendor_id", vendorId);
        foodFormData.append("image", item.image);

        try {
          await fetchAPI("/foods", {
            method: "POST",
            body: foodFormData,
          });
        } catch (foodError) {
          console.error("Error uploading food:", item.name, foodError);
          alert(`Failed to upload ${item.name}. You can add it later.`);
        }
      }

      alert("Registration Successful! Redirecting to profile...");
      window.location.href = "./vendor-profile.html";

    } catch (error) {
      console.error("Registration Error:", error);
      alert(`Registration failed: ${error.message}`);
    }
  });
}
