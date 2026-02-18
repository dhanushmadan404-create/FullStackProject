const API_BASE_URL = "http://127.0.0.1:8000";

// =====================================
// Load Vendor Data + Prefill Form
// =====================================
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "./login.html";
    return;
  }

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

    // ✅ Prefill values
    document.getElementById("number").value =
      vendor.phone_number || "";

    document.getElementById("openingTime").value =
      vendor.opening_time || "";

    document.getElementById("closingTime").value =
      vendor.closing_time || "";

  } catch (error) {
    console.error("Vendor Load Error:", error);

    Toastify({
      text: "Failed to load vendor data",
      duration: 4000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
    }).showToast();
  }
});

// =====================================
// Handle Update Submit
// =====================================
document
  .getElementById("vendorRegistration")
  .addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();

  const token = localStorage.getItem("token");

  const submitBtn = document.getElementById("submit");
  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;

  try {
    const formData = new FormData();

    const phone = document.getElementById("number").value.trim();
    const openTime = document.getElementById("openingTime").value;
    const closeTime = document.getElementById("closingTime").value;
    const imageFile = document.getElementById("image").files[0];

    if (phone) formData.append("phone_number", phone);
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
    console.log("Update Response:", data);

    if (!response.ok) {
      Toastify({
        text: data.detail || "Update failed",
        duration: 4000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
      }).showToast();
      return;
    }

    Toastify({
      text: "Vendor updated successfully ✅",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "green" },
    }).showToast();

  } catch (error) {
    console.error("Update Error:", error);

    Toastify({
      text: "Something went wrong ❌",
      duration: 4000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
    }).showToast();
  } finally {
    submitBtn.innerText = "Submit";
    submitBtn.disabled = false;
  }
}
