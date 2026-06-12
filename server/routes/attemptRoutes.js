const express = require("express");
const router = express.Router();
const attemptController = require("../controllers/attemptController");
const optionalAuth = require("../middleware/optionalAuthMiddleware");

router.post("/submit", optionalAuth, attemptController.submitAttempt);

module.exports = router;
