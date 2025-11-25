import Order from "./models/OrderSchema.js";
import Product from "./models/ProductSchema.js";
import User from "./models/UserSchema.js";
import Cart from "./models/CartSchema.js";
import Otp from "./models/otp.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "mkshayan100@gmail.com",
    pass: process.env.EMAIL_PASS || "mmhn jjom owbw tmin",
  },
});

// ========================= OTP Email =========================

export async function verifyemail(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send("Email is required");

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).send("User already exists");

    const otp = Math.floor(100000 + Math.random() * 900000);

    const existingOtp = await Otp.findOne({ email });
    if (existingOtp) {
      await Otp.updateOne({ email }, { otp });
    } else {
      await Otp.create({ email, otp });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is <b>${otp}</b></h2>`,
    });

    res.status(200).json({ message: "OTP sent" });
  } catch (err) {
    console.error("verifyemail:", err);
    res.status(500).send("Server error");
  }
}

export async function verifyotp(req, res) {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp: Number(otp) });

    if (!record) return res.status(400).send("Invalid OTP");

    res.status(200).send("success");
  } catch (err) {
    console.error("verifyotp:", err);
    res.status(500).send("Server error");
  }
}

// ========================= Register =========================

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role: role || "user",
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("register:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ========================= Login =========================

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_TOKEN,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        token,
        role: user.role,
        name: user.name,
        email: user.email,
        _id: user._id,
        profilePic: user.profilePic || null,
      },
    });
  } catch (err) {
    console.error("login:", err);
    res.status(500).json({ message: "Server error" });
  }
}


// ========================= Products =========================

export async function addProduct(req, res) {
  try {
    const { name, category, price, description, image, adminId } = req.body;

    if (!name || !category || !price || !image)
      return res.status(400).json({ message: "Missing fields" });

    const product = new Product({
      name,
      category,
      price,
      description,
      image,
      adminId,
    });

    await product.save();

    res.status(201).json({ message: "Product added", product });
  } catch (err) {
    console.error("addProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getProducts(req, res) {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("getProducts:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ========================= Cart =========================

export async function addToCart(req, res) {
  try {
    const { userId, productId } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, products: [productId] });
    } else if (!cart.products.includes(productId)) {
      cart.products.push(productId);
    }

    await cart.save();
    res.json({ message: "Added to cart", cart });
  } catch (err) {
    console.error("addToCart:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getCart(req, res) {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate("products");

    if (!cart) return res.status(404).send("Cart empty");

    res.json(cart);
  } catch (err) {
    console.error("getCart:", err);
    res.status(500).send("Server error");
  }
}

export async function removeFromCart(req, res) {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });

    cart.products = cart.products.filter(
      (id) => id.toString() !== productId
    );

    await cart.save();

    res.json({ message: "Removed", cart });
  } catch (err) {
    console.error("removeFromCart:", err);
    res.status(500).send("Server error");
  }
}

// ========================= Users =========================

export async function getUsers(req, res) {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (err) {
    console.error("getUsers:", err);
    res.status(500).send("Server error");
  }
}

// ========================= Orders =========================

export async function placeOrder(req, res) {
  try {
    const { userId } = req.body;

    const cart = await Cart.findOne({ userId }).populate("products");

    if (!cart || cart.products.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    const products = cart.products.map((p) => ({
      productId: p._id,
      name: p.name,
      price: p.price,
      quantity: 1,
    }));

    const newOrder = new Order({
      userId,
      products,
      totalAmount: products.reduce((sum, p) => sum + p.price, 0),
      status: "Pending",
    });

    await newOrder.save();

    cart.products = [];
    await cart.save();

    res.json({ message: "Order placed", order: newOrder });
  } catch (err) {
    console.error("placeOrder:", err);
    res.status(500).send("Server error");
  }
}

// USER-ONLY
export async function getOrders(req, res) {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.json(orders);
  } catch (err) {
    console.error("getOrders:", err);
    res.status(500).send("Server error");
  }
}

// ADMIN-ONLY
export async function getAllOrders(req, res) {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.error("getAllOrders:", err);
    res.status(500).send("Server error");
  }
}

// ========================= Profile =========================

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).send("Server error");
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
}


// ========================= Update Product =========================
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true, // return updated document
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully", product: updated });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
