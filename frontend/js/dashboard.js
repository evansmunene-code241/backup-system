document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  // DOM elements
  const backupTable = document.getElementById("backupTable")?.querySelector("tbody");
  const fileTable = document.getElementById("fileTable")?.querySelector("tbody");
  const backupBtn = document.getElementById("backupBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const uploadForm = document.getElementById("uploadForm");

  // ✅ Upload File
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById("fileInput");
      if (!fileInput.files.length) {
        alert("Please select a file first.");
        return;
      }

      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      try {
        const res = await fetch("/api/files/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ File uploaded successfully!");
          fileInput.value = "";
          loadFiles();
        } else {
          alert("❌ Upload failed: " + (data.error || "Unknown error."));
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("⚠️ Upload failed. Check console for details.");
      }
    });
  }

  // 🧠 Load backups list
  async function loadBackups() {
    if (!backupTable) return;

    backupTable.innerHTML = `
      <tr><td colspan="3" class="text-center py-4 text-gray-500">Loading backups...</td></tr>
    `;

    try {
      const res = await fetch("/api/backup/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const backups = await res.json();

      if (!res.ok) throw new Error(backups.error || "Failed to load backups.");

      if (backups.length === 0) {
        backupTable.innerHTML = `
          <tr><td colspan="3" class="text-center py-4 text-gray-500">No backups found.</td></tr>
        `;
        return;
      }

      backupTable.innerHTML = backups
        .map(
          (b) => `
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <td class="px-4 py-2">${b.name}</td>
            <td class="px-4 py-2">${new Date(b.date).toLocaleString()}</td>
            <td class="px-4 py-2">
              <a href="/api/backup/download/${b.name}" 
                 class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                Download
              </a>
            </td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      backupTable.innerHTML = `
        <tr><td colspan="3" class="text-center py-4 text-red-500">Error loading backups.</td></tr>
      `;
    }
  }

  // 🧠 Load uploaded files
  async function loadFiles() {
    if (!fileTable) return;

    fileTable.innerHTML = `
      <tr><td colspan="3" class="text-center py-4 text-gray-500">Loading files...</td></tr>
    `;

    try {
      const res = await fetch("/api/files/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const files = await res.json();

      if (!res.ok) throw new Error(files.error || "Failed to load files.");

      if (files.length === 0) {
        fileTable.innerHTML = `
          <tr><td colspan="3" class="text-center py-4 text-gray-500">No files uploaded.</td></tr>
        `;
        return;
      }

      fileTable.innerHTML = files
        .map(
          (f) => `
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <td class="px-4 py-2">${f.filename}</td>
            <td class="px-4 py-2">${f.status}</td>
            <td class="px-4 py-2">${new Date(f.created_at).toLocaleString()}</td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      fileTable.innerHTML = `
        <tr><td colspan="3" class="text-center py-4 text-red-500">Error loading files.</td></tr>
      `;
    }
  }

  // ⚙️ Create backup
  if (backupBtn) {
    backupBtn.addEventListener("click", async () => {
      backupBtn.disabled = true;
      backupBtn.textContent = "⏳ Creating...";

      try {
        const res = await fetch("/api/backup/database", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ Backup created successfully!");
          loadBackups();
        } else {
          alert("❌ Backup failed: " + (data.error || "Unknown error."));
        }
      } catch (err) {
        console.error(err);
        alert("⚠️ Unable to connect to the backup server.");
      } finally {
        backupBtn.disabled = false;
        backupBtn.textContent = "📦 Backup Now";
      }
    });
  }

  // 🧠 Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    });
  }

  // 🚀 Auto-load data
  loadBackups();
  loadFiles();
});
