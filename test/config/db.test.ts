import mongoose from "mongoose";
import { connectDB } from "../../src/config/db";

jest.mock("mongoose", () => ({
    connect: jest.fn(),
}));

describe("connectDB", () => {
    let logSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        process.env.MONGO_URI = "mongodb://localhost:27017/testdb";
        process.env.MONGO_URL = undefined;
        process.env.MONGODB_URI = undefined;
    });

    afterEach(() => {
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    // =========================
    // SUCCESS CASE
    // =========================
    it("should connect to MongoDB successfully", async () => {
        (mongoose.connect as jest.Mock).mockResolvedValueOnce({});

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(
            "mongodb://localhost:27017/testdb"
        );

        expect(logSpy).toHaveBeenCalledWith(
            "ENV CHECK:",
            "defined"
        );

        expect(logSpy).toHaveBeenCalledWith(
            "✅ MongoDB Connected Successfully"
        );
    });

    // =========================
    // MISSING ENV
    // =========================
    it("should exit(1) if MONGO_URI is missing", async () => {
        delete process.env.MONGO_URI;
        delete process.env.MONGO_URL;
        delete process.env.MONGODB_URI;

        const exitSpy = jest
            .spyOn(process, "exit")
            .mockImplementation(() => undefined as never);

        await connectDB();

        expect(errorSpy).toHaveBeenCalledWith(
            "❌ MongoDB Connection Failed:",
            expect.stringContaining(
                "MongoDB connection string is not defined in environment variables"
            )
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    // =========================
    // CONNECTION FAILURE
    // =========================
    it("should exit(1) if MONGO_URI is missing", async () => {
        delete process.env.MONGO_URI;
        delete process.env.MONGO_URL;
        delete process.env.MONGODB_URI;

        const exitSpy = jest
            .spyOn(process, "exit")
            .mockImplementation(() => undefined as never);

        await connectDB();

        expect(errorSpy).toHaveBeenCalledWith(
            "❌ MongoDB Connection Failed:",
            "MongoDB connection string is not defined in environment variables. Please set MONGO_URI, MONGO_URL, or MONGODB_URI."
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});