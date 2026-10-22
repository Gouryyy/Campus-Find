
const Item = require("../models/Item");

// Convert text to lowercase words for comparison
function getKeywords(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Calculate a potential match score between two items
function calculateMatchScore(item1, item2) {
  // Only compare Lost reports with Found reports
  if (item1.type === item2.type) {
    return 0;
  }

  let score = 0;

  // 1. Category match: 30 points
  if (
    item1.category &&
    item2.category &&
    item1.category.toLowerCase() ===
      item2.category.toLowerCase()
  ) {
    score += 30;
  }

  // 2. Location match: 30 points
  if (
    item1.location &&
    item2.location &&
    item1.location.toLowerCase().trim() ===
      item2.location.toLowerCase().trim()
  ) {
    score += 30;
  }

  // 3. Date match: 20 points if within 7 days
  if (item1.date && item2.date) {
    const difference = Math.abs(
      new Date(item1.date).getTime() -
      new Date(item2.date).getTime()
    );

    const days = difference / (1000 * 60 * 60 * 24);

    if (days <= 7) {
      score += 20;
    }
  }

  // 4. Keyword match: up to 20 points
  const text1 = `${item1.title || ""} ${item1.description || ""}`;
  const text2 = `${item2.title || ""} ${item2.description || ""}`;

  const words1 = new Set(getKeywords(text1));
  const words2 = new Set(getKeywords(text2));

  const commonWords = [...words1].filter(word =>
    words2.has(word)
  );

  if (words1.size > 0 && commonWords.length > 0) {
    const similarity =
      commonWords.length /
      new Set([...words1, ...words2]).size;

    score += Math.round(similarity * 20);
  }

  return score;
}

// Find possible matches for a given item
async function findPotentialMatches(item) {
  const oppositeType = item.type === "Lost" ? "Found" : "Lost";

  const query = {
    type: oppositeType,
    status: { $in: ["Active", "Matched"] }
  };

  // Don't compare an item with itself
  if (item._id) {
    query._id = { $ne: item._id };
  }

  const candidates = await Item.find(query).lean();

  return candidates
    .map(candidate => ({
      item: candidate,
      score: calculateMatchScore(item, candidate)
    }))
    .filter(match => match.score >= 50)
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  calculateMatchScore,
  findPotentialMatches
};
