(() => {
  "use strict";

  const PRICE_KEY = "ecobank-prices-v1";
  const TRANSACTION_KEY = "ecobank-transactions-v1";
  const defaultPrices = [
    {
      id: "plastic-bottle",
      name: "Botol plastik",
      category: "Plastik",
      price: 6500,
    },
    {
      id: "plastic-cup",
      name: "Tutup botol",
      category: "Plastik",
      price: 7200,
    },
    {
      id: "plastic-glass",
      name: "Gelas plastik",
      category: "Plastik",
      price: 4800,
    },
    {
      id: "plastic-packaging",
      name: "Plastik kemasan",
      category: "Plastik",
      price: 3800,
    },
    {
      id: "plastic-jerrycan",
      name: "Kantong plastik",
      category: "Plastik",
      price: 2800,
    },
    { id: "paper-cardboard", name: "Kardus", category: "Kertas", price: 3800 },
    { id: "paper-hvs", name: "Kertas HVS", category: "Kertas", price: 3500 },
    { id: "paper-newspaper", name: "Koran", category: "Kertas", price: 2900 },
    { id: "paper-magazine", name: "Majalah", category: "Kertas", price: 2600 },
    { id: "paper-books", name: "Buku bekas", category: "Kertas", price: 3000 },
    {
      id: "metal-can",
      name: "Kaleng aluminium",
      category: "Logam",
      price: 8500,
    },
    { id: "metal-iron", name: "Besi bekas", category: "Logam", price: 4200 },
    { id: "metal-copper", name: "Tembaga", category: "Logam", price: 56000 },
    { id: "metal-steel", name: "Baja ringan", category: "Logam", price: 3500 },
    {
      id: "glass-clear",
      name: "Botol kaca bening",
      category: "Kaca",
      price: 1800,
    },
    {
      id: "glass-colored",
      name: "Botol kaca warna",
      category: "Kaca",
      price: 1500,
    },
    { id: "glass-jar", name: "Toples kaca", category: "Kaca", price: 2000 },
    { id: "glass-other", name: "Pecahan kaca", category: "Kaca", price: 800 },
  ];
  const defaultTransactions = [
    {
      id: "EB-2901",
      name: "Arya Pramudia",
      waste: "Plastik",
      detail: "Botol plastik",
      weight: 2.5,
      value: 16250,
      date: "29 Sep 2026",
      status: "pending",
      avatar: "👨🏻",
    },
    {
      id: "EB-2902",
      name: "Nadia Putri",
      waste: "Kardus",
      detail: "Kardus",
      weight: 4,
      value: 15200,
      date: "29 Sep 2026",
      status: "pending",
      avatar: "👩🏻",
    },
    {
      id: "EB-2903",
      name: "Rizky Aditya",
      waste: "Kertas",
      detail: "Kertas HVS",
      weight: 3,
      value: 10500,
      date: "28 Sep 2026",
      status: "pending",
      avatar: "🧑🏻",
    },
    {
      id: "EB-2898",
      name: "Dina Maharani",
      waste: "Plastik",
      detail: "Gelas plastik",
      weight: 1.5,
      value: 7200,
      date: "27 Sep 2026",
      status: "approved",
      avatar: "👩🏽",
    },
    {
      id: "EB-2891",
      name: "Bima Saputra",
      waste: "Kaca",
      detail: "Botol kaca bening",
      weight: 5,
      value: 9000,
      date: "25 Sep 2026",
      status: "cancelled",
      avatar: "👨🏽",
    },
  ];
  const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
  const escapeHtml = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  const readStored = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error(`Data EcoBank tidak dapat dibaca (${key}).`, error);
      return fallback;
    }
  };
  let prices = readStored(PRICE_KEY, defaultPrices);
  let transactions = readStored(TRANSACTION_KEY, defaultTransactions);
  if (!Array.isArray(prices)) prices = defaultPrices;
  if (!Array.isArray(transactions)) transactions = defaultTransactions;

  const saveStored = (key, value, notice) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Perubahan EcoBank tidak dapat disimpan (${key}).`, error);
      if (notice)
        notice.textContent =
          "Perubahan gagal disimpan di browser ini. Coba muat ulang setelah memeriksa penyimpanan.";
      return false;
    }
  };
  const formatPrice = (value) => `Rp ${rupiah.format(value)}`;
  const formatWeight = (value) =>
    `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value)} kg`;
  const setPendingCounters = () => {
    const count = transactions.filter(
      (transaction) => transaction.status === "pending",
    ).length;
    document
      .querySelectorAll("[data-pending-count], [data-pending-total]")
      .forEach((node) => {
        node.textContent = String(count);
      });
    document.querySelectorAll("[data-pending-label]").forEach((node) => {
      node.textContent = `${count} menunggu`;
    });
  };

  document.querySelectorAll(".menu-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const navigation = button.closest("header")?.querySelector("nav");
      if (!navigation) return;
      const isOpen = navigation.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        button
          .closest("header")
          ?.querySelector(".profile-dropdown")
          ?.setAttribute("hidden", "");
        button
          .closest("header")
          ?.querySelector("[data-profile-toggle]")
          ?.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.querySelectorAll("[data-profile-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const control = button.closest("[data-profile-control]");
      const dropdown = control?.querySelector(".profile-dropdown");
      if (!control || !dropdown) return;
      const isOpen = dropdown.hidden;
      dropdown.hidden = !isOpen;
      button.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        control
          .closest("header")
          ?.querySelector(".app-nav")
          ?.classList.remove("is-open");
        control
          .closest("header")
          ?.querySelector(".menu-toggle")
          ?.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll("[data-profile-control]").forEach((control) => {
      if (control.contains(event.target)) return;
      control.querySelector(".profile-dropdown").hidden = true;
      control
        .querySelector("[data-profile-toggle]")
        .setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll("[data-profile-control]").forEach((control) => {
      if (control.querySelector(".profile-dropdown").hidden) return;
      control.querySelector(".profile-dropdown").hidden = true;
      const button = control.querySelector("[data-profile-toggle]");
      button.setAttribute("aria-expanded", "false");
      button.focus();
    });
  });

  document.querySelectorAll("[data-profile-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      const control = button.closest("[data-profile-control]");
      const feedback = control?.querySelector("[data-profile-feedback]");
      button.disabled = true;
      try {
        const response = await fetch("backend/api.php?resource=auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Tidak dapat keluar.");
        window.location.assign(button.dataset.logoutTarget || "auth.html");
      } catch (error) {
        if (feedback) {
          feedback.hidden = false;
          feedback.textContent =
            location.protocol === "file:"
              ? "Buka EcoBank melalui localhost untuk keluar dari akun."
              : error.message;
        }
        button.disabled = false;
      }
    });
  });

  const renderPrices = (query = "") => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id");
    document.querySelectorAll("[data-waste-list]").forEach((list) => {
      const category = list.dataset.wasteList;
      const categoryItems = prices.filter((item) => item.category === category);
      const filteredItems = categoryItems.filter((item) =>
        `${item.name} ${item.category}`
          .toLocaleLowerCase("id")
          .includes(normalizedQuery),
      );
      const card = list.closest(".price-category");
      card.classList.toggle("is-empty", filteredItems.length === 0);
      const categoryTotal = card.querySelector(".category-total");
      categoryTotal.textContent = `${categoryItems.length} jenis`;
      list.innerHTML = filteredItems
        .map(
          (item) => `
                <div class="waste-row">
                    <strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong>
                    <span>${formatPrice(item.price)}<small> /kg</small></span>
                    <div class="waste-actions">
                        <button class="icon-action" type="button" data-edit-price="${escapeHtml(item.id)}" aria-label="Ubah ${escapeHtml(item.name)}" title="Ubah harga">✎</button>
                        <button class="icon-action delete" type="button" data-delete-price="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(item.name)}" title="Hapus jenis sampah">×</button>
                    </div>
                </div>`,
        )
        .join("");
    });
    const total = document.querySelector("[data-price-count]");
    if (total) total.textContent = `${prices.length} jenis sampah`;
  };

  const priceDialog = document.querySelector("[data-price-dialog]");
  const priceForm = document.querySelector("[data-price-form]");
  const priceNotice = document.querySelector("[data-price-notice]");
  const openPriceDialog = (item = null) => {
    if (!priceDialog || !priceForm) return;
    priceForm.reset();
    priceForm.elements.id.value = item?.id ?? "";
    priceForm.elements.name.value = item?.name ?? "";
    priceForm.elements.category.value = item?.category ?? "Plastik";
    priceForm.elements.price.value = item?.price ?? "";
    priceDialog.querySelector("[data-dialog-title]").textContent = item
      ? "Ubah jenis sampah"
      : "Tambah jenis sampah";
    priceDialog.showModal();
    priceForm.elements.name.focus();
  };
  document
    .querySelector("[data-add-waste]")
    ?.addEventListener("click", () => openPriceDialog());
  document
    .querySelector("[data-price-search]")
    ?.addEventListener("input", (event) => renderPrices(event.target.value));
  document.querySelector(".price-grid")?.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-price]");
    const deleteButton = event.target.closest("[data-delete-price]");
    if (editButton) {
      const item = prices.find(
        (entry) => entry.id === editButton.dataset.editPrice,
      );
      if (item) openPriceDialog(item);
    }
    if (deleteButton) {
      const item = prices.find(
        (entry) => entry.id === deleteButton.dataset.deletePrice,
      );
      if (!item || !window.confirm(`Hapus ${item.name} dari daftar harga?`))
        return;
      prices = prices.filter((entry) => entry.id !== item.id);
      if (saveStored(PRICE_KEY, prices, priceNotice)) {
        renderPrices(
          document.querySelector("[data-price-search]")?.value ?? "",
        );
        priceNotice.textContent = `${item.name} berhasil dihapus.`;
      }
    }
  });
  document
    .querySelector("[data-dialog-cancel]")
    ?.addEventListener("click", () => priceDialog?.close());
  priceForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!priceForm.reportValidity()) return;
    const id = priceForm.elements.id.value || `waste-${Date.now()}`;
    const item = {
      id,
      name: priceForm.elements.name.value.trim(),
      category: priceForm.elements.category.value,
      price: Number(priceForm.elements.price.value),
    };
    if (!item.name || !Number.isFinite(item.price) || item.price < 1) return;
    const index = prices.findIndex((entry) => entry.id === id);
    if (index >= 0) prices[index] = item;
    else prices.push(item);
    if (saveStored(PRICE_KEY, prices, priceNotice)) {
      renderPrices(document.querySelector("[data-price-search]")?.value ?? "");
      priceNotice.textContent = `${item.name} disimpan dengan harga ${formatPrice(item.price)}/kg.`;
      priceDialog.close();
    }
  });
  if (priceDialog) renderPrices();

  const statusLabels = {
    pending: "Menunggu",
    approved: "Disetujui",
    cancelled: "Dibatalkan",
  };
  const transactionRows = document.querySelector("[data-transaction-rows]");
  const renderTransactions = () => {
    if (!transactionRows) return;
    const query = (
      document.querySelector("[data-transaction-search]")?.value ?? ""
    )
      .trim()
      .toLocaleLowerCase("id");
    const status =
      document.querySelector("[data-status-filter]")?.value ?? "all";
    const wasteType =
      document.querySelector("[data-type-filter]")?.value ?? "all";
    const filtered = transactions.filter((transaction) => {
      const matchesQuery =
        `${transaction.name} ${transaction.id} ${transaction.waste} ${transaction.detail}`
          .toLocaleLowerCase("id")
          .includes(query);
      return (
        matchesQuery &&
        (status === "all" || transaction.status === status) &&
        (wasteType === "all" || transaction.waste === wasteType)
      );
    });
    transactionRows.innerHTML = filtered
      .map(
        (transaction) => `
            <tr>
                <td><div class="user-cell"><span class="user-avatar">${escapeHtml(transaction.avatar || "♻")}</span><span>${escapeHtml(transaction.name)}<small>${escapeHtml(transaction.id)}</small></span></div></td>
                <td>${escapeHtml(transaction.detail)}</td><td>${formatWeight(transaction.weight)}</td><td>${formatPrice(transaction.value)}</td><td>${escapeHtml(transaction.date)}</td>
                <td><span class="status-tag ${escapeHtml(transaction.status)}">${statusLabels[transaction.status] ?? "Menunggu"}</span></td>
                <td>${transaction.status === "pending" ? `<div class="table-actions"><button class="table-action" type="button" data-transaction-action="approved" data-transaction-id="${escapeHtml(transaction.id)}">Setujui</button><button class="table-action cancel" type="button" data-transaction-action="cancelled" data-transaction-id="${escapeHtml(transaction.id)}">Batalkan</button></div>` : `<span class="pagination-label">Selesai</span>`}</td>
            </tr>`,
      )
      .join("");
    const emptyState = document.querySelector("[data-transactions-empty]");
    if (emptyState) emptyState.hidden = filtered.length > 0;
    const count = document.querySelector("[data-transaction-count]");
    if (count)
      count.textContent = `Menampilkan ${filtered.length} dari ${transactions.length} transaksi`;
    setPendingCounters();
  };

  let pendingAction = null;
  const confirmationDialog = document.querySelector("[data-confirm-dialog]");
  const askForTransactionConfirmation = (transaction, nextStatus) => {
    pendingAction = { transaction, nextStatus };
    if (!confirmationDialog) return;
    const approve = nextStatus === "approved";
    confirmationDialog
      .querySelector("[data-confirm-icon]")
      .classList.toggle("danger", !approve);
    confirmationDialog.querySelector("[data-confirm-icon]").textContent =
      approve ? "✓" : "×";
    confirmationDialog.querySelector("[data-confirm-title]").textContent =
      approve ? "Setujui setoran?" : "Batalkan setoran?";
    confirmationDialog.querySelector("[data-confirm-copy]").textContent =
      approve
        ? `Setoran ${transaction.name} (${formatWeight(transaction.weight)} ${transaction.waste.toLowerCase()}) akan disetujui dan tercatat.`
        : `Setoran ${transaction.name} akan dibatalkan. Tindakan ini mengubah status transaksi.`;
    const acceptButton = confirmationDialog.querySelector(
      "[data-confirm-accept]",
    );
    acceptButton.textContent = approve ? "Ya, setujui" : "Ya, batalkan";
    acceptButton.classList.toggle("button-primary", approve);
    acceptButton.classList.toggle("button-cancel", !approve);
    confirmationDialog.showModal();
  };
  document
    .querySelector("[data-confirm-cancel]")
    ?.addEventListener("click", () => {
      pendingAction = null;
      confirmationDialog?.close();
    });
  document
    .querySelector("[data-confirm-accept]")
    ?.addEventListener("click", () => {
      if (!pendingAction) return;
      const { transaction, nextStatus } = pendingAction;
      transaction.status = nextStatus;
      if (!saveStored(TRANSACTION_KEY, transactions)) {
        transaction.status = "pending";
        return;
      }
      pendingAction = null;
      confirmationDialog?.close();
      renderTransactions();
    });
  transactionRows?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-transaction-action]");
    if (!button) return;
    const transaction = transactions.find(
      (entry) => entry.id === button.dataset.transactionId,
    );
    if (transaction?.status === "pending")
      askForTransactionConfirmation(
        transaction,
        button.dataset.transactionAction,
      );
  });
  [
    "[data-transaction-search]",
    "[data-status-filter]",
    "[data-type-filter]",
  ].forEach((selector) => {
    document
      .querySelector(selector)
      ?.addEventListener(
        selector.includes("search") ? "input" : "change",
        renderTransactions,
      );
  });
  if (transactionRows) renderTransactions();
})();
