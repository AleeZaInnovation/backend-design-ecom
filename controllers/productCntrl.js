const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const slugify = require("slugify");
const { cloudinaryUploadImg } = require("../utils/cloudinary");
const fs = require("fs");


exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const product = await Product.create(req.body);
        res.json({
            message: "Product added successfully",
            product,
        })
    } catch (error) {
        throw new Error(error);
    }
});


exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.json({
            message: "Product updated successfully",
            updateProduct,
        })
    } catch (error) {
        throw new Error(error);
    }
});

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {

        await Product.findByIdAndDelete(id);
        res.json({
            message: "Product deleted successfully",
        })
    } catch (error) {
        throw new Error(error);
    }
});

exports.productDetails = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id).populate('color');
        res.json(
            product,
        )
    } catch (error) {
        throw new Error(error);
    }
});

exports.allProducts = catchAsyncErrors(async (req, res, next) => {
    try {
        // Filtering
        const queryObj = { ...req.query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        let query = Product.find(JSON.parse(queryStr));


        // Sorting

        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        // limiting the fields

        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        } else {
            query = query.select("-__v");
        }

        // pagination

        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);
        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip >= productCount) throw new Error("This Page does not exists");
        }

        const products = await query;
        res.json(
            products,
        )
    } catch (error) {
        throw new Error(error);
    }

});

exports.addToWhishList = catchAsyncErrors(async (req, res, next) => {
    const { _id } = req.user;
    // console.log(_id);
    const { proId } = req.body;
    try {
        const user = await User.findById(_id);
        //console.log(user);
        const alreadyadded = user.wishlist.find((id) => id.toString() === proId);
        if (alreadyadded) {
            let user = await User.findByIdAndUpdate(_id,
                {
                    $pull: { wishlist: proId },
                },
                {
                    new: true,
                });
            res.json(user);
        } else {
            let user = await User.findByIdAndUpdate(_id,
                {
                    $push: { wishlist: proId },
                },
                {
                    new: true,
                });
            res.json(user);
        }
    } catch (error) {
        throw new Error(error);
    }
});

exports.rating = catchAsyncErrors(async (req, res, next) => {
    const { _id } = req.user;
    const { star, proId, comment } = req.body;
    try {
        const user = await User.findById(_id)
        const name = user.firstname + " " + user.lastname
        console.log(name)
        const product = await Product.findById(proId);
        let alreadyRated = product.ratings.find((userId) => userId.postedBy.toString() === _id.toString());
        if (alreadyRated) {
            await Product.updateOne(
                {
                    ratings: { $elemMatch: alreadyRated },
                },
                {
                    $set: { "ratings.$.star": star, "ratings.$.comment": comment,"ratings.$.commentBy": name },
                },
                {
                    new: true,
                }
            );
        } else {
            await Product.findByIdAndUpdate(proId,
                {
                    $push: {
                        ratings: {
                            star: star,
                            comment: comment,
                            commentBy:name,
                            postedBy: _id,
                        }
                    },
                },
                {
                    new: true,
                },
            );
        }
        const ratingproduct = await Product.findById(proId);

        let totalRating = ratingproduct.ratings.length;

        let ratingsum = ratingproduct.ratings.map((item) => item.star).reduce((prev, curr) => prev + curr, 0);
        let actualRating = ((ratingsum / totalRating).toFixed(1));
        let finalRating = await Product.findByIdAndUpdate(proId, {
            totalRating: actualRating,
        },
            {
                new: true,
            });
        res.json(finalRating);
    } catch (error) {
        throw new Error(error);
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
        const findProduct = await Product.findByIdAndUpdate(id,
            {
                images: urls.map((file) => {
                    return file;
                }),
            }, {
            new: true,
        });
        res.json(findProduct);
    } catch (error) {
        throw new Error(error);
    }
});