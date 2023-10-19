const express = require("express");
const { registerUser, loginUser, logout, forgotPassword, resetPassword, getUserDetails, updatePassword, updateProfile, getAllUser, getSingleUser, updateUserRole, deleteUser, blockUser, unBlockUser, loginAdmin, getWishlist, saveAddress, userCart, getCart, emptyCart, applyCoupon, cashOrder, getOrder, orderStatus, getAllOrder, getOrderByUserId, handleRefreshToken, updateQuantityCart, createOrder, getOrderMonthWise, getYearlyOrder, removeProductFromCart } = require("../controllers/userCntrl");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const orderModel = require("../models/orderModel");
const { checkout, paymentVerification } = require("../controllers/paymentCntrl");
const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/admin-login").post(loginAdmin);
router.route("/password/forget").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/logout").get(logout);
router.route("/me").get(isAuthenticatedUser, getUserDetails);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);

router.route("/me/update").put(isAuthenticatedUser, updateProfile);
router.route("/address").put(isAuthenticatedUser, saveAddress);
router.route("/wishlist").get(isAuthenticatedUser, getWishlist);
router.route("/cart").post(isAuthenticatedUser, userCart);
router.route("/cart").get(isAuthenticatedUser, getCart);
router.route("/empty-cart").delete(isAuthenticatedUser, emptyCart);
router.route("/cart/:id").delete(isAuthenticatedUser, removeProductFromCart);
router.route("/cart-quantity/:id/:newQuantity").put(isAuthenticatedUser, updateQuantityCart);
router.route("/order")
    .post(isAuthenticatedUser, createOrder)
    .get(isAuthenticatedUser, getOrder);
router.route("/order/checkout").post(isAuthenticatedUser, checkout);
router.route("/order/payment-verification").post(isAuthenticatedUser, paymentVerification);
router.route("/admin/get-monthly-order").get(isAuthenticatedUser, authorizeRoles("admin"), getOrderMonthWise);
router.route("/admin/get-yearly-order").get(isAuthenticatedUser, authorizeRoles("admin"), getYearlyOrder);
// router.route("/cart/coupon")
//     .post(isAuthenticatedUser, applyCoupon);
// router.route("/cart/cash-order")
//     .post(isAuthenticatedUser, cashOrder)
//     .get(isAuthenticatedUser, authorizeRoles("admin"), getOrder);
router.route("/cart/all-order").get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrder);
router.route("/getorderbyuser/:id").post(isAuthenticatedUser, authorizeRoles("admin"), getOrderByUserId);
router.route("/order-status/:id").put(isAuthenticatedUser, authorizeRoles("admin"), orderStatus);
router.route("/admin/").get(getAllUser);
router.route("/admin/:id").get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser);
router.route("/admin/:id").put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole);
router.route("/admin/:id").delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);
router.route("/admin/block/:id").put(isAuthenticatedUser, authorizeRoles("admin"), blockUser);
router.route("/admin/unblock/:id").put(isAuthenticatedUser, authorizeRoles("admin"), unBlockUser);
router.route("/admin/get-monthly-income").get(isAuthenticatedUser, authorizeRoles("admin"), getOrderMonthWise);
router.route("/refresh").get(handleRefreshToken);

module.exports = router;