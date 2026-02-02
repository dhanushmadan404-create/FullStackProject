document.addEventListener("DOMContentLoaded", () => {
  // get vendor data from localStorage
  const vendor = JSON.parse(localStorage.getItem("vendor"));

  if (vendor) {
    // change title & button (edit mode)
    document.querySelector(".header h1").innerText =
      "Edit Vendor Registration";
    document.getElementById("submit").innerText = "Update";

    // prefill values
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
});

// submit / update vendor
document
  .getElementById("vendorRegistration")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    const phone = document.getElementById("number").value;
    const opening = document.getElementById("openingTime").value;
    const closing = document.getElementById("closingTime").value;
    const imageFile = document.getElementById("image").files[0];

    if (phone) formData.append("phone_number", phone);
    if (opening) formData.append("opening_time", opening);
    if (closing) formData.append("closing_time", closing);
    if (imageFile) formData.append("image", imageFile);

    try {
      const response = await fetchAPI("/vendors", {
        method: "PUT",
        body: formData
      });

      alert("Vendor details updated successfully ✅");

      // update localStorage
      localStorage.setItem("vendor", JSON.stringify(response));
    } catch (error) {
      console.error(error);
      alert("Vendor update failed ❌");
    }
  });
