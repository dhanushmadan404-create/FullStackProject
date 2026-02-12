// ===============================
// Vendor Edit Script
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token found. Redirecting to login...");
    window.location.href = "./login.html";
    return;
  }

  loadVendorData();
  setupFormSubmit();
});


// ===============================
// Load Existing Vendor Data
// ===============================
function loadVendorData() {
  const vendorString = localStorage.getItem("vendor");

  if (!vendorString) {
    console.log("No vendor data found in localStorage.");
    return;
  }

  const vendor = JSON.parse(vendorString);

  // Change page title
  const titleElement = document.querySelector(".header h1");
  if (titleElement) titleElement.innerText = "Edit Vendor Registration";

  const submitBtn = document.getElementById("submit");
  if (submitBtn) submitBtn.innerText = "Update";

  // Pre-fill fields
  if (vendor.phone_number) {
    document.getElementById("number").value = vendor.phone_number;
  }

  if (vendor.opening_time) {
    document.getElementById("openingTime").value =
      vendor.opening_time.slice(0, 5);
  }

  if (vendor.closing_time) {
    document.getElementById("closingTime").value =
      vendor.closing_time.slice(0, 5);
  }

  if (vendor.food_type) {
    document.getElementById("foodType").value = vendor.food_type;
  }
}


// ===============================
// Setup Form Submit
// ===============================
function setupFormSubmit() {
  const form = document.getElementById("vendorRegistration");

  if (!form) {
    console.log("Form not found.");
    return;
  }

  form.addEventListener("submit", handleVendorUpdate);
}


// ===============================
// Handle Vendor Update
// ===============================
async function handleVendorUpdate(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");
  const submitBtn = document.getElementById("submit");

  if (!token) {
    console.log("User not authenticated.");
    window.location.href = "./login.html";
    return;
  }

  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;

  try {
    const formData = new FormData();

    const phone = document.getElementById("number").value.trim();
    const opening = document.getElementById("openingTime").value;
    const closing = document.getElementById("closingTime").value;
    const foodType = document.getElementById("foodType").value;
    const imageFile = document.getElementById("image").files[0];

    if (phone) formData.append("phone_number", phone);
    if (opening) formData.append("opening_time", opening);
    if (closing) formData.append("closing_time", closing);
    if (foodType) formData.append("food_type", foodType);
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/vendors`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log("Session expired. Redirecting to login.");
        localStorage.clear();
        window.location.href = "./login.html";
        return;
      }

      const errorData = await response.json();
      throw new Error(errorData.detail || "Vendor update failed");
    }

    const updatedVendor = await response.json();

    console.log("Vendor updated successfully ✅");
    console.log("Updated Vendor:", updatedVendor);

    // Update localStorage
    localStorage.setItem("vendor", JSON.stringify(updatedVendor));

  } catch (error) {
    console.error("Vendor update error:", error.message);
  } finally {
    submitBtn.innerText = "Update";
    submitBtn.disabled = false;
  }
}
