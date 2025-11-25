import express from "express";
import cors from "cors";
import Connection from "./Connection.js";
import mongoose from "mongoose";
import Product from "./models/ProductSchema.js";

import router from "./router.js";
import dotenv from "dotenv";
dotenv.config()


const app = express();


app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb"}));
app.use("/api", router);

Connection().then(() => {
  app.listen(process.env.PORT, () =>{
    console.log(`🚀 Server running at http://localhost:${process.env.PORT}`)
});
});