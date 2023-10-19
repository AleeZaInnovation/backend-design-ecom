const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { createBlog, updateBlog, blogDetails, allBlogs, deleteBlog, likeBlog, disLikeBlog, uploadImages } = require("../controllers/blogCntrl");
const { uploadPhoto, blogImgResize } = require("../middlewares/uploadImage");
const router = express.Router();
router.route("/new").post(isAuthenticatedUser, authorizeRoles("admin"), createBlog);
router.route("/upload/:id")
    .put(isAuthenticatedUser,
        authorizeRoles("admin"),
        uploadPhoto.array("images", 2),
        blogImgResize,
        uploadImages);
router.route("/").get(allBlogs);
router.route("/likes")
    .put(isAuthenticatedUser, likeBlog)
router.route("/dislikes")
    .put(isAuthenticatedUser, disLikeBlog)
router.route("/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateBlog)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteBlog)
    .get(blogDetails);

module.exports = router;
