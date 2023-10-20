const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { uploadPhoto, productImgResize, } = require("../middlewares/uploadImage");
const { uploadImages, deleteImages } = require("../controllers/uploadCntrl");
const router = express.Router();
router.route("/").post(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    express.static(uploadPhoto.array("images", 10)),
    productImgResize,
    uploadImages
);
router.route("/delete-img/:id").delete(isAuthenticatedUser, authorizeRoles("admin"), deleteImages);

module.exports = router;
