// =====================================
// Vendor Profile Script
// =====================================

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found. Redirecting to login.");
    window.location.href = "./login.html";
    return;
  }

  try {
    await loadVendorProfile(token);
  } catch (error) {
    console.error("Vendor Profile Error:", error);

    if (error.message === "401") {
      console.log("Session expired. Redirecting...");
      localStorage.clear();
      window.location.href = "./login.html";
    }
  }
});

// =====================================
// Load Vendor Profile
// =====================================
async function loadVendorProfile(token) {
  // -------- Get Logged-in User --------
  const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!userResponse.ok) {
    if (userResponse.status === 401) throw new Error("401");
    throw new Error("Failed to load user");
  }

  const user = await userResponse.json();

  renderUserHeader(user);

  // -------- Get Vendor Details --------
  const vendorResponse = await fetch(
    `${API_BASE_URL}/vendors/user/${user.user_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  let vendorData = null;

  if (vendorResponse.ok) {
    vendorData = await vendorResponse.json();
  } else if (vendorResponse.status !== 404) {
    console.error("Vendor fetch failed:", vendorResponse.status);
  }

  const timeStatus = document.getElementById("timeStatus");

  if (vendorData && vendorData.vendor_id) {
    localStorage.setItem("vendor", JSON.stringify(vendorData));

    if (timeStatus) {
      timeStatus.textContent = `Open: ${vendorData.opening_time} - ${vendorData.closing_time}`;
    }

    await loadFoodItems(vendorData.vendor_id, token);
  } else {
    if (timeStatus) {
      timeStatus.textContent = "Vendor profile not found.";
    }
  }
}

// =====================================
// Render User Header
// =====================================
function renderUserHeader(user) {
  const profileImg = document.getElementById("DB");
  const vendorDetails = document.getElementById("vendor_details");

  const imgUrl = getImageUrl(user.image_url);

  if (profileImg) {
    profileImg.innerHTML = `
      <img src="${imgUrl}" class="card-image"
           onerror="this.onerror=null; this.src='../assets/default_user.png';"/>
    `;
  }

  if (vendorDetails) {
    vendorDetails.innerHTML = `
      <h2>${user.name}</h2>
      <p>${user.email}</p>
    `;
  }
}

// =====================================
// Load Food Items
// =====================================
async function loadFoodItems(vendorId, token) {
  const container = document.getElementById("food_container");
  if (!container) return;

  container.innerHTML = "<p>Loading foods...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/foods/vendor/${vendorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load foods");

    const foods = await response.json();
    container.innerHTML = "";

    if (foods.length === 0) {
      container.innerHTML = "<p>No food items added yet.</p>";
      return;
    }

    foods.forEach((food) => {
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
          <button data-id="${food.food_id}" class="delete-btn"
              style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; margin-top:5px;">
              Remove
          </button>
        </div>
      `;

      container.appendChild(foodCard);
    });

    // Attach delete listeners safely
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const foodId = e.target.getAttribute("data-id");
        deleteFoodItem(foodId, token);
      });
    });
  } catch (error) {
    console.error("Error loading foods:", error);
    container.innerHTML = "<p>Error loading food items.</p>";
  }
}

// =====================================
// Delete Food Item
// =====================================
async function deleteFoodItem(foodId, token) {
  console.log("Deleting food ID:", foodId);

  try {
    const response = await fetch(`${API_BASE_URL}/foods/${foodId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log("Session expired.");
        localStorage.clear();
        window.location.href = "./login.html";
        return;
      }
      throw new Error("Failed to delete food");
    }

    const element = document.getElementById(`food-${foodId}`);
    if (element) element.remove();

    console.log("Food item deleted successfully ✅");
  } catch (error) {
    console.error("Delete failed:", error.message);
  }
}

// =====================================
// Logout
// =====================================
function logout() {
  console.log("Logging out...");
  localStorage.clear();
  window.location.href = "./login.html";
}
