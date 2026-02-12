// -----------------------------
// Toggle Login / Register Forms
// -----------------------------
function toggleForm(formType) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (formType === "login") {
    loginForm.classList.add("visible");
    registerForm.classList.remove("visible");
  } else {
    registerForm.classList.add("visible");
    loginForm.classList.remove("visible");
  }
}


// -----------------------------
// Main Execution
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
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

  if (!email) {
    console.error("Login Error: Email is required");
    return;
  }

  if (!password) {
    console.error("Login Error: Password is required");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();

    console.log("Login Successful ✅", data);

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user_role", data.role);
    localStorage.setItem("user_id", data.user_id);

    await redirectUser(data.role, data.user_id);

  } catch (error) {
    console.error("Login Failed ❌:", error.message);
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

  if (name.length < 3) {
    console.error("Register Error: Name must be at least 3 characters");
    return;
  }

  if (!email.includes("@")) {
    console.error("Register Error: Invalid email");
    return;
  }

  if (password.length < 6) {
    console.error("Register Error: Password must be at least 6 characters");
    return;
  }

  if (!role) {
    console.error("Register Error: Role not selected");
    return;
  }

  if (!imageFile) {
    console.error("Register Error: Profile image required");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);
    formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    console.log("Registration Successful ✅");

    toggleForm("login");

  } catch (error) {
    console.error("Registration Failed ❌:", error.message);
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
      const response = await fetch(
        `${API_BASE_URL}/vendors/user/${userId}`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.ok) {
        const vendorData = await response.json();
        localStorage.setItem("vendor", JSON.stringify(vendorData));
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
