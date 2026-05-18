import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGOURI_DEMODB;

        if (!mongoURI) {
            throw new Error("MONGOURI_DEMODB is not defined in environment variables");
        }

        await mongoose.connect(mongoURI);

        console.log("✅ MongoDB Connected Successfully");
    } catch (error: any) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};