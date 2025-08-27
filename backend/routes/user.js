const express = require("express");
const router = express.Router();
const { authenticationMiddleware } = require("../middleware/auth");

// Import authentication controllers
const { login, register, dashboard, getAllUsers, googleAuth } = require("../controllers/user");

// Import brand settings controllers
const { getBrandSettings, saveBrandSettings, refreshBrandVoice } = require("../controllers/user/brandSettings");

// Authentication routes
router.post("/login", login);
router.post("/register", register);
router.post("/auth/google", googleAuth);
router.get("/dashboard", authenticationMiddleware, dashboard);
router.get("/users", authenticationMiddleware, getAllUsers);

// Get current user info including role
router.get("/me", authenticationMiddleware, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profilePicture: req.user.profilePicture
    }
  });
});

// Logout route
router.post("/logout", authenticationMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

// Brand settings routes
router.get("/brand-settings", authenticationMiddleware, getBrandSettings);
router.post("/brand-settings", authenticationMiddleware, saveBrandSettings);
router.post("/brand-settings/refresh", authenticationMiddleware, refreshBrandVoice);

module.exports = router;