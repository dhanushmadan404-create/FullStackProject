const API_URL = window.API_BASE_URL;

const token = localStorage.getItem("token");
const editBtn = document.getElementById("editBtn");
const editContainer = document.getElementById("edit");
const profile_image = document.getElementById("DB");
const vendorName = document.getElementById("vendor_details");
const TimeStatus = document.getElementById("timeStatus");
const food_container = document.getElementById("food_container");
const reviews_container = document.getElementById("reviews_container");

let menuItems = [];

document.addEventListener("DOMContentLoaded", loadProfile);

// ---------------- LOAD PROFILE ----------------
async function loadProfile() {
  profile_image.innerHTML = "<p>Loading profile...</p>"
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("User ID not found. Please login again.");
      logout();
      return;
    }

    // Fetch user info first
    const res = await fetch(`${API_URL}/users/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user data");

    const user = await res.json();
    console.log("User Data:", user);

    // Save to localStorage for edit form prefill
    localStorage.setItem("user_details", JSON.stringify(user));

    // Render profile image + name/email
    if (profile_image) {
      profile_image.innerHTML = `<img src="${getImageUrl(user.image_url)}" class="card-image" onerror="this.onerror=null; this.src='/frontend/assets/default_vendor.png';"/>`;
    }
    if (vendorName) {
      vendorName.innerHTML = `
        <h2>${user.name}</h2>
        <p>${user.email}</p>
        <p>${user.phone}</p>
      `;
    }

    // Fetch vendor info from backend
    food_container.innerHTML = "<p>Loading foods...</p>"
    const vendorDocRes = await fetch(`${API_URL}/vendors/user/${userId}`);
    if (!vendorDocRes.ok) throw new Error("Failed to fetch vendor data");

    const vendorDoc = await vendorDocRes.json();
    console.log("Vendor Data:", vendorDoc);
    localStorage.setItem("vendorId", vendorDoc.vendor_id);

    if (TimeStatus) {
      TimeStatus.innerHTML = `${vendorDoc.opening_time || "N/A"} - ${vendorDoc.closing_time || "N/A"}`;
    }

    // Fetch foods
    const foodRes = await fetch(`${API_URL}/foods/vendor/${vendorDoc.vendor_id}`);
    if (!foodRes.ok) throw new Error("Failed to fetch foods");

    const foods = await foodRes.json();
    console.log("Foods:", foods);

    if (food_container) {
      food_container.innerHTML = ""; // Clear existing
      if (Array.isArray(foods)) {
        foods.forEach(food => {
          const div = document.createElement("div");
          div.id = `food-${food.food_id}`;
          div.classList.add("review-card");
          div.innerHTML = `
            <img src="${getImageUrl(food.food_image_url)}" class="card-image"
                 onerror="this.onerror=null; this.src='/frontend/assets/default_food.png';"
            />
            <div class="card-info">
              <p><strong>${food.food_name}</strong></p>
              <p>${food.category}</p>
              <button onclick="deleteFood(${food.food_id})" style="background:red;color:white;border:none;padding:5px;cursor:pointer;">
                Remove
              </button>
            </div>
          `;
          food_container.appendChild(div);
        });
      }
    }

  } catch (e) {
    console.error(e);
    Toastify({
      text: "Failed to load vendor profile ❌",
      duration: 4000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
    }).showToast();
  }
}


// -----------------------------
// Delete Food
// -----------------------------
async function deleteFood(foodId) {
  if (!confirm("Are you sure you want to remove this item?")) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/foods/${foodId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      Toastify({
        text: "Food removed ✅",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "green" },
      }).showToast();

      const el = document.getElementById(`food-${foodId}`);
      if (el) el.remove();
    } else {
      Toastify({
        text: "Failed to delete food ❌",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
      }).showToast();
    }
  } catch (err) {
    console.error(err);
    Toastify({
      text: "Error deleting food ❌",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
    }).showToast();
  }
}

// ---------------- EDIT PROFILE SETUP ----------------
editBtn.addEventListener("click", async () => {

  if (!editBtn) return;
  const userId = localStorage.getItem("user_id");

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    const user = await response.json();
    const previewImg = getImageUrl(user.image_url);

    editContainer.innerHTML = `
      <form id="editForm">
        <div>
          <label>Name</label>
          <input type="text" id="name" 
                 value="${user.name || ""}" 
                 minlength="3" required />
        </div>

        <div>
          <label>Profile Image</label>
          <input id="image" type="file" accept="image/*" />
          <img 
            src="${previewImg}" 
            id="preview"
            onerror="this.onerror=null; this.src='/frontend/assets/default_user.png';"
          />
        </div>

        <button type="submit">Update Profile</button>
      </form>
    `;

    document.getElementById("image").addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("preview").src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

    document
      .getElementById("editForm")
      .addEventListener("submit", handleEditSubmit);

  } catch (error) {
    console.log(error);
  }
});

// ---------------- HANDLE EDIT SUBMIT ----------------
async function handleEditSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const imageFile = document.getElementById("image").files[0];
  const user = JSON.parse(localStorage.getItem("user_details") || "{}");

  if (!user.email) {
    Toastify({
      text: `User email missing`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();
    return;
  }

  try {
    const formData = new FormData();
    if (name) formData.append("name", name);
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/users/email/${user.email}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Update failed");
    }

    const updatedUser = await response.json();

    localStorage.setItem("user_details", JSON.stringify(updatedUser));

    console.log("Profile updated successfully");

    loadProfile(); // refresh UI
    document.getElementById("edit").innerHTML = "";
  } catch (error) {
    Toastify({
      text: `Update failed:${error.message}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();
  }
}
let menu = [];
let selectedLat = null;
let selectedLng = null;
let map = null;
let marker = null;

const postFoodBtn = document.getElementById("postFood");
const addFoodContainer = document.getElementById("addFood");


// -----------------------------
// OPEN FORM
// -----------------------------
postFoodBtn.addEventListener("click", () => {

  addFoodContainer.style.visibility = "visible";

  addFoodContainer.innerHTML = `
    <div class="food-form">

      <button type="button" id="closeFoodForm" class="close-btn">Close</button>

      <h3>Add Food Items</h3>

      <!-- Food Type -->
      <div class="form-group">
        <label>Food Type:</label>
        <select id="foodType">
          <option value="">Select food type</option>
          <option value="breakfast">Breakfast</option>
          <option value="drinking">Drinking</option>
          <option value="dinner">Dinner</option>
          <option value="lunch">Lunch</option>
          <option value="snacks">Snacks</option>
        </select>
        <span class="error-message" id="foodTypeError"></span>
      </div>

      <!-- Menu Add -->
      <div class="menu">
        <input type="text" id="menuName" placeholder="Enter menu item" />
        <input type="file" id="menuImage" accept="image/*" />
        <button type="button" id="addMenuBtn">Add</button>
      </div>

      <ul id="list_container"></ul>

      <!-- Map Section -->
      <div class="form-group">
        <label>Shop Location:</label>
        <button type="button" id="currentLocationBtn">Use Current Location</button>
        <div id="map" style="height:300px; margin-top:10px; border-radius:10px;"></div>
        <span class="error-message" id="locationError"></span>
      </div>

      <button id="submitFood">Submit Food</button>
    </div>
  `;

  initializeMap();

  // Event Listeners
  document.getElementById("closeFoodForm").addEventListener("click", closeForm);
  document.getElementById("addMenuBtn").addEventListener("click", addMenuItem);
  document.getElementById("submitFood").addEventListener("click", uploadFoodItems);
  document.getElementById("currentLocationBtn").addEventListener("click", getCurrentLocation);
});


// -----------------------------
// CLOSE FORM
// -----------------------------
function closeForm() {
  addFoodContainer.style.visibility = "hidden";
  addFoodContainer.innerHTML = "";
  menu = [];
  selectedLat = null;
  selectedLng = null;
  if (map) {
    map.remove();
    map = null;
  }
}


// -----------------------------
// MENU MANAGEMENT
// -----------------------------
function addMenuItem() {
  const nameInput = document.getElementById("menuName");
  const imageInput = document.getElementById("menuImage");

  const name = nameInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!name || !imageFile) {
    alert("Please enter food name and select image");
    return;
  }

  menu.push({ name, image: imageFile });

  renderLocalMenu();

  nameInput.value = "";
  imageInput.value = "";
}

function renderLocalMenu() {
  const list = document.getElementById("list_container");
  list.innerHTML = "";

  menu.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name}
      <button type="button" data-index="${index}" class="remove-btn">❌</button>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      removeMenuItem(index);
    });
  });
}

function removeMenuItem(index) {
  menu.splice(index, 1);
  renderLocalMenu();
}


// -----------------------------
// MAP FUNCTION
// -----------------------------
function initializeMap() {

  if (map) {
    map.remove();
  }

  map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  map.on("click", function (e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([selectedLat, selectedLng]).addTo(map);

    document.getElementById("locationError").textContent = "";
  });
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {

      selectedLat = position.coords.latitude;
      selectedLng = position.coords.longitude;

      map.setView([selectedLat, selectedLng], 15);

      if (marker) {
        map.removeLayer(marker);
      }

      marker = L.marker([selectedLat, selectedLng]).addTo(map);

    });
  } else {
    alert("Geolocation not supported");
  }
}


// -----------------------------
// UPLOAD FUNCTION
// -----------------------------
async function uploadFoodItems() {

  const foodType = document.getElementById("foodType").value;

  if (!foodType) {
    document.getElementById("foodTypeError").textContent =
      "Please select food type";
    return;
  } else {
    document.getElementById("foodTypeError").textContent = "";
  }

  if (!selectedLat || !selectedLng) {
    document.getElementById("locationError").textContent =
      "Please select shop location on map";
    return;
  }

  if (menu.length === 0) {
    alert("Please add at least one menu item");
    return;
  }

  const vendorId = localStorage.getItem("vendorId");
  if (!vendorId) {
    alert("Vendor ID not found. Please reload the page.");
    return;
  }

  const authToken = localStorage.getItem("token");
  if (!authToken) {
    alert("You must be logged in to add food.");
    return;
  }

  try {

    for (let item of menu) {

      const formData = new FormData();
      formData.append("food_name", item.name);
      formData.append("image", item.image);      // backend expects field name "image"
      formData.append("category", foodType);
      formData.append("latitude", selectedLat);
      formData.append("longitude", selectedLng);
      formData.append("vendor_id", vendorId);    // required by backend

      const res = await fetch(`${API_URL}/foods`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
    }

    alert("Food items uploaded successfully!");

    closeForm();  // Proper reset

  } catch (error) {
    console.error("Upload failed:", error);
    alert("Something went wrong while uploading.");
  }
}