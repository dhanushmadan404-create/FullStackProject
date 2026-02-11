// --- Main Execution ---
document.addEventListener("DOMContentLoaded", async () => {
  // Check Auth
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "./login.html";
    return;
  }

  try {
    await loadVendorProfile();
  } catch (error) {
    console.error("Vendor Profile Error:", error);
    if (error.message.includes("401")) {
      localStorage.clear();
      window.location.href = "./login.html";
    }
  }
});


// --- Load Vendor Profile ---
async function loadVendorProfile() {
  // 1. Get User Info
  // 1. Get User Info
  const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!userResponse.ok) throw new Error(userResponse.status === 401 ? "401" : "Failed to load user");
  const user = await userResponse.json();

  // Render User Header
  const profileImg = document.getElementById("DB");
  const vendorDetails = document.getElementById("vendor_details");
  const imgUrl = getImageUrl(user.image_url);

  profileImg.innerHTML = `<img src="${imgUrl}" class="card-image"/>`;
  vendorDetails.innerHTML = `
        <h2>${user.name}</h2>
        <p>${user.email}</p>
    `;

  // 2. Get Vendor Info
  const userId = user.user_id;
  // We expect this to return vendor details if they exist
  // We expect this to return vendor details if they exist
  const vendorResponse = await fetch(`${API_BASE_URL}/vendors/user/${userId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  // If 404, valid logic (no vendor profile), else throw
  let vendorData = null;
  if (vendorResponse.ok) {
    vendorData = await vendorResponse.json();
  } else if (vendorResponse.status !== 404) {
    console.error("Vendor fetch failed", vendorResponse.status);
  }

  const timeStatus = document.getElementById("timeStatus");

  if (vendorData && vendorData.vendor_id) {
    // Save vendor data
    localStorage.setItem("vendor", JSON.stringify(vendorData));
    timeStatus.textContent = `Open: ${vendorData.opening_time} - ${vendorData.closing_time}`;

    // 3. Load Food Items
    loadFoodItems(vendorData.vendor_id);
  } else {
    timeStatus.textContent = "Vendor profile not found.";
  }
}


// --- Load Food Items ---
async function loadFoodItems(vendorId) {
  const container = document.getElementById("food_container");
  container.innerHTML = "<p>Loading foods...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/foods/vendor/${vendorId}`);

    if (!response.ok) throw new Error("Failed to load foods");

    const foods = await response.json();
    container.innerHTML = ""; // Clear loading text

    if (foods.length === 0) {
      container.innerHTML = "<p>No food items added yet.</p>";
      return;
    }

    // Render each food item
    foods.forEach(food => {
      const foodCard = document.createElement("div");
      foodCard.classList.add("review-card");
      foodCard.id = `food-${food.food_id}`;

      const foodImg = getImageUrl(food.food_image_url);

      foodCard.innerHTML = `
                <img src="${foodImg}" class="card-image"
                     onerror="this.onerror=null; this.src='../assets/default_vendor.png';"/>
                <div class="card-info">
                    <p><strong>${food.food_name}</strong></p>
                    <p>${food.category}</p>
                    <button onclick="deleteFoodItem(${food.food_id})" 
                        style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; margin-top:5px;">
                        Remove
                    </button>
                </div>
            `;
      container.appendChild(foodCard);
    });

  } catch (error) {
    console.error("Error loading foods:", error);
    container.innerHTML = "<p>Error loading food items.</p>";
  }
}


// --- Delete Food Item ---
async function deleteFoodItem(foodId) {
  if (!confirm("Are you sure you want to delete this food item?")) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/foods/${foodId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to delete food");

    // Remove from UI
    const element = document.getElementById(`food-${foodId}`);
    if (element) element.remove();

    alert("Food item deleted successfully ✅");

  } catch (error) {
    console.error("Delete failed:", error);
    alert(`Failed to delete food: ${error.message}`);
  }
}


// --- Logout Helper ---
function logout() {
  localStorage.clear();
  window.location.href = "./login.html";
}
