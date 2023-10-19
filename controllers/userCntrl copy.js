const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const uniqid = require("uniqid");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateToken } = require("../config/jwtToken");
// const cloudinary = require("cloudinary");

// Register a User

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
  //   folder: "avatars",
  //   width: 150,
  //   crop: "scale",
  // });

  //   const { name, email, password } = req.body;

  //   const user = await User.create({
  //     name,
  //     email,
  //     password,
  //   });
  //   sendToken(user, 201, res);
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    /**
     * TODO:if user not found user create a new user
     */

    const { firstname, lastname, email, mobile, password, } = req.body;

    const user = await User.create({
      firstname,
      lastname,
      email,
      mobile,
      password,
    });
    res.json(user);
  } else {
    /**
     * TODO:if user found then thow an error: User already exists
     */
    return next(new ErrorHander("User Already Exist", 401));
  }
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHander("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Invalid email or password", 401));
  }

  sendToken(user, 200, res);

});

// Login Admin
exports.loginAdmin = catchAsyncErrors(async (req, res, next) => {
  // const { email, password } = req.body;

  // // checking if user has given password and email both

  // if (!email || !password) {
  //   return next(new ErrorHander("Please Enter Email & Password", 400));
  // }

  // const user = await User.findOne({ email }).select("+password");

  // if (!user) {
  //   return next(new ErrorHander("Invalid email or password", 401));
  // }

  // if (user.role != 'admin') {
  //   return next(new ErrorHander("You have no access!", 401));
  // }

  // const isPasswordMatched = await user.comparePassword(password);

  // if (!isPasswordMatched) {
  //   return next(new ErrorHander("Invalid email or password", 401));
  // }

  // sendToken(user, 200, res);

  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.comparePassword(password))) {
    const token = await generateToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        token: token,
      },
      { new: true }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();
  console.log(resetToken);

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHander(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    mobile: req.body.mobile,
  };

  // if (req.body.avatar !== "") {
  //   const user = await User.findById(req.user.id);

  //   const imageId = user.avatar.public_id;

  //   await cloudinary.v2.uploader.destroy(imageId);

  //   const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
  //     folder: "avatars",
  //     width: 150,
  //     crop: "scale",
  //   });

  //   newUserData.avatar = {
  //     public_id: myCloud.public_id,
  //     url: myCloud.secure_url,
  //   };
  // }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user
  });
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  validateMongoDbId(user.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  validateMongoDbId(user.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }

  // const imageId = user.avatar.public_id;

  // await cloudinary.v2.uploader.destroy(imageId);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});


// Block User --Admin
exports.blockUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const block = await User.findByIdAndUpdate(id, {
      isBlocked: true,
    },
      {
        new: true,
      });
    res.status(200).json({
      success: true,
      message: "User Blocked Successfully",
    });
  } catch (error) {
    throw new Error(error);
  }
})

exports.unBlockUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const unblock = await User.findByIdAndUpdate(id, {
      isBlocked: false,
    },
      {
        new: true,
      });
    res.status(200).json({
      success: true,
      message: "User Unblocked Successfully",
    });
  } catch (error) {
    throw new Error(error);
  }
});

exports.getWishlist = catchAsyncErrors(async (req, res, next) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error)

  }
});

exports.saveAddress = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    address: req.body.address,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user
  });

});

exports.userCart = catchAsyncErrors(async (req, res, next) => {
  const { cart } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let products = []
    const user = await User.findById(_id);
    const alreadyExistCart = await Cart.findOne({ orderby: user._id });
    if (alreadyExistCart) {
      alreadyExistCart.deleteOne();
    }
    for (let i = 0; i < cart.length; i++) {
      let object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;
      let getPrice = await Product.findById(cart[i]._id).select("price").exec();
      object.price = getPrice.price;
      products.push(object);
    }
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal = cartTotal + products[i].price * products[i].count;
    }
    let newCart = await new Cart({
      products,
      cartTotal,
      orderby: user?._id,
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);

  }
});

exports.getCart = catchAsyncErrors(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id)
  try {
    const getCart = await Cart
      .findOne({ orderby: _id })
      .populate("products.product");
    res.json(getCart);
  } catch (error) {
    throw new Error(error);
  }
});

exports.emptyCart = catchAsyncErrors(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id)
  try {
    const emptyCart = await Cart
      .findOneAndRemove({ orderby: _id })

    res.json(emptyCart);
  } catch (error) {
    throw new Error(error);
  }
});

exports.applyCoupon = catchAsyncErrors(async (req, res, next) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon });
  if (validCoupon === null) {
    return next(new ErrorHander("Invalid Coupon", 400));
  }
  let { cartTotal } = await Cart.findOne({ orderby: _id }).populate("products.product");
  let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2);
  await Cart.findOneAndUpdate(
    { orderby: _id },
    { totalAfterDiscount },
    { new: true });
  res.json(totalAfterDiscount);
});

exports.cashOrder = catchAsyncErrors(async (req, res, next) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    if (!COD) throw new Error("Create Cash Order Failed");
    let userCart = await Cart.findOne({ orderby: _id });
    let finalAmount = 0;
    if (couponApplied && userCart.totalAfterDiscount) {
      finalAmount = userCart.totalAfterDiscount;
    } else {
      finalAmount = userCart.cartTotal;
    }

    let newOrder = await new Order(
      {
        products: userCart.products,
        paymentIntent: {
          id: uniqid(),
          method: COD,
          amount: finalAmount,
          status: "Cash on Delivery",
          created: Date.now(),
          currency: "usd",
        },
        orderby: _id,
        orderStatus: "Cash on Delivery",
      }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "Success" })
  } catch (error) {
    throw new Error(error);

  }
});

exports.getOrder = catchAsyncErrors(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id)
  try {
    const getOrder = await Order
      .findOne({ orderby: _id })
      .populate("products.product")
      .populate('orderby').exec();
    // const getOrder = await Order.find()
    //   .populate("products.product").populate('orderby').exec();
    res.json(getOrder);
  } catch (error) {
    throw new Error(error);
  }
});

exports.getAllOrder = catchAsyncErrors(async (req, res, next) => {
  // const { _id } = req.user;
  // validateMongoDbId(_id)
  try {
    // const getOrder = await Order
    //   .findOne({ orderby: _id })
    //   .populate("products.product").exec();
    const getOrder = await Order.find()
      .populate("products.product").populate('orderby').exec();
    res.json(getOrder);
  } catch (error) {
    throw new Error(error);
  }
});

exports.getOrderByUserId = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

exports.orderStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const orderStatus = await Order.findByIdAndUpdate(id, {
      orderStatus: status,
      paymentIntent: {
        status: status,
      }
    }, {
      new: true,
    });
    res.json(orderStatus);
  } catch (error) {
    throw new Error(error)
  }
})