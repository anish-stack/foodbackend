const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  profileImg: {
    type: String,
  },
  gender: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  dob: {
    type: String,
  },
  landmark: {
    type: String,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
  },
});

const ProfileModel = mongoose.model('Profile', ProfileSchema);

module.exports = ProfileModel;
