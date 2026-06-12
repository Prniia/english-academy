const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const requireAuth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

router.get("/", optionalAuth, testController.getTests);
router.get("/:id", optionalAuth, testController.getTestById);

// Admin controls
router.post("/", requireAuth, isAdmin, testController.createTest);
router.put("/:id", requireAuth, isAdmin, testController.updateTest);
router.delete("/:id", requireAuth, isAdmin, testController.deleteTest);
router.patch("/:id/toggle", requireAuth, isAdmin, testController.toggleTestStatus);

module.exports = router;
