const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createCoupon, updateCoupon, deleteCoupon, getCoupon, getallCoupon } = require("../controllers/couponCntrl");
const router = express.Router();
router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createCoupon);
router.route("/").get(isAuthenticatedUser, authorizeRoles("admin"),getallCoupon);
router.route("/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateCoupon)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCoupon)
    .get(getCoupon);

module.exports = router;
