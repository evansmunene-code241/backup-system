document.addEventListener("DOMContentLoaded", () => {
  const usersTableBody = document.querySelector("#users-table tbody");
  const filesTableBody = document.querySelector("#files-table tbody");
  const logsTableBody = document.querySelector("#logs-table tbody");
  const messageBox = document.getElementById("message");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ Please log in as admin first.");
    window.location.href = "/login";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ✅ Show messages
  function showMessage(text, color = "green") {
    messageBox.textContent = text;
    messageBox.style.color = color;
    setTimeout(() => (messageBox.textContent = ""), 4000);
  }

  // ✅ Fetch wrapper to safely parse JSON
  async function safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      const text = await res.text(); // get raw text first
      try {
        const data = JSON.parse(text); // attempt JSON parse
        if (!res.ok) throw data; // throw if HTTP error
        return data;
      } catch {
        throw { message: `Invalid JSON response: ${text.substring(0, 200)}` };
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showMessage(err.message || "Fetch error", "red");
      return null;
    }
  }

  // 🔹 Load Users
  async function loadUsers() {
    const users = await safeFetch("/api/admin/users", { headers });
    if (!users) return;
    usersTableBody.innerHTML = "";
    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.full_name}</td>
        <td>${user.email}</td>
        <td>${user.is_admin ? "✅ Admin" : "User"}</td>
        <td>${user.approved ? "✅ Approved" : "❌ Pending"}</td>
        <td>
          ${
            user.approved
              ? ""
              : `<button class="approve-user" data-id="${user.id}">Approve</button>`
          }
          <button class="delete-user" data-id="${user.id}">Delete</button>
        </td>
      `;
      usersTableBody.appendChild(row);
    });
  }

  // 🔹 Load Files
  async function loadFiles() {
    const files = await safeFetch("/api/admin/files", { headers });
    if (!files) return;
    filesTableBody.innerHTML = "";
    files.forEach((file) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${file.filename}</td>
        <td>${file.uploaded_by}</td>
        <td>${file.status}</td>
        <td>${new Date(file.upload_date).toLocaleString()}</td>
        <td>
          ${
            file.status === "Approved"
              ? ""
              : `<button class="approve-file" data-id="${file.id}">Approve</button>`
          }
          <button class="delete-file" data-id="${file.id}">Delete</button>
        </td>
      `;
      filesTableBody.appendChild(row);
    });
  }

  // 🔹 Load Logs
  async function loadLogs() {
    const logs = await safeFetch("/api/admin/logs", { headers });
    if (!logs) return;
    logsTableBody.innerHTML = "";
    logs.forEach((log) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${log.id}</td>
        <td>${log.user_name}</td>
        <td>${log.action}</td>
        <td>${log.status}</td>
        <td>${log.details || ""}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
      `;
      logsTableBody.appendChild(row);
    });
  }

  // ✅ Handle User & File Actions
  document.body.addEventListener("click", async (e) => {
    const target = e.target;

    // Approve User
    if (target.classList.contains("approve-user")) {
      const id = target.dataset.id;
      if (confirm("Approve this user?")) {
        const data = await safeFetch(`/api/admin/users/approve/${id}`, {
          method: "PUT",
          headers,
        });
        if (data) {
          showMessage(data.message || "User approved");
          loadUsers();
        }
      }
    }

    // Delete User
    if (target.classList.contains("delete-user")) {
      const id = target.dataset.id;
      if (confirm("Delete this user?")) {
        const data = await safeFetch(`/api/admin/users/delete/${id}`, {
          method: "DELETE",
          headers,
        });
        if (data) {
          showMessage(data.message || "User deleted", "red");
          loadUsers();
        }
      }
    }

    // Approve File
    if (target.classList.contains("approve-file")) {
      const id = target.dataset.id;
      if (confirm("Approve this file?")) {
        const data = await safeFetch(`/api/admin/files/approve/${id}`, {
          method: "PATCH",
          headers,
        });
        if (data) {
          showMessage(data.message || "File approved");
          loadFiles();
        }
      }
    }

    // Delete File
    if (target.classList.contains("delete-file")) {
      const id = target.dataset.id;
      if (confirm("Delete this file?")) {
        const data = await safeFetch(`/api/admin/files/delete/${id}`, {
          method: "DELETE",
          headers,
        });
        if (data) {
          showMessage(data.message || "File deleted", "red");
          loadFiles();
        }
      }
    }
  });

  // 🔁 Initial load
  loadUsers();
  loadFiles();
  loadLogs();
});
