
const Item = require("../models/Item");
const Claim = require("../models/Claim");

async function markItemRecovered(claimId) {
  const claim = await Claim.findById(claimId);

  if (!claim) {
    throw new Error("Claim not found");
  }

  if (claim.status !== "Approved") {
    throw new Error("Only approved claims can recover an item");
  }

  const item = await Item.findById(claim.itemId);

  if (!item) {
    throw new Error("Item not found");
  }

  item.status = "Recovered";
  await item.save();

  return item;
}

module.exports = { markItemRecovered };
