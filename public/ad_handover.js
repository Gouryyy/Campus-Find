
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/handovers";
  const CLAIMS_URL = "/api/claims";

  const tableBody = document.querySelector("#handoversTableBody");
  const searchInput = document.querySelector("#searchInput");
  const statusFilter = document.querySelector("#statusFilter");
  const refreshButton = document.querySelector("#refreshBtn");

  let handovers = [];
  let claims = [];

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  function getClaimId(claim) {
    return claim?._id || claim?.id || "";
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

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString();
  }

  async function loadData() {
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="6">Loading handovers...</td></tr>';
    }

    try {
      const [handoverData, claimData] = await Promise.all([
        apiRequest(API_URL),
        apiRequest(CLAIMS_URL)
      ]);

      handovers = Array.isArray(handoverData) ? handoverData : [];
      claims = Array.isArray(claimData) ? claimData : [];

      renderHandovers();
    } catch (error) {
      console.error("Loading handovers failed:", error);

      if (tableBody) {
        tableBody.innerHTML =
          `<tr><td colspan="6">${escapeHTML(error.message)}</td></tr>`;
      }
    }
  }

  function renderHandovers() {
    if (!tableBody) return;

    const search = (searchInput?.value || "").toLowerCase().trim();
    const selectedStatus = statusFilter?.value || "all";

    const completedClaimIds = new Set(
      handovers.map(handover =>
        handover.claimId?._id || handover.claimId
      ).map(String)
    );

    const approvedClaims = claims.filter(claim =>
      claim.status === "Approved"
    );

    const rows = approvedClaims
      .map(claim => {
        const claimId = getClaimId(claim);
        const handover = handovers.find(entry =>
          String(entry.claimId?._id || entry.claimId) === String(claimId)
        );

        return { claim, handover };
      })
      .filter(({ claim, handover }) => {
        const completed = completedClaimIds.has(String(getClaimId(claim)));

        if (selectedStatus === "completed" && !completed) return false;
        if (selectedStatus === "pending" && completed) return false;

        const searchable = [
          getItemName(claim),
          getStudentName(claim),
          getStudentEmail(claim),
          handover?.status || "Pending"
        ].join(" ").toLowerCase();

        return searchable.includes(search);
      });

    if (!rows.length) {
      tableBody.innerHTML =
        '<tr><td colspan="6">No handovers found.</td></tr>';
      return;
    }

    tableBody.innerHTML = rows.map(({ claim, handover }) => {
      const completed = Boolean(handover);
      const claimId = getClaimId(claim);

      return `
        <tr>
          <td>${escapeHTML(getItemName(claim))}</td>
          <td>${escapeHTML(getStudentName(claim))}</td>
          <td>${escapeHTML(getStudentEmail(claim) || "—")}</td>
          <td>${escapeHTML(completed
            ? formatDate(handover.completedAt)
            : "—")}</td>
          <td>${completed ? "Completed" : "Pending"}</td>
          <td>
            ${completed
              ? "Completed"
              : `<button type="button"
                    class="complete-handover-btn"
                    data-claim-id="${escapeHTML(claimId)}">
                    Complete Handover
                 </button>`}
          </td>
        </tr>
      `;
    }).join("");
  }

  async function completeHandover(claimId) {
    if (!claimId) return;

    try {
      await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify({ claimId })
      });

      alert("Handover completed successfully.");
      await loadData();
    } catch (error) {
      console.error("Completing handover failed:", error);
      alert(error.message || "Could not complete handover.");
    }
  }

  tableBody?.addEventListener("click", event => {
    const button = event.target.closest(".complete-handover-btn");

    if (button) {
      completeHandover(button.dataset.claimId);
    }
  });

  searchInput?.addEventListener("input", renderHandovers);
  statusFilter?.addEventListener("change", renderHandovers);
  refreshButton?.addEventListener("click", loadData);

  loadData();
});
