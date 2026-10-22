
$(document).ready(function () {
    if (
        sessionStorage.getItem("adminLoggedIn") !== "true" ||
        sessionStorage.getItem("userRole") !== "admin"
    ) {
        window.location.href = "adminlogin.html";
        return;
    }

    let items = [];

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

    function toFrontendStatus(status) {
        const map = {
            Active: "Approved",
            Matched: "Pending",
            Claimed: "Claimed",
            Recovered: "Handed Over",
            Closed: "Handed Over"
        };
        return map[status] || "Pending";
    }

    function toBackendStatus(status) {
        const map = {
            Pending: "Active",
            Approved: "Active",
            Claimed: "Claimed",
            "Handed Over": "Recovered"
        };
        return map[status] || "Active";
    }

    function getStatusClass(status) {
        return String(status || "Pending")
            .toLowerCase()
            .replace(/\s+/g, "-");
    }

    function getItemName(item) {
        return item.title || item.itemName || "";
    }

    function getItemType(item) {
        return item.type || item.reportType || "";
    }

    function getItemDate(item) {
        const date = item.date || item.reportDate;
        if (!date) return "";
        return String(date).slice(0, 10);
    }

    function getReporter(item) {
        if (item.userId && typeof item.userId === "object") {
            return item.userId.name || "Not provided";
        }
        return item.reporter || "Not provided";
    }

    function updateStats() {
        $("#totalItems").text(items.length);

        $("#pendingItems").text(
            items.filter(item =>
                toFrontendStatus(item.status || item.itemStatus) === "Pending"
            ).length
        );

        $("#foundItems").text(
            items.filter(item => getItemType(item) === "Found").length
        );

        $("#lostItems").text(
            items.filter(item => getItemType(item) === "Lost").length
        );
    }

    function renderItems() {
        const search = ($("#searchInput").val() || "").trim().toLowerCase();
        const type = $("#typeFilter").val();
        const status = $("#statusFilter").val();

        const filtered = items.filter(function (item) {
            const name = getItemName(item);
            const itemType = getItemType(item);
            const itemStatus = toFrontendStatus(item.status || item.itemStatus);

            const searchableText = [
                name,
                item.category,
                getReporter(item),
                item.location,
                item.description
            ].join(" ").toLowerCase();

            return searchableText.includes(search) &&
                (!type || itemType === type) &&
                (!status || itemStatus === status);
        });

        const rows = filtered.map(function (item) {
            const id = escapeHTML(item._id || item.itemId || "");
            const name = getItemName(item);
            const itemType = getItemType(item);
            const itemStatus = toFrontendStatus(item.status || item.itemStatus);

            return `
                <tr>
                    <td>
                        <div class="item-title">${escapeHTML(name)}</div>
                        <div class="item-category">${escapeHTML(item.category || "Other")}</div>
                    </td>
                    <td>
                        <span class="badge type-${String(itemType).toLowerCase()}">
                            ${escapeHTML(itemType)}
                        </span>
                    </td>
                    <td>${escapeHTML(getReporter(item))}</td>
                    <td>${escapeHTML(item.location || "Not provided")}</td>
                    <td>${escapeHTML(getItemDate(item) || "—")}</td>
                    <td>
                        <span class="badge status-${getStatusClass(itemStatus)}">
                            ${escapeHTML(itemStatus)}
                        </span>
                    </td>
                    <td>
                        <div class="action-group">
                            <button class="action-btn edit-btn"
                                    data-action="edit" data-id="${id}">
                                Edit
                            </button>
                            <button class="action-btn delete-btn"
                                    data-action="delete" data-id="${id}">
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

    async function loadItems() {
        try {
            const response = await fetch("/api/items", {
                credentials: "same-origin"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load items.");
            }

            items = Array.isArray(data) ? data : [];
            renderItems();
        } catch (error) {
            console.error("Load items error:", error);
            alert("Could not load items from the server. Please refresh the page.");
        }
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

    $("#itemForm").on("submit", async function (event) {
        event.preventDefault();

        const id = $("#itemId").val();

        const itemData = {
            title: $("#itemName").val().trim(),
            category: $("#category").val(),
            type: $("#reportType").val(),
            reporter: $("#reporter").val().trim(),
            location: $("#location").val().trim(),
            date: $("#reportDate").val(),
            description: $("#description").val().trim(),
            status: toBackendStatus($("#itemStatus").val())
        };

        if (
            !itemData.title ||
            !itemData.category ||
            !itemData.type ||
            !itemData.reporter ||
            !itemData.location ||
            !itemData.date ||
            !itemData.description
        ) {
            alert("Please fill in all required fields, including description.");
            return;
        }

        const saveButton = $("#saveBtn");
        saveButton.prop("disabled", true);

        try {
            const response = await fetch(
                id ? `/api/items/${encodeURIComponent(id)}` : "/api/items",
                {
                    method: id ? "PUT" : "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(itemData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save item.");
            }

            alert(id ? "Item updated successfully." : "New item saved to MongoDB.");
            resetForm();
            $("#itemForm").prop("hidden", true);
            await loadItems();
        } catch (error) {
            console.error("Save item error:", error);
            alert(error.message);
        } finally {
            saveButton.prop("disabled", false);
        }
    });

    $("#itemsTableBody").on("click", "button", async function () {
        const id = String($(this).data("id"));
        const action = $(this).data("action");
        const item = items.find(item => String(item._id || item.itemId) === id);

        if (!item) {
            alert("Item not found. Please refresh the page.");
            return;
        }

        if (action === "edit") {
            $("#itemId").val(item._id || item.itemId);
            $("#itemName").val(getItemName(item));
            $("#category").val(item.category || "");
            $("#reportType").val(getItemType(item));
            $("#reporter").val(getReporter(item));
            $("#location").val(item.location || "");
            $("#reportDate").val(getItemDate(item));
            $("#description").val(item.description || "");
            $("#itemStatus").val(
                toFrontendStatus(item.status || item.itemStatus)
            );

            $("#formTitle").text("Edit Item");
            $("#saveBtn").text("Update Item");
            showForm();
        }

        if (action === "delete") {
            if (!confirm(`Are you sure you want to delete "${getItemName(item)}"?`)) {
                return;
            }

            try {
                const response = await fetch(
                    `/api/items/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin"
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not delete item.");
                }

                alert("Item deleted successfully.");
                await loadItems();
            } catch (error) {
                console.error("Delete item error:", error);
                alert(error.message);
            }
        }
    });

    $("#searchInput, #typeFilter, #statusFilter").on(
        "input change",
        renderItems
    );

    $("#logoutBtn").on("click", async function () {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin"
            });
        } catch (error) {
            console.error("Logout error:", error);
        }

        sessionStorage.removeItem("adminLoggedIn");
        sessionStorage.removeItem("userRole");
        window.location.href = "adminlogin.html";
    });

    loadItems();
});
