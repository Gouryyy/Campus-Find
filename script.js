
/* =========================================
   CAMPUSFIND - LOST & FOUND MANAGEMENT SYSTEM
   Frontend JavaScript
   ========================================= */

// ---------- 1. INITIAL DATA ----------

const sampleItems = [
  {
    id: 1,
    name: "Black Leather Wallet",
    type: "found",
    category: "Accessories",
    location: "Library",
    date: "2026-10-20",
    description: "A black leather wallet found near the library reading area.",
    emoji: "👛",
    status: "found",
    image: ""
  },
  {
    id: 2,
    name: "Wireless Headphones",
    type: "lost",
    category: "Electronics",
    location: "Canteen",
    date: "2026-10-19",
    description: "Black wireless headphones lost around the canteen.",
    emoji: "🎧",
    status: "lost",
    image: ""
  },
  {
    id: 3,
    name: "Water Bottle",
    type: "found",
    category: "Personal items",
    location: "Block A",
    date: "2026-10-20",
    description: "A blue reusable water bottle found near Block A.",
    emoji: "🧴",
    status: "found",
    image: ""
  },
  {
    id: 4,
    name: "Key Chain",
    type: "lost",
    category: "Keys",
    location: "Auditorium",
    date: "2026-10-18",
    description: "A small key chain with several keys attached.",
    emoji: "🔑",
    status: "lost",
    image: ""
  },
  {
    id: 5,
    name: "Notebook",
    type: "found",
    category: "Books & stationery",
    location: "Library",
    date: "2026-10-17",
    description: "A notebook left on a table in the library.",
    emoji: "📒",
    status: "found",
    image: ""
  },
  {
    id: 6,
    name: "College Backpack",
    type: "lost",
    category: "Accessories",
    location: "Sports Ground",
    date: "2026-10-16",
    description: "A college backpack misplaced near the sports ground.",
    emoji: "🎒",
    status: "lost",
    image: ""
  },
  {
    id: 7,
    name: "Mobile Phone",
    type: "found",
    category: "Electronics",
    location: "Lab 2",
    date: "2026-10-19",
    description: "A mobile phone found in the computer laboratory.",
    emoji: "📱",
    status: "found",
    image: ""
  },
  {
    id: 8,
    name: "Wrist Watch",
    type: "lost",
    category: "Accessories",
    location: "Canteen",
    date: "2026-10-15",
    description: "A wrist watch lost somewhere around the canteen.",
    emoji: "⌚",
    status: "lost",
    image: ""
  }
];

const itemEmojis = {
  "Electronics": "📱",
  "Accessories": "🎒",
  "Personal items": "🧴",
  "Books & stationery": "📒",
  "Keys": "🔑",
  "Other": "📦"
};

const visualClasses = {
  "👛": "visual-wallet",
  "🎧": "visual-headphones",
  "🧴": "visual-bottle",
  "🔑": "visual-keys",
  "📒": "visual-book",
  "🎒": "visual-bag",
  "📱": "visual-phone",
  "⌚": "visual-watch"
};

// ---------- 2. LOAD SAVED DATA ----------

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Could not load saved data:", error);
  }

  return fallback;
}

let items = loadFromStorage("campusFindItems", sampleItems);
let claims = loadFromStorage("campusFindClaims", []);

function saveItems() {
  try {
    localStorage.setItem("campusFindItems", JSON.stringify(items));
  } catch (error) {
    showToast("Storage is full. Try a smaller image.");
    console.error("Could not save items:", error);
  }
}

function saveClaims() {
  try {
    localStorage.setItem("campusFindClaims", JSON.stringify(claims));
  } catch (error) {
    showToast("Could not save the claim request.");
    console.error("Could not save claims:", error);
  }
}

// ---------- 3. HELPER FUNCTIONS ----------

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function formatDate(dateString) {
  if (!dateString) {
    return "Date not specified";
  }

  const date = new Date(dateString + "T00:00:00");

  if (Number.isNaN(date.getTime())) {
    return "Date not specified";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getItemEmoji(item) {
  return item.emoji || itemEmojis[item.category] || "📦";
}

function getStatusLabel(status) {
  if (status === "recovered") {
    return "Recovered";
  }

  return status === "lost" ? "Lost" : "Found";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) {
    return;
  }

  toastMessage.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}

// ---------- 4. ITEM CARD HTML ----------

function createItemCard(item) {
  const emoji = getItemEmoji(item);
  const visualClass = visualClasses[emoji] || "";
  const status = item.status || item.type || "found";

  let visualContent = `
    <span class="item-emoji">${escapeHTML(emoji)}</span>
  `;

  if (item.image) {
    visualContent = `
      <img
        src="${item.image}"
        alt="${escapeHTML(item.name)}"
        style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"
      >
    `;
  }

  return `
    <article class="item-card" data-item-id="${item.id}">
      <div class="item-visual ${visualClass}">
        ${visualContent}

        <span class="status-pill ${escapeHTML(status)}">
          ${escapeHTML(getStatusLabel(status))}
        </span>
      </div>

      <div class="item-card-body">
        <h3>${escapeHTML(item.name)}</h3>

        <p>
          ${escapeHTML(item.description)}
        </p>

        <div class="item-meta">
          <span>⌖ ${escapeHTML(item.location)}</span>
          <span>· ${escapeHTML(item.category)}</span>
        </div>

        <div class="item-card-footer">
          <span class="item-date">
            ${escapeHTML(formatDate(item.date))}
          </span>

          <button
            class="card-action"
            data-action="details"
            data-id="${item.id}"
          >
            View details →
          </button>
        </div>
      </div>
    </article>
  `;
}

// ---------- 5. DASHBOARD ----------

function renderDashboard() {
  const recentGrid = document.getElementById("recentGrid");

  if (!recentGrid) {
    return;
  }

  const recentItems = [...items]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  recentGrid.innerHTML = recentItems.map(createItemCard).join("");

  updateStatistics();
}

function updateStatistics() {
  const openItems = items.filter(item =>
    item.status === "lost" || item.status === "found"
  ).length;

  const foundItems = items.filter(item =>
    item.status === "found"
  ).length;

  const recoveredItems = items.filter(item =>
    item.status === "recovered"
  ).length;

  const matches = findPotentialMatches().length;

  document.getElementById("openStat").textContent = openItems;
  document.getElementById("foundStat").textContent = foundItems;
  document.getElementById("matchStat").textContent = matches;
  document.getElementById("recoveredStat").textContent = recoveredItems;
  document.getElementById("navItemCount").textContent = items.length;
}

// ---------- 6. NAVIGATION ----------

function showView(viewName) {
  document.querySelectorAll(".view").forEach(function (view) {
    view.classList.remove("active");
  });

  const targetView = document.getElementById(viewName + "View");

  if (!targetView) {
    return;
  }

  targetView.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(function (button) {
    button.classList.toggle(
      "active",
      button.dataset.view === viewName
    );
  });

  const titles = {
    dashboard: "Overview",
    browse: "Browse items",
    report: "Report an item",
    claims: "My claims"
  };

  document.getElementById("breadcrumbCurrent").textContent =
    titles[viewName] || "Overview";

  document.getElementById("sidebar").classList.remove("open");

  if (viewName === "browse") {
    renderBrowseItems();
  }

  if (viewName === "claims") {
    renderClaims();
  }

  if (viewName === "dashboard") {
    renderDashboard();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll("[data-view]").forEach(function (button) {
  button.addEventListener("click", function () {
    showView(button.dataset.view);
  });
});

// Mobile navigation
document.getElementById("menuToggle").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("open");
});

// ---------- 7. QUICK SEARCH ----------

let quickFilter = "all";

$("#quickSearch").on("input", function () {
  renderRecentItems();
});

document.querySelectorAll("[data-quick-filter]").forEach(function (button) {
  button.addEventListener("click", function () {
    quickFilter = button.dataset.quickFilter;

    document.querySelectorAll("[data-quick-filter]").forEach(function (chip) {
      chip.classList.toggle("selected", chip === button);
    });

    renderRecentItems();
  });
});

function renderRecentItems() {
  const grid = document.getElementById("recentGrid");
  const keyword = document.getElementById("quickSearch").value
    .trim()
    .toLowerCase();

  const filtered = [...items]
    .filter(function (item) {
      const matchesKeyword = [
        item.name,
        item.category,
        item.location,
        item.description
      ].join(" ").toLowerCase().includes(keyword);

      const matchesType =
        quickFilter === "all" || item.status === quickFilter;

      return matchesKeyword && matchesType;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  grid.innerHTML = filtered.length
    ? filtered.map(createItemCard).join("")
    : `<p class="empty-state">No matching items found.</p>`;
}

// ---------- 8. BROWSE AND FILTER ----------

function renderBrowseItems() {
  const keyword = document.getElementById("browseSearch").value
    .trim()
    .toLowerCase();

  const category = document.getElementById("categoryFilter").value;
  const location = document.getElementById("locationFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = [...items].filter(function (item) {
    const searchableText = [
      item.name,
      item.category,
      item.location,
      item.description
    ].join(" ").toLowerCase();

    const matchesKeyword = searchableText.includes(keyword);
    const matchesCategory =
      category === "all" || item.category === category;
    const matchesLocation =
      location === "all" || item.location === location;
    const matchesStatus =
      status === "all" || item.status === status;

    return (
      matchesKeyword &&
      matchesCategory &&
      matchesLocation &&
      matchesStatus
    );
  });

  document.getElementById("browseGrid").innerHTML =
    filtered.map(createItemCard).join("");

  document.getElementById("resultsCount").textContent =
    `Showing ${filtered.length} of ${items.length} items`;

  document.getElementById("emptyState").classList.toggle(
    "hidden",
    filtered.length !== 0
  );
}

["browseSearch", "categoryFilter", "locationFilter", "statusFilter"]
  .forEach(function (id) {
    document.getElementById(id).addEventListener("input", renderBrowseItems);
    document.getElementById(id).addEventListener("change", renderBrowseItems);
  });

function clearFilters() {
  document.getElementById("browseSearch").value = "";
  document.getElementById("categoryFilter").value = "all";
  document.getElementById("locationFilter").value = "all";
  document.getElementById("statusFilter").value = "all";

  renderBrowseItems();
}

document.getElementById("clearFilters").addEventListener("click", clearFilters);
document.getElementById("emptyClear").addEventListener("click", clearFilters);

// ---------- 9. POTENTIAL MATCHING ----------

function findPotentialMatches() {
  const matches = [];

  const lostItems = items.filter(item => item.status === "lost");
  const foundItems = items.filter(item => item.status === "found");

  lostItems.forEach(function (lost) {
    foundItems.forEach(function (found) {
      let score = 0;

      if (lost.category === found.category) {
        score += 2;
      }

      if (lost.location === found.location) {
        score += 2;
      }

      if (lost.name.toLowerCase() === found.name.toLowerCase()) {
        score += 3;
      }

      if (score >= 4) {
        matches.push({
          lostId: lost.id,
          foundId: found.id,
          score: score
        });
      }
    });
  });

  return matches;
}

// ---------- 10. ITEM DETAILS MODAL ----------

function openItemDetails(id) {
  const item = items.find(item => item.id === Number(id));

  if (!item) {
    return;
  }

  const emoji = getItemEmoji(item);

  const matches = findPotentialMatches().filter(function (match) {
    return match.lostId === item.id || match.foundId === item.id;
  });

  const isFound = item.status === "found";
  const isLost = item.status === "lost";

  let actionButton = "";

  if (isFound) {
    actionButton = `
      <button class="button primary" id="claimItemButton">
        Request to claim →
      </button>
    `;
  } else if (isLost) {
    actionButton = `
      <p>
        If you find a similar item, please report it so the owner
        can be contacted through the appropriate campus process.
      </p>
    `;
  } else {
    actionButton = `
      <p>This item has been marked as recovered.</p>
    `;
  }

  document.getElementById("modalContent").innerHTML = `
    <div class="modal-emoji">${escapeHTML(emoji)}</div>

    <span class="status-pill ${escapeHTML(item.status)}">
      ${escapeHTML(getStatusLabel(item.status))}
    </span>

    <h2 id="modalTitle" style="margin-top:18px;">
      ${escapeHTML(item.name)}
    </h2>

    <p>${escapeHTML(item.description)}</p>

    <div class="modal-details">
      <div>
        <span>Category</span>
        <b>${escapeHTML(item.category)}</b>
      </div>

      <div>
        <span>Location</span>
        <b>${escapeHTML(item.location)}</b>
      </div>

      <div>
        <span>Reported date</span>
        <b>${escapeHTML(formatDate(item.date))}</b>
      </div>

      <div>
        <span>Status</span>
        <b>${escapeHTML(getStatusLabel(item.status))}</b>
      </div>
    </div>

    ${
      matches.length
        ? `<p>✦ A potential match with another report was identified.</p>`
        : ""
    }

    ${actionButton}
  `;

  document.getElementById("modalBackdrop").classList.remove("hidden");

  const claimButton = document.getElementById("claimItemButton");

  if (claimButton) {
    claimButton.addEventListener("click", function () {
      createClaim(item);
    });
  }
}

// Delegated click handling for item cards
document.addEventListener("click", function (event) {
  const detailsButton = event.target.closest('[data-action="details"]');
  const card = event.target.closest(".item-card");

  if (detailsButton) {
    event.stopPropagation();
    openItemDetails(detailsButton.dataset.id);
    return;
  }

  if (card) {
    openItemDetails(card.dataset.itemId);
  }
});

// Close modal
document.getElementById("modalClose").addEventListener("click", function () {
  document.getElementById("modalBackdrop").classList.add("hidden");
});

document.getElementById("modalBackdrop").addEventListener("click", function (event) {
  if (event.target.id === "modalBackdrop") {
    event.currentTarget.classList.add("hidden");
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    document.getElementById("modalBackdrop").classList.add("hidden");
  }
});

// ---------- 11. REPORT FORM VALIDATION ----------

const reportForm = document.getElementById("reportForm");
const imageInput = document.getElementById("itemImage");

document.getElementById("itemDate").value =
  new Date().toLocaleDateString("en-CA");

document.querySelectorAll('input[name="reportType"]').forEach(function (radio) {
  radio.addEventListener("change", function () {
    document.querySelectorAll(".type-option").forEach(function (option) {
      option.classList.toggle(
        "selected",
        option.querySelector("input").checked
      );
    });
  });
});

function setFieldError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(errorId);

  if (error) {
    error.textContent = message;
  }

  if (field) {
    field.classList.toggle("input-error", Boolean(message));
  }
}

function clearFormErrors() {
  [
    ["itemName", "nameError"],
    ["itemCategory", "categoryError"],
    ["itemLocation", "locationError"],
    ["itemDate", "dateError"],
    ["itemDescription", "descriptionError"],
    ["itemImage", "imageError"]
  ].forEach(function (fields) {
    setFieldError(fields[0], fields[1], "");
  });
}

function validateReportForm() {
  clearFormErrors();

  let valid = true;

  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const location = document.getElementById("itemLocation").value;
  const date = document.getElementById("itemDate").value;
  const description = document.getElementById("itemDescription").value.trim();

  if (name.length < 2) {
    setFieldError("itemName", "nameError", "Enter an item name.");
    valid = false;
  }

  if (!category) {
    setFieldError("itemCategory", "categoryError", "Select a category.");
    valid = false;
  }

  if (!location) {
    setFieldError("itemLocation", "locationError", "Select a location.");
    valid = false;
  }

  if (!date) {
    setFieldError("itemDate", "dateError", "Select a date.");
    valid = false;
  }

  if (description.length < 8) {
    setFieldError(
      "itemDescription",
      "descriptionError",
      "Enter at least 8 characters."
    );
    valid = false;
  }

  if (date && date > new Date().toLocaleDateString("en-CA")) {
    setFieldError("itemDate", "dateError", "Date cannot be in the future.");
    valid = false;
  }

  return valid;
}

// ---------- 12. IMAGE PREVIEW ----------

let selectedImage = "";

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];
  const preview = document.getElementById("imagePreview");

  selectedImage = "";
  preview.innerHTML = "";
  preview.classList.add("hidden");
  setFieldError("itemImage", "imageError", "");

  if (!file) {
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    setFieldError(
      "itemImage",
      "imageError",
      "Choose a JPG, PNG or WEBP image."
    );

    imageInput.value = "";
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    setFieldError(
      "itemImage",
      "imageError",
      "Image must be smaller than 3 MB."
    );

    imageInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    selectedImage = event.target.result;

    preview.innerHTML = `
      <img src="${selectedImage}" alt="Selected item preview">
      <span>${escapeHTML(file.name)}</span>
    `;

    preview.classList.remove("hidden");
  };

  reader.onerror = function () {
    setFieldError("itemImage", "imageError", "Could not read this image.");
  };

  reader.readAsDataURL(file);
});

// ---------- 13. SUBMIT REPORT ----------

reportForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!validateReportForm()) {
    showToast("Please correct the highlighted fields.");
    return;
  }

  const type = document.querySelector(
    'input[name="reportType"]:checked'
  ).value;

  const newItem = {
    id: Date.now(),
    name: document.getElementById("itemName").value.trim(),
    type: type,
    category: document.getElementById("itemCategory").value,
    location: document.getElementById("itemLocation").value,
    date: document.getElementById("itemDate").value,
    description: document.getElementById("itemDescription").value.trim(),
    emoji: itemEmojis[document.getElementById("itemCategory").value] || "📦",
    status: type,
    image: selectedImage
  };

  items.unshift(newItem);
  saveItems();

  renderDashboard();
  renderBrowseItems();

  reportForm.reset();

  selectedImage = "";
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("imagePreview").classList.add("hidden");

  document.getElementById("itemDate").value =
    new Date().toLocaleDateString("en-CA");

  document.querySelector('input[name="reportType"][value="lost"]').checked = true;

  document.querySelectorAll(".type-option").forEach(function (option) {
    option.classList.toggle(
      "selected",
      option.querySelector("input").checked
    );
  });

  clearFormErrors();

  showView("browse");
  showToast("Your report has been added successfully!");
});

// Reset form
document.getElementById("resetForm").addEventListener("click", function () {
  reportForm.reset();

  selectedImage = "";
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("imagePreview").classList.add("hidden");

  document.getElementById("itemDate").value =
    new Date().toLocaleDateString("en-CA");

  document.querySelectorAll(".type-option").forEach(function (option) {
    option.classList.toggle(
      "selected",
      option.querySelector("input").checked
    );
  });

  clearFormErrors();
});

// ---------- 14. CLAIM REQUESTS ----------

function createClaim(item) {
  const alreadyClaimed = claims.some(function (claim) {
    return claim.itemId === item.id && claim.status !== "Rejected";
  });

  if (alreadyClaimed) {
    showToast("You already have a claim for this item.");
    return;
  }

  const claim = {
    id: Date.now(),
    itemId: item.id,
    itemName: item.name,
    emoji: getItemEmoji(item),
    location: item.location,
    date: new Date().toLocaleDateString("en-CA"),
    status: "Pending"
  };

  claims.unshift(claim);
  saveClaims();

  document.getElementById("modalBackdrop").classList.add("hidden");

  renderClaims();
  showView("claims");

  showToast("Claim request submitted!");
}

function renderClaims() {
  const claimsList = document.getElementById("claimsList");

  document.getElementById("claimCount").textContent =
    `${claims.length} ${claims.length === 1 ? "request" : "requests"}`;

  if (claims.length === 0) {
    claimsList.innerHTML = `
      <div class="claim-empty">
        <span>📋</span>
        <b>No claims yet</b>
        <p>Browse found items and submit a claim request if you recognise something.</p>
        <button class="button primary" data-view="browse">
          Browse items →
        </button>
      </div>
    `;

    return;
  }

  claimsList.innerHTML = claims.map(function (claim) {
    const statusClass =
      claim.status === "Approved" ? "approved" : "";

    return `
      <div class="claim-row">
        <div class="claim-emoji">${escapeHTML(claim.emoji)}</div>

        <div class="claim-row-content">
          <b>${escapeHTML(claim.itemName)}</b>
          <small>
            ${escapeHTML(claim.location)} · Requested ${escapeHTML(formatDate(claim.date))}
          </small>
        </div>

        <span class="claim-status ${statusClass}">
          ${escapeHTML(claim.status)}
        </span>
      </div>
    `;
  }).join("");
}

// ---------- 15. NOTIFICATIONS ----------

document.getElementById("notificationBtn").addEventListener("click", function () {
  const pendingClaims = claims.filter(claim => claim.status === "Pending").length;

  if (pendingClaims > 0) {
    showToast(`You have ${pendingClaims} pending claim request(s).`);
  } else {
    showToast("You're all caught up!");
  }
});

// ---------- 16. INITIALISE APP ----------

function initialiseApp() {
  renderDashboard();
  renderRecentItems();
  renderBrowseItems();
  renderClaims();

  console.log("CampusFind frontend loaded successfully.");
}

initialiseApp();
