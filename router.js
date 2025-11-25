import { Router } from "express";
import * as rh from "./reqhandler.js";
import Auth from "./midleware/Auth.js";

const router = Router();

// AUTH
router.post("/register", rh.register);
router.post("/login", rh.login);

// OTP
router.post("/email", rh.verifyemail);
router.post("/otp", rh.verifyotp);

// PRODUCTS
router.post("/addproduct", rh.addProduct);
router.get("/products", rh.getProducts);

// CART
router.post("/addtocart", rh.addToCart);
router.get("/cart/:userId", rh.getCart);
router.post("/removefromcart", rh.removeFromCart);

// USERS
router.get("/users", rh.getUsers);

// ORDERS
router.post("/placeorder", rh.placeOrder);
router.get("/orders/:userId", rh.getOrders); // user-specific orders
router.get("/orders", rh.getAllOrders);      // admin all orders

// PROFILE
router.get("/getprofile", Auth, rh.getProfile);

// PRODUCT DELETE & UPDATE (FIXED)
router.delete("/products/:id", rh.deleteProduct);
router.put("/products/:id", rh.updateProduct);

export default router;
