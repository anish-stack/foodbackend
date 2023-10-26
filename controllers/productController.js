const express = require('express')
const Products =require ('../modals/productScehema.js')
require('dotenv').config()
const mongoose = require('mongoose')
const Cart = require('../modals/cart.js')
const ErrorHandler = require('../utility/errorHandler')
const User = require('../modals/userSchema.js')
const cloudinary = require('cloudinary').v2
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
  
 
//   Const create Product by admin 

// Configure Cloudinary with your API credentials
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY_CLOUD, 
  api_secret: process.env.API_SECRET_CLOUD
});

exports.createProduct = catchAsyncErrors(async (req, res) => {
  try {
    // Extract product data from the request body
    const {
      title,
      description,
      mrpPrice,
      discountedPrice,
      category,
      brand,
      sizes,
      colors,
      stockQuantity,
      imageUrls, // Add imageUrls here
    } = req.body;

    const userId = req.user._id;

    // Save new product
    const newProduct = new Products({
      title,
      description,
      mrpPrice,
      discountedPrice,
      category,
      brand,
      sizes,
      colors,
      stockQuantity,
      userId,
      imageUrls, // Add imageUrls to the newProduct object
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the product' });
  }
});

//get product by id
exports.getProductById = catchAsyncErrors(async (req, res) => {
    try {
      const productId = req.params.id; // Extract productId from request parameters
      console.log(productId)
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      }
  
      const product = await Products.findById(productId);
  
      if (product) {
        res.status(200).json({
          success: true,
          message: 'Product found',
          product,
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  });

 //get all products
 exports.getAllProducts = catchAsyncErrors(async (req, res) => {
    try {
      
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1; // Get the page from the query parameters
      
      // Count the total number of products
      const totalCount = await Products.countDocuments();
      
      // Calculate total pages based on total products and limit
      const totalPages = Math.ceil(totalCount / limit);
      
      // Fetch products based on pagination
      const products = await Products.find({}, "-password")
        .skip((page - 1) * limit)
        .limit(limit);
      
      res.json({
        products,
        totalPages,
        currentPage: page,
        totalCount,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
 //Get Products By Categories
 exports.getProductsByCategories=catchAsyncErrors( async (req,res)=>{


try{
const {category} = req.query

const product = await Products.find({category})
if(product){
    return res.json({success : true ,data : product});
}else{
    return res.json({message:"No Product Found"})
}
}catch(error){
    console.error("Error fetching products by category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
}

 })
//Update products by id 
exports.updateProducts = catchAsyncErrors(async (req, res) => {
    try {
      const productId = req.params.id; // Extract productId from request parameters
      const updateData = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      } else {
        const updatedProduct = await Products.findByIdAndUpdate(
          productId,
          { ...updateData },
          { new: true }
        );
  
        if (!updatedProduct) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
  
        res.status(200).json({
          success: true,
          message: 'Product updated successfully',
          product: updatedProduct,
        });
      }
    } catch (error) {
      console.error(`Error updating product: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  });
 //Delete product
 exports.deleteProduct = catchAsyncErrors(async (req, res) => {
    try {
      const productId = req.params.id; // Extract productId from request parameters
        console.log(productId)
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      } else {
        const product = await Products.findById(productId);
  
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found',
          });
        }
  
        await product.deleteOne();
  
        res.status(200).json({
          success: true,
          message: 'Product deleted successfully',
          product
        });
      }
    } catch (error) {
      console.error(`Error deleting product: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  });

  exports.addReview = catchAsyncErrors(async (req, res) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;
      const { text } = req.body; // Assuming the review text is provided in the request body
  
      // Find the product by its ID
      const product = await Products.findById(productId);
  
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
  
      // Retrieve the user's name from the user object
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      const userName = user.username;
  
      // Create a new review with the user's name
      const newReview = {
        userName,
        text,
      };
  
      // Add the new review to the product's reviews array
      product.reviews.push(newReview);
  
      // Save the product with the new review
      await product.save();
  
      res.status(201).json({
        success: true,
        message: "Review added successfully",
        review: newReview,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  });
  
 
  //add to cart function if user is not login then save in temproray cart and after login or register show tempoery cart item in perment cart
 
  exports.addToCart = catchAsyncErrors(async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null; // Get the user's ID if logged in, otherwise, it's null
      const productId = req.body.productId; // Assuming you receive the product ID in the request body
  
      // Check if the product exists
      const product = await Products.findById(productId);
  
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'No such product',
        });
      }
  
      console.log('Product Details:');
      console.log(product);
  
      if (userId) {
        // User is logged in
        // Find or create the user's cart
        let userCart = await Cart.findOne({ user: userId });
  
        if (!userCart) {
          userCart = new Cart({ user: userId, items: [] });
        }
  
        // Check if the product is already in the user's cart to avoid duplicates
        const existingItem = userCart.items.find((item) => item.product.toString() === productId);
  
        if (existingItem) {
          existingItem.quantity += 1; // Increase the quantity if the product is already in the cart
        } else {
          userCart.items.push({ product: productId, quantity: 1 });
        }
  
        await userCart.save();
  
        console.log('User Cart Details:');
        console.log(userCart);
  
        // If there is a session cart, transfer its contents to the user's cart
        const tempCart = req.session.tempCart;
  
        if (tempCart && tempCart.length > 0) {
          console.log('Session Cart Details:');
          console.log(tempCart);
  
          tempCart.forEach(async (tempCartItem) => {
            const existingItem = userCart.items.find(
              (item) => item.product.toString() === tempCartItem.product.toString()
            );
  
            if (existingItem) {
              existingItem.quantity += tempCartItem.quantity;
            } else {
              userCart.items.push({ product: tempCartItem.product, quantity: tempCartItem.quantity });
            }
          });
  
          await userCart.save();
  
          // Clear the session cart
          req.session.tempCart = [];
  
          console.log('User Cart After Session Transfer:');
          console.log(userCart);
        }
  
        return res.status(200).json({
          success: true,
          message: 'Product added to the cart',
        });
      } else {
        // User is not logged in
        // ...
  
        // For non-logged-in users, you can store the product data temporarily in a session or cookies
        const tempCart = req.session.tempCart || [];
        const existingItem = tempCart.find((item) => item.product.toString() === productId);
  
        if (existingItem) {
          existingItem.quantity += 1; // Increase the quantity if the product is already in the temporary cart
        } else {
          tempCart.push({ product: productId, quantity: 1 });
        }
  
        if (req.session) {
          // Access the req.session.tempCart property here
          req.session.tempCart = tempCart;
        } else {
          return res.status(400).json({ // Use 400 for Bad Request
            success: false,
            message: 'Bad Request: Session not available',
          });
        }
  
        console.log('Temporary Cart Details:');
        console.log(tempCart);
  
        return res.status(200).json({
          success: true,
          message: 'Product temporarily added to the cart',
        });
      }
    } catch (error) {
      console.error(`Error adding to cart: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  });
  exports.shareSessionCartToUserCart = catchAsyncErrors(async (req, res) => {
    try {
      const userId = req.user ? req.user.id : null; // Get the user's ID if logged in, otherwise, it's null
  
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User is not logged in',
        });
      }
  
      // Find or create the user's cart
      let userCart = await Cart.findOne({ user: userId });
  
      if (!userCart) {
        userCart = new Cart({ user: userId, items: [] });
      }
  
      // If there is a session cart, transfer its contents to the user's cart
      if (req.session.tempCart && req.session.tempCart.length > 0) {
        req.session.tempCart.forEach(async (tempCartItem) => {
          const existingItem = userCart.items.find(
            (item) => item.product.toString() === tempCartItem.product.toString()
          );
  
          if (existingItem) {
            existingItem.quantity += tempCartItem.quantity;
          } else {
            userCart.items.push({ product: tempCartItem.product, quantity: tempCartItem.quantity });
          }
        });
  
        await userCart.save();
  
        // Clear the session cart
        req.session.tempCart = [];
  
        return res.status(200).json({
          success: true,
          message: 'Session cart items transferred to the user cart',
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'No session cart items to transfer',
        });
      }
    } catch (error) {
      console.error(`Error sharing session cart to user cart: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  });
  