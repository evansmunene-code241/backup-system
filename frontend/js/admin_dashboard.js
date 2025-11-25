const API_URL = "http://localhost:5000/api/admin/users";
const token = localStorage.getItem("token");

// Redirect if not logged in
if (!token) {
  alert("Please log in as admin first.");
  window.location.href = "login.html";
}

// 🧾 Fetch all users
async function loadUsers() {
  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = await res.json();
    const tbody = document.getElementById("usersBody");
    tbody.innerHTML = "";

    users.forEach(user => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.full_name}</td>
        <td>${user.email}</td>
        <td class="${user.approved ? 'status-approved' : 'status-pending'}">
          ${user.approved ? "Approved" : "Pending"}
        </td>
        <td>
          ${!user.approved ? `<button class="btn approve" onclick="approveUser(${user.id})">Approve</button>` : ""}
          <button class="btn delete" onclick="deleteUser(${user.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading users:", error);
    alert("Failed to load users. Check console for details.");
  }
}

// ✅ Approve user
async function approveUser(id) {
  if (!confirm("Approve this user?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/admin/approve/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    alert(data.message);
    loadUsers();
  } catch (err) {
    console.error(err);
    alert("Error approving user.");
  }
}

// ❌ Delete user
async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/admin/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    alert(data.message);
    loadUsers();
  } catch (err) {
    console.error(err);
    alert("Error deleting user.");
  }
}

// 🚪 Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Load users when page loads
loadUsers();
