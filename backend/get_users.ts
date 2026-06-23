import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "./models/User.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function getUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await UserModel.find({}, '_id name email');
    console.log("--- REGISTERED USERS ---");
    users.forEach(u => {
      console.log(`ID: ${u._id}`);
      console.log(`Name: ${u.name}`);
      console.log(`Email: ${u.email}`);
      console.log("------------------------");
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getUsers();
