const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createColor, updateColor, deleteColor, getColor, getallColor } = require("../controllers/colorCntrl");
const router = express.Router();
router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createColor);
router.route("/").get(getallColor);
router.route("/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateColor)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteColor)
    .get(getColor);

module.exports = router;
