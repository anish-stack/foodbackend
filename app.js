const express = require('express');
const app = express();
const router = express.Router();
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const session = require('express-session');

const User = require('./modals/userSchema');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const { protect, isAdmin } = require('./middleware/auth');
const { createOrder, getOrderDetailById, getUserOrders } = require('./controllers/orderController');
const { createProduct, getProductById, getAllProducts, updateProducts, deleteProduct, addToCart, addReview, shareSessionCartToUserCart, getProductsByCategories} = require('./controllers/productController');
const { logoutUser, updateUserProfile, getAllUsers, AddProfile, getUserAndProfile, Whislishts, RegisterUser, loginguser, changePassword, verifyOTPAndChangePassword } = require('./controllers/usercontroller');
const MongoStore = require('connect-mongodb-session')(session);

// Custom middleware for the router
router.use((req, res, next) => {
  // Custom middleware logic
  next(); // Call next to continue to the next middleware or route handler
});
app.use(cors())
app.use(express.json());
app.use(cookieParser());
// Session configuration
const store = new MongoStore({
  uri: process.env.DB_URL, // Your MongoDB Atlas connection URI
  collection: 'sessions', // Name of the sessions collection in your database
});

router.use(
  session({
    secret: 'bfdfcjewvbdjbewbdewkndaewndwjk',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session duration (in milliseconds), 24 hours in this example
    },
  })
);

const HELLO = process.env.HELLO

app.get('/profile', protect, async (req, res) => {
  try {
    // Fetch the user's profile based on the authenticated user (you may use the user ID from the authentication middleware)
    const user = await User.findById(req.user.id).select('-password'); // Excluding the password field

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user's profile data as a response
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// Initialize routes on the router
router.get('/', (req, res) => {
  return res.send(`Hello I Am From Backend ${HELLO}`);
});

router.get('/activate', async (req, res) => {
  try {
    const { token } = req.query;

    // Find the user with the provided token
    const user = await User.findOne({ activationtoken: token });

    if (!user) {
      // Handle the case where the token does not match any user
      throw new ErrorHandler('Invalid or expired activation token', 400);
    }

    // Check if the token has expired
    if (user.activationtokenExpires <= Date.now()) {
      // Handle the case where the token has expired
      throw new ErrorHandler('Activation token has expired', 400);
    }

    // Activate the user's account
    user.isActivated = true;
    await user.save();

    // Redirect the user to a success page or display a success message
    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post('/make-a-order', protect, createOrder);

router.get('/auth/logout', protect, logoutUser);
router.post('/auth/Prodile-change', protect, updateUserProfile);
router.get('/auth/getOrderDetails/:id',protect,getOrderDetailById)
// ====== Admin users And Routes
router.get('/auth/All-users',protect,isAdmin('admin'),getAllUsers)
router.post('/auth/create-product',protect,isAdmin('admin'),createProduct)
router.get('/auth/products/:id', protect,isAdmin('admin'), getProductById);
router.get('/auth/All-products' ,protect,isAdmin('admin'),getAllProducts)
router.put('/auth/products/:id',protect,isAdmin('admin'), updateProducts);
router.delete('/auth/delete/:id',protect,isAdmin('admin'), deleteProduct);
router.get('/auth/All-Product',getAllProducts)


router.get('/auth/productDetails/:id',getProductById);
router.get('/auth/UserOrders',protect,getUserOrders);

router.post('/auth/user-profile',protect,AddProfile);
router.get('/auth/user-info',protect,getUserAndProfile);
router.post('/auth/whislist',protect,Whislishts)
router.post('/auth/addToCart',addToCart)
router.post('/auth/reviews/:id',protect,addReview)

router.post('/auth/addToCartSession',protect,shareSessionCartToUserCart)

router.post("/api/register", RegisterUser);
router.post("/api/login", loginguser);
router.post('/api/change-password', changePassword);
router.post('/api/verifyotp', verifyOTPAndChangePassword);

// Use router.get() for GET requests
router.get('/api/products/by-category', getProductsByCategories);

// Mount the router on the app
app.use('/', router);

// calling server
connectDB();
const Port = process.env.PORT;

app.listen(Port, () => {
  console.log(`Server Is Running on port number ${Port}`);
});
