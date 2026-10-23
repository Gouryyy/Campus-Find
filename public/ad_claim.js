
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("claimsTableBody");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const emptyMessage = document.getElementById("emptyMessage");
    const resultCount = document.getElementById("resultCount");

    let claims = [];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getClaimId(claim) {
        return claim?._id || "";
    }

    function getItemName(claim) {
        return claim?.itemId?.title || "Unknown item";
    }

    function getStudentName(claim) {
        return claim?.claimantId?.name || "Unknown student";
    }

    function getStudentEmail(claim) {
        return claim?.claimantId?.email || "";
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-IN");
    }

    function updateCounts() {
        document.getElementById("totalClaims").textContent = claims.length;

        document.getElementById("pendingClaims").textContent =
            claims.filter(claim => claim.status === "Pending").length;

        document.getElementById("approvedClaims").textContent =
            claims.filter(claim => claim.status === "Approved").length;

        document.getElementById("rejectedClaims").textContent =
            claims.filter(claim => claim.status === "Rejected").length;
    }

    async function loadClaims() {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:20px;">
                    Loading claims...
                </td>
            </tr>
        `;

        try {
            const response = await fetch("/api/claims", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load claims.");
            }

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response from the server.");
            }

            claims = data;
            updateCounts();
            renderClaims();

        } catch (error) {
            console.error("Load claims error:", error);

            tableBody.innerHTML = "";
            emptyMessage.hidden = false;
            emptyMessage.textContent =
                error.message || "Could not load claims.";

            resultCount.textContent = "Unable to load claims";

            document.getElementById("totalClaims").textContent = "—";
            document.getElementById("pendingClaims").textContent = "—";
            document.getElementById("approvedClaims").textContent = "—";
            document.getElementById("rejectedClaims").textContent = "—";
        }
    }

    function renderClaims() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredClaims = claims.filter(claim => {
            const searchableText = [
                getClaimId(claim),
                getItemName(claim),
                getStudentName(claim),
                getStudentEmail(claim),
                claim.status,
                claim.message
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesStatus =
                !selectedStatus || claim.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        resultCount.textContent =
            `Showing ${filteredClaims.length} of ${claims.length} claims`;

        emptyMessage.hidden = filteredClaims.length > 0;

        emptyMessage.textContent = claims.length === 0
            ? "No claims have been submitted yet."
            : "No claims match your search or filter.";

        if (filteredClaims.length === 0) {
            tableBody.innerHTML = "";
            return;
        }

        tableBody.innerHTML = filteredClaims.map(claim => {
            const id = getClaimId(claim);
            const status = claim.status || "Pending";

            let actions = "—";

            if (status === "Pending") {
                actions = `
                    <button type="button"
                        data-action="Approved"
                        data-id="${escapeHTML(id)}">
                        Approve
                    </button>

                    <button type="button"
                        data-action="Rejected"
                        data-id="${escapeHTML(id)}">
                        Reject
                    </button>
                `;
            }

            return `
                <tr>
                    <td>${escapeHTML(id.slice(-8).toUpperCase())}</td>

                    <td>
                        <span class="item-name">
                            ${escapeHTML(getItemName(claim))}
                        </span>
                    </td>

                    <td>
                        ${escapeHTML(getStudentName(claim))}
                        <br>
                        <small>${escapeHTML(getStudentEmail(claim))}</small>
                    </td>

                    <td>${escapeHTML(formatDate(claim.createdAt))}</td>

                    <td>
                        ${escapeHTML(claim.message || "No proof provided.")}
                    </td>

                    <td>
                        <span class="status-badge status-${escapeHTML(
                            status.toLowerCase()
                        )}">
                            ${escapeHTML(status)}
                        </span>
                    </td>

                    <td>${actions}</td>
                </tr>
            `;
        }).join("");
    }

    async function updateClaimStatus(claimId, status) {
        const actionText = status === "Approved" ? "approve" : "reject";

        if (!confirm(`Are you sure you want to ${actionText} this claim?`)) {
            return;
        }

        try {
            const response = await fetch(
                `/api/claims/${encodeURIComponent(claimId)}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({ status })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not update claim status."
                );
            }

            alert(`Claim ${status.toLowerCase()} successfully.`);
            await loadClaims();

        } catch (error) {
            console.error("Update claim error:", error);
            alert(error.message || "Could not update claim status.");
        }
    }

    tableBody.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        updateClaimStatus(
            button.dataset.id,
            button.dataset.action
        );
    });

    searchInput.addEventListener("input", renderClaims);
    statusFilter.addEventListener("change", renderClaims);

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                const response = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });

                if (response.ok) {
                    window.location.href = "adminlogin.html";
                } else {
                    alert("Logout failed. Please try again.");
                }

            } catch (error) {
                console.error("Logout error:", error);
                alert("Could not connect to the server.");
            }
        });
    }

    loadClaims();
});
