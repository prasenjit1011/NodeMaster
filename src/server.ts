import app from "./app";
import { connectDB } from "./config/db";

const startServer = async () => {

    await connectDB();

    app.listen(3000, "0.0.0.0", () => {

        console.log("Server running on port 3000");

    });

};

startServer();