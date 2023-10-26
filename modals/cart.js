const mongoose = require('mongoose');

const userCartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
});

const UserCart = mongoose.model('UserCart', userCartSchema);

module.exports = UserCart;
