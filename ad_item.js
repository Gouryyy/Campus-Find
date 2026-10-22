
$(document).ready(function () {
    // Check that the admin has logged in.
    if (
        sessionStorage.getItem("adminLoggedIn") !== "true" ||
        sessionStorage.getItem("userRole") !== "admin"
    ) {
        window.location.href = "adminlogin.html";
        return;
    }

    const STORAGE_KEY = "campusfind_items";

    let items = loadItems();

    function loadItems() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not read saved items:", error);
            return [];
        }
    }

    function saveItems() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

    function getStatusClass(status) {
        return String(status || "Pending")
            .toLowerCase()
            .replace(/\s+/g, "-");
    }

    function updateStats() {
        $("#totalItems").text(items.length);

        $("#pendingItems").text(
            items.filter(item => (item.itemStatus || "Pending") === "Pending").length
        );

        $("#foundItems").text(
            items.filter(item => item.reportType === "Found").length
        );

        $("#lostItems").text(
            items.filter(item => item.reportType === "Lost").length
        );
    }

    function renderItems() {
        const search = $("#searchInput").val().trim().toLowerCase();
        const type = $("#typeFilter").val();
        const status = $("#statusFilter").val();

        const filtered = items.filter(function (item) {
            const searchableText = [
                item.itemName,
                item.category,
                item.reporter,
                item.location,
                item.description
            ].join(" ").toLowerCase();

            return searchableText.includes(search) &&
                (!type || item.reportType === type) &&
                (!status || (item.itemStatus || "Pending") === status);
        });

        const rows = filtered.map(function (item) {
            const itemId = escapeHTML(item.itemId);
            const itemStatus = item.itemStatus || "Pending";

            return `
                <tr>
                    <td>
                        <div class="item-title">${escapeHTML(item.itemName)}</div>
                        <div class="item-category">${escapeHTML(item.category || "Other")}</div>
                    </td>
                    <td>
                        <span class="badge type-${String(item.reportType).toLowerCase()}">
                            ${escapeHTML(item.reportType)}
                        </span>
                    </td>
                    <td>${escapeHTML(item.reporter || "Not provided")}</td>
                    <td>${escapeHTML(item.location || "Not provided")}</td>
                    <td>${escapeHTML(item.reportDate || "—")}</td>
                    <td>
                        <span class="badge status-${getStatusClass(itemStatus)}">
                            ${escapeHTML(itemStatus)}
                        </span>
                    </td>
                    <td>
                        <div class="action-group">
                            <button class="action-btn edit-btn"
                                    data-action="edit" data-id="${itemId}">
                                Edit
                            </button>
                            <button class="action-btn delete-btn"
                                    data-action="delete" data-id="${itemId}">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        $("#itemsTableBody").html(rows.join(""));
        $("#emptyMessage").prop("hidden", filtered.length !== 0);
        $("#resultCount").text(
            `Showing ${filtered.length} of ${items.length} items`
        );

        updateStats();
    }

    function resetForm() {
        $("#itemForm")[0].reset();
        $("#itemId").val("");
        $("#formTitle").text("Add New Item");
        $("#saveBtn").text("Save Item");
        $("#itemStatus").val("Pending");
    }

    function showForm() {
        $("#itemForm").prop("hidden", false);
        document.getElementById("itemForm").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    $("#showFormBtn").on("click", function () {
        resetForm();
        showForm();
    });

    $("#cancelBtn").on("click", function () {
        resetForm();
        $("#itemForm").prop("hidden", true);
    });

    $("#itemForm").on("submit", function (event) {
        event.preventDefault();

        const id = $("#itemId").val();

        const itemData = {
            itemName: $("#itemName").val().trim(),
            category: $("#category").val(),
            reportType: $("#reportType").val(),
            reporter: $("#reporter").val().trim(),
            location: $("#location").val().trim(),
            reportDate: $("#reportDate").val(),
            description: $("#description").val().trim(),
            itemStatus: $("#itemStatus").val()
        };

        if (
            !itemData.itemName ||
            !itemData.category ||
            !itemData.reportType ||
            !itemData.reporter ||
            !itemData.location ||
            !itemData.reportDate
        ) {
            alert("Please fill in all required fields.");
            return;
        }

        if (id) {
            const index = items.findIndex(item => String(item.itemId) === id);

            if (index !== -1) {
                // Preserve extra fields, such as reporterEmail, used by the student dashboard.
                items[index] = {
                    ...items[index],
                    ...itemData,
                    itemId: items[index].itemId
                };
                alert("Item updated successfully.");
            }
        } else {
            itemData.itemId = "ITEM-" + Date.now();
            itemData.createdAt = new Date().toISOString();
            items.unshift(itemData);
            alert("New item added successfully.");
        }

        saveItems();
        resetForm();
        $("#itemForm").prop("hidden", true);
        renderItems();
    });

    $("#itemsTableBody").on("click", "button", function () {
        const id = String($(this).data("id"));
        const action = $(this).data("action");
        const item = items.find(item => String(item.itemId) === id);

        if (!item) {
            alert("This item could not be found. Please refresh the page.");
            return;
        }

        if (action === "edit") {
            $("#itemId").val(item.itemId);
            $("#itemName").val(item.itemName || "");
            $("#category").val(item.category || "");
            $("#reportType").val(item.reportType || "");
            $("#reporter").val(item.reporter || "");
            $("#location").val(item.location || "");
            $("#reportDate").val(item.reportDate || "");
            $("#description").val(item.description || "");
            $("#itemStatus").val(item.itemStatus || "Pending");

            $("#formTitle").text("Edit Item");
            $("#saveBtn").text("Update Item");
            showForm();
        }

        if (action === "delete") {
            const confirmed = confirm(
                `Are you sure you want to delete "${item.itemName}"?`
            );

            if (confirmed) {
                items = items.filter(item => String(item.itemId) !== id);
                saveItems();
                renderItems();
                alert("Item deleted.");
            }
        }
    });

    $("#searchInput, #typeFilter, #statusFilter").on("input change", renderItems);

    $("#logoutBtn").on("click", function () {
        sessionStorage.removeItem("adminLoggedIn");
        sessionStorage.removeItem("userRole");
        window.location.href = "adminlogin.html";
    });

    // AJAX demonstration: load the claims JSON file.
    // The item table itself uses localStorage so admin and student pages
    // can share newly reported items on the same browser origin.
    $.ajax({
        url: "claims.json",
        method: "GET",
        dataType: "json"
    })
    .done(function (data) {
        console.log("claims.json loaded successfully.", data);
    })
    .fail(function () {
        console.log(
            "claims.json was not loaded. Item management still works using localStorage."
        );
    });

    renderItems();
});
