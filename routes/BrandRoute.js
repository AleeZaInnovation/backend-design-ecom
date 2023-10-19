const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createBrand, updateBrand, deleteBrand, getBrand, getallBrand } = require("../controllers/brandCntrl");
const router = express.Router();
router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createBrand);
router.route("/").get(getallBrand);
router.route("/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateBrand)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteBrand)
    .get(getBrand);

module.exports = router;
