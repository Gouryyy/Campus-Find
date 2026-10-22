
const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");

// GET /api/claims
// Students see their own claims; admins can see all claims.
exports.getClaims = async (req, res) => {
    try {
        const filter = req.session.role === "admin"
            ? {}
            : { claimantId: req.session.userId };

        const claims = await Claim.find(filter)
            .populate("itemId")
            .populate("claimantId", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json(claims);
    } catch (error) {
        console.error("Get claims error:", error.name, error.message);

        return res.status(500).json({
            message: "Could not retrieve claims.",
            error: error.message
        });
    }
};

// POST /api/claims
// Submit a claim for a found item.
exports.createClaim = async (req, res) => {
    try {
        console.log("CREATE CLAIM CONTROLLER REACHED");

        const { itemId, message } = req.body;

        // Validate the item ID.
        if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                message: "A valid item ID is required."
            });
        }

        // Validate the proof or identifying details.
        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                message: "Please provide details to identify the item."
            });
        }

        // Verify the item exists in MongoDB.
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found in the database."
            });
        }

        if (item.type !== "Found") {
            return res.status(400).json({
                message: "Only found items can be claimed."
            });
        }

        if (["Claimed", "Recovered", "Closed"].includes(item.status)) {
            return res.status(400).json({
                message: "This item is no longer available to claim."
            });
        }

        // Verify the student session.
        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please log in before submitting a claim."
            });
        }

        // Prevent duplicate active claims.
        const existingClaim = await Claim.findOne({
            itemId: item._id,
            claimantId: req.session.userId,
            status: { $in: ["Pending", "Approved"] }
        });

        if (existingClaim) {
            return res.status(409).json({
                message: "You already have an active claim for this item."
            });
        }

        // Save the claim to MongoDB.
        const claim = await Claim.create({
            itemId: item._id,
            claimantId: req.session.userId,
            message: message.trim(),
            status: "Pending"
        });

        console.log("Claim saved successfully:", claim._id.toString());

        return res.status(201).json({
            message: "Claim submitted successfully.",
            claim
        });
    } catch (error) {
        console.error(
            "Create claim error:",
            error.name,
            error.message
        );

        return res.status(500).json({
            message: "Could not submit claim.",
            error: error.message
        });
    }
};

// PATCH /api/claims/:id
// Only admins can change a claim's status.
exports.updateClaim = async (req, res) => {
    try {
        if (req.session.role !== "admin") {
            return res.status(403).json({
                message: "Only administrators can update claim status."
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid claim ID."
            });
        }

        if (!["Pending", "Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid claim status."
            });
        }

        const claim = await Claim.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        )
            .populate("itemId")
            .populate("claimantId", "name email");

        if (!claim) {
            return res.status(404).json({
                message: "Claim not found."
            });
        }

        return res.status(200).json({
            message: "Claim status updated successfully.",
            claim
        });
    } catch (error) {
        console.error("Update claim error:", error.name, error.message);

        return res.status(500).json({
            message: "Could not update claim status.",
            error: error.message
        });
    }
};
