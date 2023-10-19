const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createCategory, updateCategory, deleteCategory, getCategory, getallCategory } = require("../controllers/prodcategoryCntrl");
const router = express.Router();
router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createCategory);
router.route("/").get(getallCategory);
router.route("/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateCategory)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCategory)
    .get(getCategory);

module.exports = router;
