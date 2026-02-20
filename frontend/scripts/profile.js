// ---------------- API BASE URL ----------------
if (typeof API_BASE_URL === "undefined") {
  window.API_BASE_URL =
    window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000/api"
      : "/api";
}

// ---------------- GLOBAL TOKEN ----------------
const token = localStorage.getItem("token");

// ---------------- MAIN EXECUTION ----------------
document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    window.location.href = "./login.html";
    Toastify({
      text: `User not logged in`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();

    return;
  }

  loadProfile();
  setupEditForm();
  setupLogout();
});

// ---------------- LOAD PROFILE ----------------
async function loadProfile() {
  const profileContainer = document.getElementById("profile_details");
  profileContainer.innerHTML = "<p>Loading profile...</p>"
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("401");
      throw new Error("Failed to fetch user");
    }

    const user = await response.json();

    localStorage.setItem("user_details", JSON.stringify(user));

    const imgUrl = getImageUrl(user.image_url);

    profileContainer.innerHTML = `
      <img 
        src="${imgUrl}" 
        alt="${user.name}" 
        class="profile-image"
        onerror="this.onerror=null; this.src='../assets/default_user.png';"
      />
      <h2>${user.name}</h2>
      <p>${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
    `;
  } catch (error) {
    Toastify({
      text: `Error loading profile:${error}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();

    if (error.message === "401") {
      Toastify({
        text: `Redirecting...`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
        close: true,
        stopOnFocus: true
      }).showToast();
      localStorage.clear();
      window.location.href = "./login.html";
    }
  }
}

// ---------------- EDIT PROFILE SETUP ----------------
function setupEditForm() {
  const editBtn = document.getElementById("editBtn");
  const editContainer = document.getElementById("edit");

  if (!editBtn) return;

  editBtn.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("user_details") || "{}");
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
            style="margin-top:10px;
                   border-radius:50%;
                   width:80px;
                   height:80px;
                   object-fit:cover;"
                    onerror="this.onerror=null; this.src='../assets/default_user.png';"
          />
        </div>

        <button type="submit">
          Update Profile
        </button>
      </form>
    `;

    // Image Live Preview
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
  });
}

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

// ---------------- LOGOUT ----------------
function setupLogout() {
  const logoutBtn = document.getElementById("logOut");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();

    localStorage.clear();
    Toastify({
      text: `User logged out`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();

    window.location.href = "./login.html";
  });
}
