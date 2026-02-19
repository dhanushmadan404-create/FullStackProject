if (!window.API_BASE_URL) {
  Toastify({
    text: "API_BASE_URL is not defined. Make sure common.js is loaded first.",
    duration: 5000,
    gravity: "top",
    position: "right",
    style: { background: "red" },
    close: true,
    stopOnFocus: true
  }).showToast();
}

// -----------------------------
// Toggle Login / Register Forms
// -----------------------------
function toggleForm(formType) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (!loginForm || !registerForm) {
    console.error("Forms not found in DOM");
    return;
  }

  if (formType === "login") {
    loginForm.classList.add("visible");
    registerForm.classList.remove("visible");
  } else if (formType === "register") {
    registerForm.classList.add("visible");
    loginForm.classList.remove("visible");
  }

  console.log("Toggled to:", formType);
}

// -----------------------------
// Main Execution
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log(API_BASE_URL);
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (loginBtn) loginBtn.addEventListener("click", handleLogin);
  if (registerBtn) registerBtn.addEventListener("click", handleRegister);
});

// -----------------------------
// Login Logic
// -----------------------------
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  emailError.textContent = "";
  passwordError.textContent = "";

  if (!email || !email.includes("@")) {
    emailError.textContent = "Email is required";

    return;
  }

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";

    return;
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      Toastify({
        text: `Login failed: ${errorData.detail || "Invalid credentials"}`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
      }).showToast();
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();
    Toastify({
      text: `Login Successful ✅`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "green" },
      close: true,
      stopOnFocus: true
    }).showToast();

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("user_id", data.user_id);

    await redirectUser(data.role, data.user_id);
  } catch (error) {
    Toastify({
      text: `Login Failed ❌: ${error.message}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" }, // Corrected color to red for failure
      close: true,
      stopOnFocus: true
    }).showToast();
  }
}

// -----------------------------
// Register Logic
// -----------------------------
async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const role = document.getElementById("role").value;
  const imageFile = document.getElementById("img").files[0];
  // Error elements
  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const roleError = document.getElementById("roleError");
  nameError.textContent = "";
  emailError.textContent = "";
  passwordError.textContent = "";
  roleError.textContent = "";

  if (name.length < 3) {
    nameError.textContent = "Name must be at least 3 characters";
    return;
  }

  if (!email || !email.includes("@")) {
    emailError.textContent = "Invalid email address";
    return;
  }

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";
    return;
  }

  if (!role) {
    roleError.textContent = "Please select a role";
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", normalizedEmail);
    formData.append("password", password);
    formData.append("role", role);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      body: formData,
    });


    // 🔥 SAFE ERROR HANDLING
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Server Response:", errorData);
      throw new Error(errorData.detail || `Registration failed (Status ${response.status})`);
    }

    const data = await response.json();
    Toastify({
      text: `Registration Successful ✅`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "green" },
      close: true,
      stopOnFocus: true
    }).showToast();

    toggleForm("login");
  } catch (error) {
    Toastify({
      text: `Registration Failed ❌: ${error.message}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();
  }
}

// -----------------------------
// Redirect Based on Role
// -----------------------------
async function redirectUser(role, userId) {
  console.log("Redirecting user with role:", role);

  if (role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  if (role === "vendor") {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const vendorData = await response.json();
        localStorage.setItem("vendorId", vendorData.vendor_id);
        console.log("Vendor profile found. Redirecting...");
        window.location.href = "./vendor-profile.html";
      } else {
        console.log("Vendor profile not found. Redirecting to registration...");
        window.location.href = "./registration.html";
      }
    } catch (err) {
      console.error("Vendor fetch error:", err.message);
      window.location.href = "./registration.html";
    }

    return;
  }

  console.log("Redirecting normal user...");
  window.location.href = "../../index.html";
}
