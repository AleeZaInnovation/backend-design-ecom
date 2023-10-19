const validateMongoDbId = require("../utils/validateMongodbId");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Blog = require("../models/blogModel");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const fs = require("fs");


exports.createBlog = catchAsyncErrors(async (req, res, next) => {
    try {
        const blog = await Blog.create(req.body);
        res.json({
            message: "Blog added successfully",
            blog,
        })
    } catch (error) {
        throw new Error(error);
    }
});
exports.allBlogs = catchAsyncErrors(async (req, res, next) => {
    try {
        const allBlogs = await Blog.find().sort({ _id: -1 });
        res.json(
            allBlogs,
        )
    } catch (error) {
        throw new Error(error);
    }
});

exports.updateBlog = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    try {

        const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.json({
            message: "Blog updated successfully",
            updateBlog,
        })
    } catch (error) {
        throw new Error(error);
    }
});
exports.deleteBlog = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {

        await Blog.findByIdAndDelete(id);
        res.json({
            message: "Blog deleted successfully",
        })
    } catch (error) {
        throw new Error(error);
    }
});

exports.blogDetails = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {
        const getBlog = await Blog.findById(id)
            .populate("likes")
            .populate("dislikes");
        await Blog.findByIdAndUpdate(id, { $inc: { numViews: 1 } }, {
            new: true,
        });
        res.json(
            getBlog,
        )
    } catch (error) {
        throw new Error(error);
    }
});

exports.likeBlog = catchAsyncErrors(async (req, res, next) => {
    const { blogId } = req.body;

    const blog = await Blog.findById(blogId);

    const loginUserId = req?.user?._id;
    console.log(loginUserId);

    const isLiked = blog?.isLiked;

    const alreadyDisliked = blog?.dislikes?.find((userId) => userId?.toString() === loginUserId?.toString());

    if (alreadyDisliked) {
        const blog = await Blog.findByIdAndUpdate(
            blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        },
            { new: true },
        );
        res.json(blog);
    }
    if (isLiked) {
        const blog = await Blog.findByIdAndUpdate(
            blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        },
            { new: true },
        );
        res.json(blog);
    }
    else {
        const blog = await Blog.findByIdAndUpdate(
            blogId, {
            $push: { likes: loginUserId },
            isLiked: true,
        },
            { new: true },
        );
        res.json(blog);
    }
});

exports.disLikeBlog = catchAsyncErrors(async (req, res, next) => {
    const { blogId } = req.body;

    const blog = await Blog.findById(blogId);

    const loginUserId = req?.user?._id;

    const isDisLiked = blog?.isDisliked;

    const alreadyLiked = blog?.likes?.find((userId) => userId?.toString() === loginUserId?.toString());

    if (alreadyLiked) {
        const blog = await Blog.findByIdAndUpdate(
            blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        },
            { new: true },
        );
        res.json(blog);
    }
    if (isDisLiked) {
        const blog = await Blog.findByIdAndUpdate(
            blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        },
            { new: true },
        );
        res.json(blog);
    }
    else {
        const blog = await Blog.findByIdAndUpdate(
            blogId, {
            $push: { dislikes: loginUserId },
            isDisliked: true,
        },
            { new: true },
        );
        res.json(blog);
    }
});

exports.uploadImages = catchAsyncErrors(async (req, res, nex) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const uploader = (path) => cloudinaryUploadImg(path, "images");
        const urls = [];
        const files = req.files;
        for (const file of files) {
            const { path } = file;
            const newPath = await uploader(path);
            urls.push(newPath);
            fs.unlinkSync(path);
        }
        const findBlog = await Blog.findByIdAndUpdate(id,
            {
                images: urls.map((file) => {
                    return file;
                }),
            }, {
            new: true,
        });
        res.json(findBlog);
    } catch (error) {
        throw new Error(error);
    }
});