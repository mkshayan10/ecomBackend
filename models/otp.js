
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
 email:{type:String},
 otp:{type:Number}
});

export default mongoose.model("Otp", otpSchema);
