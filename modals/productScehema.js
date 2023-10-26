const mongoose = require('mongoose');

// Sub-schema for product sizes
const sizeSchema = new mongoose.Schema({
  name: String, // Size name (e.g., Small, Medium, Large)
  stockQuantity: Number, // Stock quantity for this size
});

// Sub-schema for product colors
const colorSchema = new mongoose.Schema({
  name: String, // Color name (e.g., Red, Blue, Green)
  stockQuantity: Number, // Stock quantity for this color
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  mrpPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    min: 0,
  },
  category: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  imageUrls: {
    type: [String], // Array of image URLs
  
  },
  sizes: {
    type: [sizeSchema], // Array of size sub-schemas
  },
  colors: {
    type: [colorSchema], // Array of color sub-schemas
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  ratings: {
    type: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // Reference to the User model for tracking who rated the product
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        review: String,
      },
    ],
  },
  reviews: {
    type: [
      {
        userName: String,
        text: String,
      },
    ],
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
