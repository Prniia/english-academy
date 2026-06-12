const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const requireAuth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

router.use(requireAuth, isAdmin); // Protect all routes under adminRoutes

router.get("/users", adminController.getUsersList);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/verify", adminController.updateUserVerification);
router.patch("/users/:id/level", adminController.updateUserLevel);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
