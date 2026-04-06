const router = require("express").Router();
const {
  createRecord, getAllRecords, getRecord, updateRecord, deleteRecord,
} = require("../controllers/record.controller");
const { protect, restrictTo }   = require("../middleware/auth.middleware");
const { validate, recordRules } = require("../middleware/validate.middleware");

// all record routes require authentication
router.use(protect);

// viewers can read, analysts and admins can write, only admin can delete
router.get("/",    getAllRecords);
router.post("/",   restrictTo("admin", "analyst"), recordRules, validate, createRecord);
router.get("/:id", getRecord);
router.put("/:id", restrictTo("admin", "analyst"), recordRules, validate, updateRecord);
router.delete("/:id", restrictTo("admin"), deleteRecord);

module.exports = router;
