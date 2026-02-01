// Using centralized api-helper.js for API_URL and fetchAPI

// ---------------- LOAD PROFILE ----------------
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "./login.html";
    return;
  }

  const profile = document.getElementById("profile_details");
  try {
    const user_details = await fetchAPI("/users/me");
    localStorage.setItem("user_details", JSON.stringify(user_details));

    const imgUrl = getImageUrl(user_details.image_url);
    profile.innerHTML = `
      <img src="${imgUrl}" alt="${user_details.name}" class="profile-image" 
      onError={(e) => {
    e.target.onerror = null;
    e.target.src = "../../assets/default_user.png";
  }}/>
      <br />
      <h2>${user_details.name}</h2>
      <p class="about">${user_details.email}</p>
      <p><strong>Role:</strong> ${user_details.role}</p>
    `;
  } catch (err) {
    console.error("Profile load error:", err);
    // If 401, fetchAPI might have already logged us out or handled it, 
    // but we'll ensure we handle it here if it's a critical auth failure.
    if (err.message.includes("401") || err.message.includes("Unauthorized")) {
      localStorage.clear();
      location.href = "./login.html";
    } else {
      alert("Error loading profile: " + err.message);
    }
  }
});

// ---------------- EDIT PROFILE ----------------
const editBtn = document.getElementById("editBtn");
const user_edit = document.getElementById("edit");

if (editBtn) {
  editBtn.addEventListener("click", () => {
    const user_document = JSON.parse(localStorage.getItem("user_details") || "{}");
    const previewUrl = getImageUrl(user_document.image_url);

    user_edit.innerHTML = `
    <form id="editForm" enctype="multipart/form-data">
      <div class="form-group">
        <label>Name</label>
        <input 
          type="text" 
          id="name" 
          value="${user_document.name || ''}" 
          minlength="3"
          required
        />
      </div>

      <div class="form-group">
        <label>Profile Image</label>
        <input
          id="image"
          type="file"
          accept="image/*"
        />
        <img src="${previewUrl}" width="80" id="preview" style="display: block; margin-top: 10px; border-radius: 50%; object-fit: cover; aspect-ratio: 1/1;"/>
      </div>

      <button type="submit" class="submit-btn" style="padding: 10px 20px; background: orange; color: white; border: none; border-radius: 5px; cursor: pointer;">Update Profile</button>
    </form>
  `;

    document.getElementById("editForm").addEventListener("submit", submitEditForm);
  });
}

// ---------------- SUBMIT EDIT FORM ----------------
async function submitEditForm(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const imageFile = document.getElementById("image").files[0];
  const user_details = JSON.parse(localStorage.getItem("user_details") || "{}");

  if (!user_details.email) return alert("User detail missing");

  const formData = new FormData();
  if (name) formData.append("name", name);
  if (imageFile) formData.append("image", imageFile);

  try {
    const updatedUser = await fetchAPI(`/users/email/${user_details.email}`, {
      method: "PUT",
      body: formData
    });

    localStorage.setItem("user_details", JSON.stringify(updatedUser));
    alert("Profile updated ✅");
    location.reload();
  } catch (err) {
    console.error("Update error:", err);
    alert(`Update failed ❌: ${err.message}`);
  }
}

// ---------------- LOGOUT ----------------
const logoutBtn = document.getElementById("logOut");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "./login.html";
  });
}
