const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createEnquiry, updateEnquiry, deleteEnquiry, getEnquiry, getallEnquiry } = require("../controllers/enqCntrl");
const router = express.Router();
router.route("/new").post(createEnquiry);
router.route("/").get(getallEnquiry);
router.route("/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateEnquiry)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteEnquiry)
    .get(getEnquiry);

module.exports = router;
