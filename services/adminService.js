
const Item = require("../models/Item");
const Claim = require("../models/Claim");

async function getDashboardStats() {
  const [
    totalLostItems,
    totalFoundItems,
    pendingClaims,
    recoveredItems
  ] = await Promise.all([
    Item.countDocuments({ type: "Lost" }),
    Item.countDocuments({ type: "Found" }),
    Claim.countDocuments({ status: "Pending" }),
    Item.countDocuments({ status: "Recovered" })
  ]);

  return {
    totalLostItems,
    totalFoundItems,
    pendingClaims,
    recoveredItems
  };
}

module.exports = { getDashboardStats };
