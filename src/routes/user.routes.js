const router = require("express").Router();
const {
  getAllUsers, getUser, updateUserRole, toggleStatus, deleteUser,
} = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// all user management routes are admin-only
router.use(protect, restrictTo("admin"));

router.get("/",             getAllUsers);
router.get("/:id",          getUser);
router.patch("/:id/role",   updateUserRole);
router.patch("/:id/status", toggleStatus);
router.delete("/:id",       deleteUser);

module.exports = router;
