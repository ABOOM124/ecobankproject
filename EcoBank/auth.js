(() => {
  "use strict";

  const shell = document.querySelector("[data-auth-shell]");
  if (!shell) return;

  const loginForm = document.querySelector('[data-auth-form="login"]');
  const registerForm = document.querySelector('[data-auth-form="register"]');
  const title = document.querySelector("[data-auth-title]");
  const subtitle = document.querySelector("[data-auth-subtitle]");
  const feedback = document.querySelector("[data-auth-feedback]");
  const switchCopy = document.querySelector("[data-auth-switch-copy]");

  const sendAuthRequest = async (body) => {
    const response = await fetch("backend/api.php?resource=auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Permintaan akun gagal diproses.");
    }
    return result.data;
  };

  const showRequestError = (error) => {
    if (location.protocol === "file:") {
      feedback.textContent =
        "Buka halaman melalui http://localhost/EcoBank/auth.html agar akun dapat tersambung ke server.";
    } else {
      feedback.textContent =
        error instanceof TypeError
          ? "Tidak dapat mengakses API EcoBank. Periksa backend/api.php dan koneksi database."
          : error.message;
    }
  };

  const setMode = (mode) => {
    const isRegister = mode === "register";
    shell.dataset.mode = mode;
    loginForm.hidden = isRegister;
    registerForm.hidden = !isRegister;
    title.textContent = isRegister ? "Buat Akun EcoBank" : "Selamat Datang";
    subtitle.textContent = isRegister
      ? "Daftar untuk mulai mengelola setoranmu"
      : "Masuk ke akun EcoBank kamu";
    switchCopy.firstChild.textContent = isRegister
      ? "Sudah punya akun? "
      : "Belum punya akun? ";
    const switchButton = switchCopy.querySelector("[data-auth-switch]");
    switchButton.dataset.authSwitch = isRegister ? "login" : "register";
    switchButton.textContent = isRegister
      ? "Masuk sekarang"
      : "Daftar sekarang";
    feedback.textContent = "";
    feedback.classList.remove("is-success");
    document.title = `${isRegister ? "Daftar" : "Masuk"} — EcoBank`;
    (isRegister ? registerForm : loginForm).querySelector("input").focus();
  };

  document.querySelectorAll("[data-auth-switch]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.authSwitch));
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.classList.remove("is-success");
    const submitButton = loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Memeriksa...";
    try {
      await sendAuthRequest({
        action: "login",
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value,
      });
      window.location.assign("beranda_user.html");
    } catch (error) {
      showRequestError(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Masuk ke EcoBank";
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = registerForm.elements.password.value;
    const confirmation = registerForm.elements.confirmPassword.value;
    feedback.classList.remove("is-success");
    if (password !== confirmation) {
      registerForm.elements.confirmPassword.setCustomValidity(
        "Password belum sama.",
      );
      registerForm.reportValidity();
      registerForm.elements.confirmPassword.addEventListener(
        "input",
        () => registerForm.elements.confirmPassword.setCustomValidity(""),
        { once: true },
      );
      return;
    }

    const submitButton = registerForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Mendaftarkan...";
    try {
      await sendAuthRequest({
        action: "register",
        name: registerForm.elements.name.value.trim(),
        email: registerForm.elements.email.value.trim(),
        phone: registerForm.elements.phone.value.trim(),
        district: registerForm.elements.district.value,
        password,
      });

      registerForm.reset();
      feedback.classList.add("is-success");
      feedback.textContent =
        "Pendaftaran berhasil. Data akunmu sudah tersimpan.";
    } catch (error) {
      showRequestError(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Daftar ke EcoBank";
    }
  });

  document
    .querySelector("[data-forgot-password]")
    .addEventListener("click", () => {
      feedback.textContent =
        "Pemulihan password belum tersedia. Silakan hubungi pengelola EcoBank.";
    });
})();
