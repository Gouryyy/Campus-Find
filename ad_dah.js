
$(document).ready(function () {

    // Check whether the administrator is logged in
    if (
        sessionStorage.getItem("adminLoggedIn") !== "true" ||
        sessionStorage.getItem("userRole") !== "admin"
    ) {
        window.location.replace("adminlogin.html");
        return;
    }

    // Read saved data
    function getItems() {
        try {
            const data = JSON.parse(
                localStorage.getItem("campusfind_items") || "[]"
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function getClaims() {
        try {
            const data = JSON.parse(
                localStorage.getItem("campusfind_claims") || "[]"
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function getHandovers() {
        try {
            const data = JSON.parse(
                localStorage.getItem("campusfind_handovers") || "[]"
            );
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    // Update dashboard statistics
    function updateStatistics() {
        const items = getItems();
        const claims = getClaims();
        const handovers = getHandovers();

        $("#totalItems").text(items.length);

        const pending = items.filter(function (item) {
            return (item.itemStatus || "Pending").toLowerCase() === "pending";
        });

        $("#pendingItems").text(pending.length);
        $("#totalClaims").text(claims.length);

        const completed = handovers.filter(function (handover) {
            return (handover.status || "").toLowerCase() === "completed";
        });

        $("#totalHandovers").text(completed.length);
    }

    // Create item cards using DOM manipulation
    function displayItems() {
        const items = getItems();
        const searchText = $("#searchInput").val().trim().toLowerCase();
        const selectedType = $("#typeFilter").val().toLowerCase();
        const selectedStatus = $("#statusFilter").val().toLowerCase();

        const filteredItems = items.filter(function (item) {
            const name = (item.itemName || "").toLowerCase();
            const category = (item.category || "").toLowerCase();
            const location = (item.location || "").toLowerCase();
            const type = (item.reportType || "").toLowerCase();
            const status = (item.itemStatus || "Pending").toLowerCase();

            const matchesSearch =
                name.includes(searchText) ||
                category.includes(searchText) ||
                location.includes(searchText);

            const matchesType =
                selectedType === "" || type === selectedType;

            const matchesStatus =
                selectedStatus === "" || status === selectedStatus;

            return matchesSearch && matchesType && matchesStatus;
        });

        const container = $("#itemsContainer");
        container.empty();

        if (filteredItems.length === 0) {
            $("#emptyMessage").prop("hidden", false);
            return;
        }

        $("#emptyMessage").prop("hidden", true);

        filteredItems.forEach(function (item) {
            const name = item.itemName || "Unnamed item";
            const category = item.category || "Other";
            const location = item.location || "Not specified";
            const type = item.reportType || "Unknown";
            const status = item.itemStatus || "Pending";
            const date = item.reportDate || "Not specified";

            const card = $("<article>").addClass("item-card");
            const top = $("<div>").addClass("item-top");

            $("<span>")
                .addClass("item-type")
                .text(type)
                .appendTo(top);

            const statusClass =
                ["handed over", "completed"].includes(status.toLowerCase())
                    ? "item-status done"
                    : status.toLowerCase() === "claimed"
                    ? "item-status claimed"
                    : "item-status";

            $("<span>")
                .addClass(statusClass)
                .text(status)
                .appendTo(top);

            card.append(top);

            $("<h3>").text(name).appendTo(card);

            $("<p>")
                .text("Category: " + category)
                .appendTo(card);

            $("<p>")
                .text("Location: " + location)
                .appendTo(card);

            $("<p>")
                .text("Reported: " + date)
                .appendTo(card);

            container.append(card);
        });
    }

    // Search and filter event handling using jQuery
    $("#searchInput").on("input", displayItems);
    $("#typeFilter, #statusFilter").on("change", displayItems);

    // Logout event
    $("#logoutBtn").on("click", function () {
        const confirmLogout = window.confirm(
            "Are you sure you want to log out?"
        );

        if (confirmLogout) {
            sessionStorage.removeItem("adminLoggedIn");
            sessionStorage.removeItem("userRole");
            window.location.href = "adminlogin.html";
        }
    });

    // Refresh dashboard data
    function refreshDashboard() {
        updateStatistics();
        displayItems();
        $("#loadingMessage").hide();
    }

    // AJAX: load the claims JSON file.
    // The dashboard uses localStorage as the live data source.
    // This request also demonstrates AJAX JSON retrieval.
    $.ajax({
        url: "claims.json",
        method: "GET",
        dataType: "json",
        cache: false,

        success: function (data) {
            console.log("AJAX request successful. Claims JSON loaded.", data);
            refreshDashboard();
        },

        error: function () {
            console.log(
                "Could not load claims.json. Showing saved browser data instead."
            );
            refreshDashboard();
        }
    });

});
