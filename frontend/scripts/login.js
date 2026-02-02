// Redundant API_URL and fetchAPI removed - using centralized api-helper.js

// ---------------- TOGGLE FORMS ----------------
function toggleForm(targetFormId) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (targetFormId === "loginForm") {
    loginForm.classList.add("visible");
    registerForm.classList.remove("visible");
  } else if (targetFormId === "registerForm") {
    registerForm.classList.add("visible");
    loginForm.classList.remove("visible");
  }
}

// ---------------- REGISTER ----------------
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");

  // Register
  registerBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const role = document.getElementById("role").value;
    const imageFile = document.getElementById("img").files[0];

    const nameError = document.getElementById("nameError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const roleError = document.getElementById("roleError");
    const imageError = document.querySelector("label[for='img'].error");

    [nameError, emailError, passwordError, roleError, imageError].forEach(el => el.textContent = "");

    
    let valid = true;
    if (name.length < 3) { nameError.textContent = "Name min 3 chars"; valid = false; }
    if (!/\S+@\S+\.\S+/.test(email)) { emailError.textContent = "Invalid email"; valid = false; }
    if (password.length < 6) { passwordError.textContent = "Password min 6 chars"; valid = false; }
    if (!role) { roleError.textContent = "Select role"; valid = false; }
    if (!imageFile) { imageError.textContent = "Profile image required"; valid = false; }
    if (!valid) return;

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("image", imageFile);

      await fetchAPI("/users", { method: "POST", body: formData });

      alert("Registration successful ✅. Please login.");
      toggleForm("loginForm");
    } catch (err) {
      console.error("Registration failed:", err);
      // Show error near the relevant field if possible, or alert
      alert("Registration failed: " + err.message);
    }
  });

  // Login
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const emailError = document.getElementById("loginEmailError");
    const passwordError = document.getElementById("loginPasswordError");

    emailError.textContent = "";
    passwordError.textContent = "";

    if (!email) { emailError.textContent = "Email required"; return; }
    if (!password) { passwordError.textContent = "Password required"; return; }

    try {
      const data = await fetchAPI(`/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      // Securely store details
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_details", JSON.stringify(data));

      // Role-based navigation
      if (data.role === "user") {
        window.location.href = "../../index.html";
      } else if (data.role === "admin") {
        window.location.href = "admin.html";
      } else if (data.role === "vendor") {
        console.log("Vendor login detected, checking shop profile...");
        try {
          const checkData = await fetchAPI(`/vendors/user/${data.user_id}`);
          if (checkData.exists) {
            localStorage.setItem("vendor", JSON.stringify(checkData));
            window.location.href = "./vendor-profile.html";
          } else {
            window.location.href = "./registration.html";
          }
        } catch (vendorErr) {
          console.error("Error checking vendor status:", vendorErr);
          // Fallback to registration if checking fails but we know they are a vendor
          window.location.href = "./registration.html";
        }
      } else {
        // Default fallback
        window.location.href = "../../index.html";
      }
    } catch (err) {
      passwordError.textContent = err.message;
    }
  });
});
