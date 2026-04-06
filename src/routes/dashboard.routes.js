const router = require("express").Router();
const {
  getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity,
} = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");

// dashboard is read-only — all roles can access
router.use(protect);

router.get("/summary",        getSummary);
router.get("/by-category",    getCategoryTotals);
router.get("/monthly-trends", getMonthlyTrends);
router.get("/recent",         getRecentActivity);

module.exports = router;
