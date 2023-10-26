const User = require("../modals/userSchema");
const sendEmail = require("../utility/sendMail");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utility/errorHandler");
require("dotenv").config();
const bcrypt = require("bcrypt");
const Whislist = require('../modals/whislistModal')
const Product = require('../modals/productScehema')
const Profile = require("../modals/profilemodal");
const sendToken = require("../utility/jwt");
const crypto = require("crypto");
const { options } = require("pdfkit");
const sendErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({ success: false, error: message });
};

const catchAsyncErrors = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => sendErrorResponse(res, error));
  };
};

const deleteUnactivatedUsers = async () => {
  try {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const unactivatedUsers = await User.find({
      isActivated: false,
      createdAt: { $lt: twentyMinutesAgo },
    });

    for (const user of unactivatedUsers) {
      await user.remove();
      console.log(`Deleted unactivated user with email: ${user.email}`);
    }
  } catch (error) {
    console.error("Error deleting unactivated users:", error);
  }
};

exports.RegisterUser = catchAsyncErrors(async (req, res) => {
  const { username, email, contactNumber, password, confirmPassword, role } = req.body;

  // Check if the request body is being received correctly
  console.log(req.body);

  try {
    // Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ErrorHandler("User already exists with this Email Id", 400);
    }

    // Validate if required fields are provided
    if (!username || !email || !contactNumber || !password || !confirmPassword) {
      throw new ErrorHandler("Please Fill All Fields", 422);
    }

    // Check if the password and confirmPassword match
    if (password !== confirmPassword) {
      throw new ErrorHandler("Confirm Password Not Match", 422);
    }

    // Create a new user object
    const newUser = new User({
      username,
      email,
      contactNumber,
      password,
      role, // You need to set the user's role
      isActivated: true, // Optionally set this value
    });

    // Save the user to the database
    await newUser.save();

    // Generate a token for the user (consider using a package like jsonwebtoken)
    const payload = {
      email: newUser.email,
      id: newUser._id, // Fix the typo here: it should be newUser._id, not user._id
      role: newUser.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7h",
    });

    // Set a cookie with the token and send the user data
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    // Send a response with the token and user data
    res.cookie("token", token, options).status(201).json({
      success: true,
      token,
      user: newUser, // Include the newly created user in the response
      message: "User registered successfully",
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


setInterval(deleteUnactivatedUsers, 20 * 60 * 1000);

// login For User
exports.loginguser = catchAsyncErrors(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ErrorHandler("Please Enter Email And Password", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ErrorHandler("User With this Email Not Existed", 404);
    }

    if (!user.isActivated) {
      throw new ErrorHandler("User Not Activated", 403);
    }

    // Use bcrypt to compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new ErrorHandler("Password Mismatch", 401);
    }

    const payload = {
      email: user.email,
      id: user._id, // Fix this typo, it should be _id, not _id
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7h",
    });

    // Remove the password from the user object before sending it in the response
    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res.cookie("token", token, options).status(200).json({
      success: true,
      token,
      user,
      message: "Logged in successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
});

//logout
exports.logoutUser = (req, res) => {
  // Clear the authentication token (cookie) to log the user out
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logout Successful",
  });
};

//changePassword

exports.changePassword = catchAsyncErrors(async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Existed",
      });
    }

    // Generate a random four-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Save the OTP and its expiration time in the user object
    user.resetPasswordOTP = otp;

    // Send the OTP to the user's email
    const payload = {
      email: user.email,
      subject: "Reset Password OTP",
      message: `Your OTP to reset your password is: ${otp}`,
    };

    // Send the OTP via email
    // console.log(payload)
    await sendEmail(payload);
    await user.save();

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Endpoint to verify OTP and update the password
exports.verifyOTPAndChangePassword = catchAsyncErrors(async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Existed",
      });
    }

    // Reset the OTP and set the new password
    user.resetPasswordOTP = undefined;
    user.password = newPassword;

    // Save the updated user object
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

//user management for user-side
exports.updateUserProfile = catchAsyncErrors(async (req, res) => {
  const { newEmail, newPhoneNumber, newUsername, emailChange } = req.body;
  const userId = req.user.id; // Assuming you have user authentication middleware

  try {
    // Retrieve the user by ID
    const user = await User.findById(userId);

    if (!user) {
      throw new ErrorHandler("User not found", 404);
    }

    // If the user wants to change email, send an OTP for confirmation
    if (emailChange && newEmail !== user.email) {
      // Generate a random four-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000);
      user.emailChangeOtp = otp;
      user.emailChangeTemp = newEmail;
      user.emailChangeTokenExpires = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes
      await user.save();

      // Send the OTP to the new email address
      await sendEmail({
        email: newEmail,
        subject: "Email Change Confirmation",
        message: `Your OTP for email change is: ${otp}`,
      });

      res.status(200).json({
        message: "An OTP has been sent to your new email for confirmation.",
      });
    }

    // Update the user's profile
    if (newEmail) {
      user.email = newEmail;
    }

    if (newPhoneNumber) {
      user.contactNumber = newPhoneNumber;
    }

    if (newUsername) {
      user.username = newUsername;
    }

    await user.save();

    res.status(200).json({
      message: "User profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

//add extra detail for user

exports.AddProfile = catchAsyncErrors(async (req, res) => {
  try {
    const { profileImg, gender, dob, address, landmark } = req.body;
    const userId = req.user.id;

    //check if any feild is emptey
    if ( !gender || !dob || !address || !landmark) {
      return res.status(400).json({
        status: "failed",
        message: "Please fill all fields",
      });
    }

    if (!userId) {
      throw new ErrorHandler("User not found", 404);
    }

    //if user found store all details in profile modal

    const Userprofile = new Profile({
      profileImg,
      gender,
      dob,
      address,
      landmark,
      userId
    });

    await Userprofile.save()
    res.status(201).json({
      status:"success",
      message:'Your data has been added',
      Userprofile
    })

  } catch (error) {
    return res.status(500).json({
      status:"faild",
      message:error.message
    })
  }
});

//get userInformation With user and Profile details

exports.getUserAndProfile = catchAsyncErrors(async (req, res) => {
  try {
    const userId = req.user.id; // Replace with how you retrieve the user ID from your request

    if (!userId) {
      throw new ErrorHandler("User not found", 404);
    }

    // Find the user based on the provided user ID and exclude sensitive fields
    const user = await User.findById(userId, '-password -activationtoken -activationtokenExpires');

    if (!user) {
      return res.status(400).json({
        status: "failed",
        message: "User not found",
      });
    }

    // Now, find the profile associated with the user
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(400).json({
        status: "failed",
        message: "Profile not found",
      });
    }

    // Create a user details object without profile "_id" and "profile" keys
    const userDetails = {
      _id: user._id,
      username: user.username,
      email: user.email,
      contactNumber: user.contactNumber,
      isActivated: user.isActivated,
      role: user.role,
      profileImg: profile.profileImg,
      gender: profile.gender,
      address: profile.address,
      dob: profile.dob,
      landmark: profile.landmark,
    };

    // Return the combined details
    res.status(200).json({
      status: "success",
      userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
});

//product add in whislist data
exports.Whislishts = catchAsyncErrors(async (req, res) => {
  try {
    // Get product id from the request body
    const { productId } = req.body;

    // Check if the product with the given productId exists
    const product = await Product.findOne({ _id: productId });

    if (product) {
      // Product found, now add it to the user's wishlist
    const userId = req.user.id; // Replace with how you retrieve the user ID from your request

      // Find or create the user's wishlist
      let wishlist = await Whislist.findOne({ userId });
      if (!wishlist) {
        wishlist = new Whislist({ userId, products: [] });
      }

      // Check if the product is already in the wishlist to avoid duplicates
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }

      // Respond with a success message or perform other operations
      console.log("Product added to wishlist: ", product);

      return res.json({ success: true, message: "Product added to wishlist" });
    } else {
      // Product not found, respond with an error message
      return res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error("Error checking product existence or adding to wishlist:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});



// Admin Routes
exports.getAllUsers = catchAsyncErrors(async (req, res) => {
  try {
    // Find all users, excluding sensitive fields
    const users = await User.find({}, '-password -activationtoken -activationtokenExpires');

    if (!users || users.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "No users found",
      });
    }

    // Create an array of user details with associated profiles
    const userDetails = users.map(async (user) => {
      const profile = await Profile.findOne({ userId: user._id });
      if (profile) {
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          contactNumber: user.contactNumber,
          isActivated: user.isActivated,
          role: user.role,
          profileImg: profile.profileImg,
          gender: profile.gender,
          address: profile.address,
          dob: profile.dob,
          landmark: profile.landmark,
        };
      } else {
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          contactNumber: user.contactNumber,
          isActivated: user.isActivated,
          role: user.role,
          profileImg: null,
          gender: null,
          address: null,
          dob: null,
          landmark: null,
        };
      }
    });

    // Execute all the promises and return the results
    const results = await Promise.all(userDetails);

    res.status(200).json({
      status: "success",
      userDetails: results,
    });
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
});
