const express = require("express");
const { createProduct, productDetails, allProducts, updateProduct, deleteProduct, addToWhishList, rating, uploadImages } = require("../controllers/productCntrl");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { uploadPhoto, productImgResize } = require("../middlewares/uploadImage");
const router = express.Router();

router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);
router.route("/upload/:id")
.put(isAuthenticatedUser,
    authorizeRoles("admin"),
    uploadPhoto.array("images",10),
    productImgResize,
    uploadImages);
router.route("/wishlist").put(isAuthenticatedUser,addToWhishList);
router.route("/rating").put(isAuthenticatedUser,rating);
router.route("/:id")
    .get(productDetails)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);
router.route("/").get(allProducts);


module.exports = router;