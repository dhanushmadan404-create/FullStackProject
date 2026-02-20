// ---------------- API BASE URL ----------------
if (typeof API_BASE_URL === "undefined") {
  window.API_BASE_URL =
    window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000/api"
      : "/api";
}
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
      profile_image.innerHTML = `<img src="${getImageUrl(user.image_url)}" class="card-image" onerror="this.onerror=null; this.src='../assets/default_vendor.png';"/>`;
    }
    if (vendorName) {
      vendorName.innerHTML = `
        <h2>${user.name}</h2>
        <p>${user.email}</p>
      `;
    }

    // Fetch vendor info from backend
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
                 onerror="this.onerror=null; this.src='../assets/default_food.png';"
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
// Logout
// -----------------------------
function logout() {
  localStorage.clear();
  location.href = "./login.html";
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
            onerror="this.onerror=null; this.src='../assets/default_user.png';"
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


// add food logic

const postFoodBtn = document.getElementById("postFood");
const addFoodContainer = document.getElementById("addFood");

postFoodBtn.addEventListener("click", () => {
  addFoodContainer.innerHTML = `
    <div class="food-form">
      <h3>Add Food Items</h3>

      <input type="text" id="foodCategory" placeholder="Enter category (veg/non-veg)" />

      <div class="menu">
        <input type="text" id="menuName" placeholder="Enter menu item" />
        <input type="file" id="menuImage" accept="image/*" />
        <button type="button" onclick="addMenuItem()">Add</button>
      </div>

      <ul id="list_container"></ul>

      <button id="submitFood">Submit Food</button>
    </div>
  `;

  document
    .getElementById("submitFood")
    .addEventListener("click", uploadFoodItems);
});


// -----------------------------
// Menu Management (Local)
// -----------------------------
window.addMenuItem = function () {
  const nameInput = document.getElementById("menuName");
  const imageInput = document.getElementById("menuImage");

  if (!nameInput || !imageInput) return;

  const name = nameInput.value.trim();
  const imageFile = imageInput.files[0];

  if (!name || !imageFile) {
    alert("Please enter food name and select image");
    return;
  }

  menuItems.push({
    name: name,
    image: imageFile,
  });

  renderLocalMenu();

  nameInput.value = "";
  imageInput.value = "";
}

function renderLocalMenu() {
  const list = document.getElementById("list_container");
  if (!list) return;

  list.innerHTML = "";

  menuItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name}
      <button type="button" onclick="removeMenuItem(${index})" style="margin-left:10px; cursor:pointer;">❌</button>
    `;
    list.appendChild(li);
  });
}

window.removeMenuItem = function (index) {
  menuItems.splice(index, 1);
  renderLocalMenu();
}


async function uploadFoodItems() {
  const vendorId = localStorage.getItem("vendorId");
  const token = localStorage.getItem("token");
  const category = document.getElementById("foodCategory").value;

  if (!vendorId) {
    alert("Vendor not logged in");
    return;
  }

  if (menuItems.length === 0) {
    alert("Add at least one food item");
    return;
  }

  try {
    for (let item of menuItems) {
      const formData = new FormData();

      formData.append("food_name", item.name);
      formData.append("category", category.toLowerCase());
      formData.append("vendor_id", vendorId);
      formData.append("image", item.image);

      const response = await fetch(`${API_BASE_URL}/foods`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.log("Failed:", item.name);
      }
    }

    alert("Food added successfully");
    menuItems = [];
    renderLocalMenu();
    document.getElementById("addFood").innerHTML = "";

  } catch (error) {
    console.log("Upload error:", error);
  }
}


