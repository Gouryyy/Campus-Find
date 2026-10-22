
$(document).ready(function () {

    // Check admin login state
    if (
        sessionStorage.getItem("adminLoggedIn") !== "true" ||
        sessionStorage.getItem("userRole") !== "admin"
    ) {
        window.location.replace("adminlogin.html");
        return;
    }

    let items = [];
    let claims = [];

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

    // Load items and claims from the backend API
    async function loadDashboardData() {
        $("#loadingMessage").show();
        $("#emptyMessage").prop("hidden", true);

        try {
            const [itemsResponse, claimsResponse] = await Promise.all([
                fetch("/api/items", {
                    credentials: "same-origin"
                }),
                fetch("/api/claims", {
                    credentials: "same-origin"
                })
            ]);

            if (!itemsResponse.ok || !claimsResponse.ok) {
                throw new Error(
                    "Could not load dashboard data. Please check your admin login."
                );
            }

            const itemsData = await itemsResponse.json();
            const claimsData = await claimsResponse.json();

            if (!Array.isArray(itemsData) || !Array.isArray(claimsData)) {
                throw new Error("Unexpected data received from the server.");
            }

            // Convert database items to the fields used by the dashboard.
            items = itemsData.map(item => ({
                itemId: item._id,
                itemName: item.title,
                category: item.category,
                location: item.location,
                reportType: item.type,
                itemStatus: item.status,
                reportDate: item.date
                    ? new Date(item.date).toLocaleDateString()
                    : "Not specified"
            }));

            claims = claimsData;

            updateStatistics();
            displayItems();

        } catch (error) {
            console.error("Dashboard loading error:", error);
            $("#itemsContainer").empty();
            $("#emptyMessage")
                .text(error.message || "Could not load dashboard data.")
                .prop("hidden", false);
        } finally {
            $("#loadingMessage").hide();
        }
    }

    // Update statistics using database results
    function updateStatistics() {
        $("#totalItems").text(items.length);

        const pendingItems = items.filter(item =>
            ["pending"].includes(
                String(item.itemStatus || "").toLowerCase()
            )
        );

        $("#pendingItems").text(pendingItems.length);
        $("#totalClaims").text(claims.length);

        // Handovers are not connected to a database API yet.
        // Avoid displaying an inaccurate count from localStorage.
        $("#totalHandovers").text("—");
    }

    // Display items
    function displayItems() {
        const searchText = $("#searchInput").val().trim().toLowerCase();
        const selectedType = $("#typeFilter").val().toLowerCase();
        const selectedStatus = $("#statusFilter").val().toLowerCase();

        const filteredItems = items.filter(item => {
            const name = String(item.itemName || "").toLowerCase();
            const category = String(item.category || "").toLowerCase();
            const location = String(item.location || "").toLowerCase();
            const type = String(item.reportType || "").toLowerCase();
            const status = String(item.itemStatus || "").toLowerCase();

            return (
                (
                    name.includes(searchText) ||
                    category.includes(searchText) ||
                    location.includes(searchText)
                ) &&
                (!selectedType || type === selectedType) &&
                (!selectedStatus || status === selectedStatus)
            );
        });

        const container = $("#itemsContainer");
        container.empty();

        if (filteredItems.length === 0) {
            $("#emptyMessage")
                .text("No items found.")
                .prop("hidden", false);
            return;
        }

        $("#emptyMessage").prop("hidden", true);

        filteredItems.forEach(item => {
            const name = item.itemName || "Unnamed item";
            const category = item.category || "Other";
            const location = item.location || "Not specified";
            const type = item.reportType || "Unknown";
            const status = item.itemStatus || "Active";

            const card = $("<article>").addClass("item-card");
            const top = $("<div>").addClass("item-top");

            $("<span>")
                .addClass("item-type")
                .text(type)
                .appendTo(top);

            const normalizedStatus = status.toLowerCase();

            const statusClass =
                ["handed over", "completed", "recovered"].includes(normalizedStatus)
                    ? "item-status done"
                    : normalizedStatus === "claimed"
                    ? "item-status claimed"
                    : "item-status";

            $("<span>")
                .addClass(statusClass)
                .text(status)
                .appendTo(top);

            card.append(top);
            $("<h3>").text(name).appendTo(card);
            $("<p>").text("Category: " + category).appendTo(card);
            $("<p>").text("Location: " + location).appendTo(card);
            $("<p>").text("Reported: " + item.reportDate).appendTo(card);

            container.append(card);
        });
    }

    // Search and filters
    $("#searchInput").on("input", displayItems);
    $("#typeFilter, #statusFilter").on("change", displayItems);

    // Log out through the backend session
    $("#logoutBtn").on("click", async function () {
        if (!window.confirm("Are you sure you want to log out?")) {
            return;
        }

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (!response.ok) {
                alert("Logout failed. Please try again.");
                return;
            }

            sessionStorage.clear();
            window.location.href = "adminlogin.html";
        } catch (error) {
            console.error("Logout error:", error);
            alert("Could not connect to the server.");
        }
    });

    // Initial database load
    loadDashboardData();
});
