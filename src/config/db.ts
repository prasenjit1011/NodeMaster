import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;

        console.log("ENV CHECK:", mongoURI ? "defined" : "undefined");
        if (!mongoURI) {
            throw new Error("MongoDB connection string is not defined in environment variables. Please set MONGO_URI, MONGO_URL, or MONGODB_URI.");
        }

        console.log('MONGOURI : ',mongoURI)
        await mongoose.connect(mongoURI);

        console.log("✅ MongoDB Connected Successfully");
    } catch (error: any) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};