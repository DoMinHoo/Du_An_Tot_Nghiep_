const express = require("express");
const router = express.Router();
const { getRoles } = require("../controllers/role.controller");

// Lấy danh sách role
router.get("/", getRoles);

module.exports = router;