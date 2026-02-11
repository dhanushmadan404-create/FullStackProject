document.addEventListener("DOMContentLoaded", () => {
  loadVendorData();
});

function loadVendorData() {
  // Get vendor data from localStorage
  const vendorString = localStorage.getItem("vendor");

  // If no vendor data, stop here
  if (!vendorString) return;

  const vendor = JSON.parse(vendorString);

  // Update Header and Button to show we are in "Edit" mode
  const titleElement = document.querySelector(".header h1");
  if (titleElement) titleElement.innerText = "Edit Vendor Registration";

  const submitBtn = document.getElementById("submit");
  if (submitBtn) submitBtn.innerText = "Update";

  // Pre-fill the form fields with existing data
  if (vendor.phone_number) {
    document.getElementById("number").value = vendor.phone_number;
  }

  if (vendor.opening_time) {
    // Time format usually needs HH:MM (slice first 5 chars)
    document.getElementById("openingTime").value = vendor.opening_time.slice(0, 5);
  }

  if (vendor.closing_time) {
    document.getElementById("closingTime").value = vendor.closing_time.slice(0, 5);
  }

  if (vendor.food_type) {
    document.getElementById("foodType").value = vendor.food_type;
  }
}

// Handle Form Submission
const form = document.getElementById("vendorRegistration");
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // Stop page reload

  const submitBtn = document.getElementById("submit");
  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;

  // Create FormData object to handle text AND file uploads easily
  const formData = new FormData();

  // Get values from inputs
  const phone = document.getElementById("number").value;
  const opening = document.getElementById("openingTime").value;
  const closing = document.getElementById("closingTime").value;
  const foodType = document.getElementById("foodType").value;
  const imageFile = document.getElementById("image").files[0];

  // Append to FormData (only if they exist)
  if (phone) formData.append("phone_number", phone);
  if (opening) formData.append("opening_time", opening);
  if (closing) formData.append("closing_time", closing);
  if (foodType) formData.append("food_type", foodType);
  if (imageFile) formData.append("image", imageFile);

  try {
    // Send PUT request to update vendor
    // fetchAPI detects FormData and sets headers automatically!
    // Send PUT request to update vendor
    // fetchAPI detects FormData and sets headers automatically!
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/vendors`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Update failed");
    }

    const responseResponseData = await response.json();

    alert("Vendor details updated successfully! ✅");

    // Update localStorage with new data
    localStorage.setItem("vendor", JSON.stringify(responseResponseData));

    // Optional: Reload or redirect
    // window.location.reload(); 

  } catch (error) {
    console.error("Update failed:", error);
    alert(`Update failed: ${error.message} ❌`);
  } finally {
    submitBtn.innerText = "Update";
    submitBtn.disabled = false;
  }
});
