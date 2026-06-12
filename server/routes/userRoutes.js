const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const requireAuth = require("../middleware/authMiddleware");

router.get("/me", requireAuth, userController.getMe);
router.get("/me/attempts", requireAuth, userController.getMyAttempts);

module.exports = router;
