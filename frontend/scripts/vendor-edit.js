// =====================================
// Vendor Registration / Update Script
// =====================================

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "./login.html";
}

// =====================================
// Load Vendor Data
// =====================================
document.addEventListener("DOMContentLoaded", loadVendorData);

async function loadVendorData() {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load vendor");
    }

    const vendor = await response.json();
    console.log("Vendor Data:", vendor);

    // Prefill values
    document.getElementById("number").value =
      vendor.phone_number || "";

    document.getElementById("openingTime").value =
      vendor.opening_time || "";

    document.getElementById("closingTime").value =
      vendor.closing_time || "";

  } catch (error) {
    console.error("Vendor Load Error:", error);

    showToast("Failed to load vendor data ❌", "red");
  }
}

// =====================================
// Submit Update
// =====================================
document
  .getElementById("vendorRegistration")
  .addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("submit");
  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;

  try {
    const formData = new FormData();

    const phone = document.getElementById("number").value.trim();
    const openTime = document.getElementById("openingTime").value;
    const closeTime = document.getElementById("closingTime").value;
    const imageFile = document.getElementById("image").files[0];

    // Validation
    if (!phone || phone.length < 10) {
      showToast("Enter valid phone number", "red");
      return;
    }

    if (openTime && closeTime && openTime >= closeTime) {
      showToast("Closing time must be after opening time", "red");
      return;
    }

    // Append only if exists
    formData.append("phone_number", phone);
    if (openTime) formData.append("opening_time", openTime);
    if (closeTime) formData.append("closing_time", closeTime);
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/vendors`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Update failed");
    }

    showToast("Vendor updated successfully ✅", "green");

  } catch (error) {
    console.error("Update Error:", error);
    showToast(error.message || "Something went wrong ❌", "red");
  } finally {
    submitBtn.innerText = "Submit";
    submitBtn.disabled = false;
  }
}

// =====================================
// Toast Helper
// =====================================
function showToast(message, color) {
  Toastify({
    text: message,
    duration: 4000,
    gravity: "top",
    position: "right",
    style: { background: color },
  }).showToast();
}
