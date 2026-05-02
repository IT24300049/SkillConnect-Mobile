/**
 * Central source of truth for service categories and skills.
 * Using noun-based service names (e.g., "Plumbing") instead of person names (e.g., "Plumber")
 * for better consistency across Jobs and Workers.
 */
export const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Cleaning",
  "Painting",
  "Masonry",
  "Landscaping",
  "Pest Control",
  "HVAC",
  "Roofing",
  "General Labor",
  "Delivery",
  "Mechanic",
  "Other"
];

/**
 * Mapping for legacy data and synonyms to ensure old records still appear in searches.
 */
export const CATEGORY_MAPPINGS = {
  "Plumbing": ["Plumber", "Plumbing"],
  "Electrical": ["Electrician", "Electrical"],
  "Carpentry": ["Carpenter", "Carpentry"],
  "Cleaning": ["Cleaner", "Cleaning"],
  "Painting": ["Painter", "Painting"],
  "Masonry": ["Mason", "Masonry", "Construction"],
  "Landscaping": ["Gardener", "Landscaping", "Gardening"],
  "HVAC": ["Technician", "HVAC"],
  "General Labor": ["Handyman", "General Labor"],
  "Delivery": ["Driver", "Delivery"],
  "Mechanic": ["Mechanic", "Auto Repair"],
};

/**
 * Helper to check if a worker's skills match a given category.
 * Handles both the new category names and legacy skill names.
 * 
 * @param {string[]} workerSkills - Array of skills from worker profile
 * @param {string} filterCategory - The category selected in the filter
 * @returns {boolean}
 */
export const isSkillMatch = (workerSkills, filterCategory) => {
  if (!filterCategory) return true;
  if (!workerSkills || !Array.isArray(workerSkills)) return false;

  const targetCategory = filterCategory.toLowerCase();
  const synonyms = (CATEGORY_MAPPINGS[filterCategory] || [filterCategory]).map(s => s.toLowerCase());

  return workerSkills.some(skill => {
    const s = skill.toLowerCase();
    // Check for exact match or synonym match
    return s === targetCategory || synonyms.includes(s) || s.includes(targetCategory) || targetCategory.includes(s);
  });
};
