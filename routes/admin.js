const express = require("express");
const router = express.Router();

const adminController =
require("../controllers/admin");

router.get(
    "/dashboard",
    adminController.dashboard
);

module.exports = router;