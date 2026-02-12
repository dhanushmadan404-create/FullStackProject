// ========================================
// Admin Panel Script
// ========================================


// ---------------- LOGOUT ----------------
function logout() {
  console.log("Admin logging out...");
  localStorage.clear();
  window.location.href = "./login.html";
}


// ---------------- SHOW SECTION ----------------
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );

  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");

  if (sectionId === "vendors") {
    loadVendors();
  }
}


// ---------------- LOAD VENDORS ----------------
async function loadVendors() {
  const tableBody = document.querySelector("#vendorTable tbody");
  if (!tableBody) return;

  tableBody.innerHTML =
    "<tr><td colspan='7' style='text-align:center;'>Loading...</td></tr>";

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_BASE_URL}/vendors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      throw new Error("Failed to load vendors");
    }

    const vendors = await response.json();
    tableBody.innerHTML = "";

    if (!vendors.length) {
      tableBody.innerHTML =
        "<tr><td colspan='7' style='text-align:center;'>No vendors found.</td></tr>";
      return;
    }

    vendors.forEach((vendor) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${vendor.vendor_id}</td>
        <td>${vendor.user?.name || "N/A"}</td>
        <td>${vendor.user?.email || "N/A"}</td>
        <td>${vendor.phone_number || ""}</td>
        <td>${vendor.opening_time || ""}</td>
        <td>${vendor.closing_time || ""}</td>
        <td>
          <button class="delete-btn"
              data-id="${vendor.vendor_id}"
              style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
              Delete ❌
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Attach event listeners
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const vendorId = e.target.getAttribute("data-id");
        deleteVendor(vendorId, e.target);
      });
    });

  } catch (err) {
    console.error("Load vendors error:", err);
    tableBody.innerHTML =
      `<tr><td colspan='7' style='text-align:center; color:red;'>Error loading vendors</td></tr>`;
  }
}


// ---------------- DELETE VENDOR ----------------
async function deleteVendor(vendorId, btnElement) {
  console.log("Deleting vendor:", vendorId);

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      throw new Error("Failed to delete vendor");
    }

    // Remove row from table
    const row = btnElement.closest("tr");
    if (row) row.remove();

    console.log("Vendor deleted successfully ✅");

  } catch (err) {
    console.error("Delete vendor error:", err.message);
  }
}


// ---------------- HANDLE UNAUTHORIZED ----------------
function handleUnauthorized() {
  console.log("Unauthorized access. Redirecting to login.");
  localStorage.clear();
  window.location.href = "./login.html";
}


// ---------------- DOM CONTENT LOADED ----------------
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("user_role");
  const userDetailsStr = localStorage.getItem("user_details");
  const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};

  // Verify Admin Access
  if (!token || role !== "admin") {
    console.log("Unauthorized. Admin access required.");
    window.location.href = "./login.html";
    return;
  }

  const adminNameEl = document.getElementById("adminName");
  if (adminNameEl) {
    adminNameEl.textContent = userDetails.name || "Admin";
  }

  // Load default section
  showSection("vendors");
});
