(() => {
  "use strict";

  const status = document.querySelector("[data-user-status]");
  const showStatus = (message) => {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
  };

  const loadUser = async () => {
    if (location.protocol === "file:") {
      showStatus(
        "Buka EcoBank melalui http://localhost/EcoBank/ untuk memuat akun.",
      );
      return;
    }

    try {
      const response = await fetch("backend/api.php?resource=auth&action=me");
      const result = await response.json();
      if (response.status === 401) {
        window.location.replace("auth.html");
        return;
      }
      if (!response.ok) {
        throw new Error(result.error || "Akun tidak dapat dimuat.");
      }

      document.querySelector("[data-user-name]").textContent = result.data.name;
      document.querySelector("[data-user-district]").lastChild.textContent =
        ` ${result.data.district}`;
      document.querySelector("[data-profile-name]").textContent =
        result.data.name;
      document.querySelector("[data-user-initials]").textContent =
        result.data.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();
    } catch (error) {
      showStatus(
        error instanceof TypeError
          ? "Tidak dapat menghubungi server EcoBank. Periksa koneksi Apache dan MySQL."
          : error.message,
      );
    }
  };

  loadUser();
})();
