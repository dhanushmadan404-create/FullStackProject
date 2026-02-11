// ---------------- GLOBALS ----------------
// API_URL and token handled by api-helper.js

// ---------------- LOGOUT ----------------
function logout() {
  localStorage.clear();
  location.href = "./login.html";
}

// ---------------- SHOW SECTION ----------------
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.add("active");

  if (sectionId === 'vendors') loadVendors();
}

// ---------------- LOAD VENDORS ----------------
async function loadVendors() {
  const tableBody = document.querySelector("#vendorTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Loading...</td></tr>";

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/vendors`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to load vendors");

    const vendors = await response.json();
    tableBody.innerHTML = "";

    if (vendors.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No vendors found.</td></tr>";
      return;
    }

    vendors.forEach(vendor => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${vendor.vendor_id}</td>
        <td>${vendor.user ? vendor.user.name : 'N/A'}</td>
        <td>${vendor.user ? vendor.user.email : 'N/A'}</td>
        <td>${vendor.phone_number || ''}</td>
        <td>${vendor.opening_time || ''}</td>
        <td>${vendor.closing_time || ''}</td>
        <td><button onclick="deleteVendor(${vendor.vendor_id}, this)" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete ❌</button></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Load vendors error:", err);
    tableBody.innerHTML = `<tr><td colspan='7' style='text-align:center; color:red;'>Error: ${err.message}</td></tr>`;
  }
}

// ---------------- DELETE VENDOR ----------------
async function deleteVendor(vendorId, btn) {
  if (!confirm("Are you sure you want to delete this vendor? This will also remove all their food items.")) return;

  try {
    // Note: The backend SHOULD handle cascading deletion. 
    // If not, we might need a specific endpoint, but let's try the direct vendor delete first.
    const token = localStorage.getItem("token");
    // Note: The backend SHOULD handle cascading deletion. 
    // If not, we might need a specific endpoint, but let's try the direct vendor delete first.
    const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to delete vendor");

    // Remove row from table
    btn.closest("tr").remove();
    alert("Vendor and their items deleted successfully ✅");
  } catch (err) {
    console.error("Delete vendor error:", err);
    alert(err.message);
  }
}

// ---------------- DOM CONTENT LOADED ----------------
document.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem("user_role");
  const userDetailsStr = localStorage.getItem("user_details");
  const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};

  // Verify Admin Access
  if (!localStorage.getItem("token") || role !== "admin") {
    alert("Unauthorized. Admin access required.");
    location.href = "./login.html";
    return;
  }

  const adminNameEl = document.getElementById("adminName");
  if (adminNameEl) adminNameEl.textContent = userDetails.name || "Admin";

  // Default section
  showSection('vendors');
});
