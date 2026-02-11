// --- Toggling Forms (Login vs Register) ---
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


// --- Main Execution ---
document.addEventListener("DOMContentLoaded", () => {
  // Attach Event Listeners
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("registerBtn").addEventListener("click", handleRegister);
});


// --- Login Logic ---
async function handleLogin(event) {
  event.preventDefault(); // Stop page reload

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  // Simple Validation
  if (!email) return alert("Please enter your email");
  if (!password) return alert("Please enter your password");

  try {
    // Call API
    // Note: fetchAPI automatically sets Content-Type to JSON if body is object
    // Call API
    // Manual fetch with JSON headers
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: email, password: password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();

    // Store User Data
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user_role", data.role);
    localStorage.setItem("user_id", data.user_id);

    // Redirect based on role
    redirectUser(data.role, data.user_id);

  } catch (error) {
    console.error("Login Failed:", error);
    alert(`Login failed: ${error.message}`);
  }
}


// --- Register Logic ---
async function handleRegister(event) {
  event.preventDefault();

  // Get Form Values
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const role = document.getElementById("role").value;
  const imageFile = document.getElementById("img").files[0];

  // Simple Validation
  if (name.length < 3) return alert("Name must be at least 3 characters");
  if (!email.includes("@")) return alert("Please enter a valid email");
  if (password.length < 6) return alert("Password must be at least 6 characters");
  if (!role) return alert("Please select a role");
  if (!imageFile) return alert("Please upload a profile image");

  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);
    formData.append("image", imageFile);

    // Call API
    // Call API
    // FormData does NOT need Content-Type header (browser sets it)
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }

    alert("Registration successful! ✅ Please login.");
    toggleForm("login"); // Switch to login view

  } catch (error) {
    console.error("Registration Failed:", error);
    alert(`Registration failed: ${error.message}`);
  }
}


// --- Reset Password Logic ---
// (Optional: Add if needed later)
function resetPassword() {
  alert("Reset Password feature coming soon!");
}


// --- Helper Functions ---
async function redirectUser(role, userId) {
  if (role === "admin") {
    window.location.href = "admin.html";
  } else if (role === "vendor") {
    // Check if vendor profile exists
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/user/${userId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) throw new Error("Vendor not found");

      const vendorData = await response.json();

      // If we get data, save it regarding vendor details
      if (vendorData) {
        localStorage.setItem("vendor", JSON.stringify(vendorData));
        window.location.href = "./vendor-profile.html";
      } else {
        // Determine if this ever happens with current backend
        window.location.href = "./registration.html";
      }
    } catch (err) {
      // If 404 or error, assume no vendor profile yet
      window.location.href = "./registration.html";
    }
  } else {
    // Default User
    window.location.href = "../../index.html";
  }
}
