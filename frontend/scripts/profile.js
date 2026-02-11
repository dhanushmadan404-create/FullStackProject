// --- Main Execution ---
document.addEventListener("DOMContentLoaded", () => {
  // Check if logged in
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "./login.html";
    return;
  }

  loadProfile();
  setupEditForm();
  setupLogout();
});


// --- Load Profile ---
async function loadProfile() {
  try {
    // Fetch current user details
    // Fetch current user details
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("401");
      throw new Error("Failed to fetch user");
    }

    const user = await response.json();

    // Save for later use
    localStorage.setItem("user_details", JSON.stringify(user));

    // Update UI
    const profileContainer = document.getElementById("profile_details");
    const imgUrl = getImageUrl(user.image_url); // api-helper function

    profileContainer.innerHTML = `
            <img src="${imgUrl}" alt="${user.name}" class="profile-image" 
             onerror="this.onerror=null; this.src='../assets/default_user.png';"/>
            <br />
            <h2>${user.name}</h2>
            <p class="about">${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
        `;

  } catch (error) {
    console.error("Error loading profile:", error);
    if (error.message.includes("401")) {
      alert("Session expired. Please login again.");
      localStorage.clear();
      window.location.href = "./login.html";
    } else {
      alert("Could not load profile.");
    }
  }
}


// --- Edit Profile Setup ---
function setupEditForm() {
  const editBtn = document.getElementById("editBtn");
  const editContainer = document.getElementById("edit");

  if (!editBtn) return;

  editBtn.addEventListener("click", () => {
    // Get current data from storage (or could fetch again)
    const userString = localStorage.getItem("user_details");
    const user = userString ? JSON.parse(userString) : {};

    const previewImg = getImageUrl(user.image_url);

    // Render Edit Form
    editContainer.innerHTML = `
            <form id="editForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="name" value="${user.name || ''}" minlength="3" required />
                </div>

                <div class="form-group">
                    <label>Profile Image</label>
                    <input id="image" type="file" accept="image/*" />
                    <img src="${previewImg}" width="80" id="preview" 
                         style="display: block; margin-top: 10px; border-radius: 50%; width: 80px; height: 80px; object-fit: cover;"/>
                </div>

                <button type="submit" class="submit-btn" style="padding: 10px 20px; background: orange; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Update Profile
                </button>
            </form>
        `;

    // Attach Submit Listener
    document.getElementById("editForm").addEventListener("submit", handleEditSubmit);
  });
}


// --- Handle Edit Submit ---
async function handleEditSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const imageFile = document.getElementById("image").files[0];
  const user = JSON.parse(localStorage.getItem("user_details") || "{}");

  if (!user.email) return alert("Error: User email missing.");

  try {
    const formData = new FormData();
    if (name) formData.append("name", name);
    if (imageFile) formData.append("image", imageFile);

    // Update User
    // Update User
    const response = await fetch(`${API_BASE_URL}/users/email/${user.email}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Update failed");
    }

    const updatedUser = await response.json();

    // Update Storage and UI
    localStorage.setItem("user_details", JSON.stringify(updatedUser));
    alert("Profile updated successfully! ✅");
    location.reload(); // Refresh to show new data

  } catch (error) {
    console.error("Update failed:", error);
    alert(`Update failed: ${error.message}`);
  }
}


// --- Logout ---
function setupLogout() {
  const logoutBtn = document.getElementById("logOut");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "./login.html";
  });
}
