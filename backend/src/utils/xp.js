function levelFromXp(xp) {
  if (xp >= 2000) return "Campus Legend";
  if (xp >= 1000) return "Engineer";
  if (xp >= 500) return "Developer";
  if (xp >= 200) return "Explorer";
  return "Beginner";
}
module.exports = { levelFromXp };
