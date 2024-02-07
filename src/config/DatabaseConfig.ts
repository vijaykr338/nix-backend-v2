import mongoose from "mongoose";
const uri = process.env.MONGO_URI;

const connectDB = async () => {
  // https://mongoosejs.com/docs/migrating_to_6.html#no-more-deprecation-warning-options
  // const conn = await mongoose.connect(uri, { useNewUrlParser: true });
  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }
  const conn = await mongoose.connect(uri);

  console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
};

export default connectDB;
