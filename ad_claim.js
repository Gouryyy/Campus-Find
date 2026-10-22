
document.addEventListener("DOMContentLoaded", function () {
    const CLAIMS_KEY = "campusfind_claims";
    const ITEMS_KEY = "campusfind_items";

    let claims = [];
    let items = [];

    // Find page elements without changing existing IDs
    const tableBody =
        document.getElementById("claimsTableBody") ||
        document.getElementById("claimsBody") ||
        document.getElementById("claimsList") ||
        document.querySelector("#claimsTable tbody") ||
        document.querySelector("tbody");

    const searchInput =
        document.getElementById("searchInput") ||
        document.getElementById("claimSearch");

    const filterSelect =
        document.getElementById("statusFilter") ||
        document.getElementById("claimStatusFilter");

    // Read saved data
    function readData(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Unable to read " + key, error);
            return [];
        }
    }

    // Save data
    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error("Unable to save " + key, error);
            alert("Could not save changes. Please check browser storage.");
            return false;
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function getClaimId(claim) {
        return String(claim.claimId ?? claim.id ?? "");
    }

    function getItemId(item) {
        return String(item.itemId ?? item.id ?? "");
    }

    function getClaimItemId(claim) {
        return String(claim.itemId ?? "");
    }

    function loadData() {
        claims = readData(CLAIMS_KEY);
        items = readData(ITEMS_KEY);
        renderClaims();
        updateCounts();
    }

    // Display claims submitted by students
    function renderClaims() {
        if (!tableBody) {
            console.error(
                "Claims table body not found. Check the tbody ID in admin_claim.html."
            );
            return;
        }

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedStatus = filterSelect
            ? filterSelect.value.toLowerCase()
            : "all";

        const filteredClaims = claims.filter(function (claim) {
            const text = [
                claim.claimId,
                claim.itemName,
                claim.claimantName,
                claim.claimantEmail,
                claim.status
            ].join(" ").toLowerCase();

            const matchesSearch = text.includes(searchTerm);
            const status = String(claim.status || "Pending").toLowerCase();

            const matchesStatus =
                selectedStatus === "all" ||
                selectedStatus === "" ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (filteredClaims.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:20px;">
                        No claims found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredClaims.map(function (claim) {
            const claimId = getClaimId(claim);
            const status = claim.status || "Pending";

            let actions = "";

            if (status === "Pending") {
                actions = `
                    <button type="button" data-action="approve"
                        data-id="${escapeHTML(claimId)}">Approve</button>
                    <button type="button" data-action="reject"
                        data-id="${escapeHTML(claimId)}">Reject</button>
                `;
            } else if (status === "Approved") {
                actions = `
                    <button type="button" data-action="complete"
                        data-id="${escapeHTML(claimId)}">Mark Completed</button>
                    <button type="button" data-action="reject"
                        data-id="${escapeHTML(claimId)}">Reject</button>
                `;
            } else {
                actions = "—";
            }

            return `
                <tr>
                    <td>${escapeHTML(claimId)}</td>
                    <td>${escapeHTML(claim.itemName || "Unknown item")}</td>
                    <td>${escapeHTML(claim.claimantName || "Unknown student")}</td>
                    <td>${escapeHTML(claim.claimantEmail || "")}</td>
                    <td>${escapeHTML(claim.claimDate || "")}</td>
                    <td>
                        <strong>${escapeHTML(status)}</strong>
                        <br>
                        <button type="button" data-action="proof"
                            data-id="${escapeHTML(claimId)}">
                            View Proof
                        </button>
                    </td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join("");
    }

    function updateCounts() {
        const pending = claims.filter(c => (c.status || "Pending") === "Pending").length;
        const approved = claims.filter(c => c.status === "Approved").length;
        const rejected = claims.filter(c => c.status === "Rejected").length;
        const completed = claims.filter(c => c.status === "Completed").length;

        const pendingEl = document.getElementById("pendingCount");
        const approvedEl = document.getElementById("approvedCount");
        const rejectedEl = document.getElementById("rejectedCount");
        const completedEl = document.getElementById("completedCount");

        if (pendingEl) pendingEl.textContent = pending;
        if (approvedEl) approvedEl.textContent = approved;
        if (rejectedEl) rejectedEl.textContent = rejected;
        if (completedEl) completedEl.textContent = completed;
    }

    function updateItemStatus(itemId, status) {
        const item = items.find(i => getItemId(i) === String(itemId));

        if (!item) return;

        // Preserve whichever status field the item already uses.
        if ("itemStatus" in item) {
            item.itemStatus = status;
        } else if ("status" in item) {
            item.status = status;
        } else {
            item.status = status;
        }

        saveData(ITEMS_KEY, items);
    }

    function handleAction(action, claimId) {
        const claim = claims.find(c => getClaimId(c) === String(claimId));

        if (!claim) {
            alert("Claim not found. Please refresh the page.");
            loadData();
            return;
        }

        if (action === "proof") {
            alert(
                "Claim proof:\n\n" + (claim.proof || "No proof provided.") +
                "\n\nAdditional notes:\n" + (claim.notes || "None")
            );
            return;
        }

        if (action === "approve") {
            if (claim.status !== "Pending") {
                alert("Only pending claims can be approved.");
                return;
            }

            if (!confirm("Approve this student's claim?")) return;

            claim.status = "Approved";
            updateItemStatus(claim.itemId, "Claimed");
        } else if (action === "reject") {
            if (!confirm("Reject this student's claim?")) return;

            claim.status = "Rejected";

            // Make the item available again if no other active claim exists.
            const anotherActiveClaim = claims.some(c =>
                getClaimItemId(c) === getClaimItemId(claim) &&
                getClaimId(c) !== getClaimId(claim) &&
                ["Pending", "Approved"].includes(c.status)
            );

            if (!anotherActiveClaim) {
                updateItemStatus(claim.itemId, "Available");
            }
        } else if (action === "complete") {
            if (claim.status !== "Approved") {
                alert("Approve the claim before marking it completed.");
                return;
            }

            if (!confirm("Mark this claim as completed?")) return;

            claim.status = "Completed";
            updateItemStatus(claim.itemId, "Handed Over");
        }

        if (saveData(CLAIMS_KEY, claims)) {
            loadData();
            alert("Claim status updated successfully.");
        }
    }

    // Handle action buttons
    if (tableBody) {
        tableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            handleAction(button.dataset.action, button.dataset.id);
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", renderClaims);
    }

    if (filterSelect) {
        filterSelect.addEventListener("change", renderClaims);
    }

    // Update when the student dashboard changes localStorage in another tab.
    window.addEventListener("storage", function (event) {
        if (
            event.key === CLAIMS_KEY ||
            event.key === ITEMS_KEY ||
            event.key === null
        ) {
            loadData();
        }
    });

    // Initial load
    loadData();

    // Optional refresh if the admin leaves the page open.
    window.addEventListener("focus", loadData);
});
