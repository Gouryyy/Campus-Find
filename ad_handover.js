
"use strict";

// ==========================================
// CAMPUSFIND HANDOVER MANAGEMENT
// ==========================================

const CLAIMS_KEY = "campusfind_claims";
const ITEMS_KEY = "campusfind_items";
const HANDOVERS_KEY = "campusfind_handovers";

const $ = (id) => document.getElementById(id);

// ==========================================
// READ AND SAVE DATA
// ==========================================

function readData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error reading " + key, error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Error saving " + key, error);
        showMessage("Could not save data. Check your browser storage.", true);
        return false;
    }
}

// ==========================================
// SAFE HTML OUTPUT
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showMessage(message, isError = false) {
    const element = $("message");

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", isError);
}

// ==========================================
// CLAIM FIELD HELPERS
// ==========================================

function getClaimId(claim) {
    return String(claim.id ?? claim.claimId ?? "");
}

function getItemId(claim) {
    return String(claim.itemId ?? claim.itemID ?? "");
}

function getEmail(claim) {
    return String(
        claim.studentEmail ??
        claim.email ??
        claim.userEmail ??
        ""
    ).trim().toLowerCase();
}

function getStudentName(claim) {
    return claim.studentName ??
        claim.name ??
        claim.userName ??
        "Student";
}

function getClaimStatus(claim) {
    return String(
        claim.status ??
        claim.claimStatus ??
        ""
    ).trim().toLowerCase();
}

function isApproved(claim) {
    return ["approved", "accepted"].includes(getClaimStatus(claim));
}

function getItemName(claim, items) {
    const item = items.find(item =>
        String(item.id ?? item.itemId ?? "") === getItemId(claim)
    );

    return claim.itemName ??
        claim.itemTitle ??
        claim.title ??
        (item ? item.itemName ?? item.name ?? item.title : "") ??
        "Item";
}

// ==========================================
// HANDOVER HELPERS
// ==========================================

function findHandover(claimId, handovers) {
    return handovers.find(handover =>
        String(handover.claimId) === String(claimId) &&
        handover.status === "Completed"
    );
}

function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
}

// ==========================================
// UPDATE SUMMARY CARDS
// ==========================================

function renderSummary(approvedClaims, handovers) {
    const completedClaims = approvedClaims.filter(claim =>
        findHandover(getClaimId(claim), handovers)
    );

    const pendingClaims = approvedClaims.filter(claim =>
        !findHandover(getClaimId(claim), handovers)
    );

    $("approvedCount").textContent = approvedClaims.length;
    $("completedCount").textContent = completedClaims.length;
    $("pendingCount").textContent = pendingClaims.length;
}

// ==========================================
// DISPLAY HANDOVER TABLE
// ==========================================

function renderHandovers() {
    const tbody = $("handoverTableBody");

    if (!tbody) {
        console.error("Missing handoverTableBody in ad_handover.html");
        return;
    }

    const claims = readData(CLAIMS_KEY);
    const items = readData(ITEMS_KEY);
    const handovers = readData(HANDOVERS_KEY);

    const approvedClaims = claims.filter(isApproved);

    renderSummary(approvedClaims, handovers);

    const searchTerm = ($("searchInput")?.value || "")
        .trim()
        .toLowerCase();

    const selectedStatus = $("statusFilter")?.value || "all";

    const rows = approvedClaims.filter(claim => {
        const claimId = getClaimId(claim);
        const itemName = getItemName(claim, items);
        const studentName = getStudentName(claim);
        const email = getEmail(claim);

        const handover = findHandover(claimId, handovers);

        const status = handover ? "Completed" : "Pending";

        const matchesSearch = [
            claimId,
            itemName,
            studentName,
            email
        ].some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );

        const matchesStatus =
            selectedStatus === "all" ||
            selectedStatus === status;

        return matchesSearch && matchesStatus;
    });

    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No matching approved claims found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = rows.map(claim => {
        const claimId = getClaimId(claim);
        const handover = findHandover(claimId, handovers);
        const completed = Boolean(handover);

        const statusClass = completed
            ? "status-completed"
            : "status-pending";

        return `
            <tr>
                <td>${escapeHTML(claimId || "Missing ID")}</td>

                <td>
                    ${escapeHTML(getItemName(claim, items))}
                </td>

                <td>
                    ${escapeHTML(getStudentName(claim))}
                </td>

                <td>
                    ${escapeHTML(getEmail(claim) || "—")}
                </td>

                <td>
                    <span class="status-pill ${statusClass}">
                        ${completed ? "Completed" : "Pending"}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        completed
                            ? formatDate(handover.completedAt)
                            : "—"
                    )}
                </td>

                <td>
                    ${
                        completed
                        ? `<button class="action-btn" disabled>
                               Completed
                           </button>`
                        : `<button
                               class="action-btn"
                               data-claim-id="${escapeHTML(claimId)}"
                               type="button">
                               Mark as Handed Over
                           </button>`
                    }
                </td>
            </tr>`;
    }).join("");
}

// ==========================================
// COMPLETE A HANDOVER
// ==========================================

function completeHandover(claimId) {
    if (!claimId) {
        showMessage("This claim has no ID. Check the claim data.", true);
        return;
    }

    const claims = readData(CLAIMS_KEY);
    const items = readData(ITEMS_KEY);
    const handovers = readData(HANDOVERS_KEY);

    const claim = claims.find(item =>
        getClaimId(item) === String(claimId)
    );

    if (!claim) {
        showMessage("Claim not found. Refresh the page.", true);
        return;
    }

    if (!isApproved(claim)) {
        showMessage("Only approved claims can be handed over.", true);
        return;
    }

    if (findHandover(claimId, handovers)) {
        showMessage("This handover has already been completed.", true);
        renderHandovers();
        return;
    }

    if (!getEmail(claim)) {
        showMessage(
            "The claim has no student email. Add the student's email before completing the handover.",
            true
        );
        return;
    }

    const confirmed = window.confirm(
        "Confirm that this item has been returned to the student?"
    );

    if (!confirmed) return;

    const handover = {
        id: "HO-" + Date.now(),
        claimId: String(claimId),
        itemId: getItemId(claim),
        itemName: getItemName(claim, items),
        studentName: getStudentName(claim),
        studentEmail: getEmail(claim),
        status: "Completed",
        completedAt: new Date().toISOString()
    };

    // Save the handover first.
    handovers.push(handover);

    if (!saveData(HANDOVERS_KEY, handovers)) {
        return;
    }

    // Update the item status if a matching item exists.
    const itemIndex = items.findIndex(item =>
        String(item.id ?? item.itemId ?? "") === getItemId(claim)
    );

    if (itemIndex !== -1) {
        items[itemIndex].itemStatus = "Returned";
        items[itemIndex].handoverStatus = "Completed";
        saveData(ITEMS_KEY, items);
    }

    showMessage("Handover recorded successfully.");
    renderHandovers();
}

// ==========================================
// BUTTON EVENTS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    renderHandovers();

    $("searchInput")?.addEventListener("input", renderHandovers);

    $("statusFilter")?.addEventListener("change", renderHandovers);

    $("refreshBtn")?.addEventListener("click", function () {
        renderHandovers();
        showMessage("Handover records refreshed.");
    });

    $("handoverTableBody")?.addEventListener("click", function (event) {
        const button = event.target.closest("[data-claim-id]");

        if (!button) return;

        completeHandover(button.dataset.claimId);
    });

    $("logoutBtn")?.addEventListener("click", function () {
        sessionStorage.removeItem("adminLoggedIn");
        sessionStorage.removeItem("userRole");
        window.location.href = "adminlogin.html";
    });
});

// Update the admin page if another tab changes these records.
window.addEventListener("storage", function (event) {
    if (
        event.key === CLAIMS_KEY ||
        event.key === ITEMS_KEY ||
        event.key === HANDOVERS_KEY
    ) {
        renderHandovers();
    }
});
