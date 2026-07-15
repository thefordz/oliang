import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type UserDocument = mongoose.InferSchemaType<typeof userSchema>;

const User = mongoose.model("User", userSchema);

export default User;
