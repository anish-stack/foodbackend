const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  shippingInfo: {
    address: {
      type: String,
  
    },
    city: {
      type: String,
  
    },

    state: {
      type: String,
  
    },

    country: {
      type: String,
  
    },
    pinCode: {
      type: Number,
  
    },
    Landmark: {
      type: String,
  
    },

  
  },
  orderItems: [
    {
      name: {
        type: String,
    
      },
      price: {
        type: Number,
    
      },
      quantity: {
        type: Number,
    
      },
      image: {
        type: String,
    
      },
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Products",
    
      },
    },
  ],

  transication: {
    type: String,

    default: 0,
  },
 
  paidAt: {
    type: Date,

  },
  itemsPrice: {
    type: Number,

    default: 0,
  },
  taxPrice: {
    type: Number,

    default: 0,
  },
  shippingPrice: {
    type: Number,

    default: 50,
  },
  totalPrice: {
    type: Number,

    default: 0,
  },
  transication: {
    type: String,

    default: 0,
  },
  orderStatus: {
    type: String,

    default: "Processing",
  },
  userId:{
    type: mongoose.Schema.ObjectId,
    ref: "user",

},
    deliveredAt: Date,
    createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);