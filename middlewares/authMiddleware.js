const User = require("../models/userModel");
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const authMiddleware = asyncHandler(async(req,res,next)=>{
    let token;
    if(req?.headers?.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        try {
            if(token){
                const decoded = jwt.verify(token,process.env.JWT_SECRET)
                console.log(decoded);
            }
        } catch (error) {
            throw new Error("Not Authorized , Please login again");
        }
    }else{
        throw new Error("There is no token attached in header");
    }
});

module.exports = authMiddleware;



exports.isAuthenticatedUser = asyncHandler(async (req, res, next) => {
//     const { token } = req.cookies;
//   console.log(token);

//   if (!token) {
//     throw new Error("Please Login to access this resource", 401);
//   }

//   const decodedData = jwt.verify(token, process.env.JWT_SECRET);

//   req.user = await User.findById(decodedData.id);
//  next();
let token;
    if(req?.headers?.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        try {
            if(token){
                const decoded = jwt.verify(token,process.env.JWT_SECRET)
                console.log(decoded);
            }
        } catch (error) {
            throw new Error("Not Authorized , Please login again");
        }
    }else{
        throw new Error("There is no token attached in header");
    }
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return 
        throw new Error(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
      );
    }

    next();
  };
};
