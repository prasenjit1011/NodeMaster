import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import os from "os";

const router = express.Router();


// ================================
// HELPERS
// ================================
const getLocalIP = (): string[] => {
    const nets = os.networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === "IPv4" && !net.internal) {
                results.push(net.address);
            }
        }
    }

    return results;
};

const getPublicIP = async (): Promise<string> => {
    try {
        const res = await axios.get("https://api.ipify.org?format=json");
        return res.data.ip;
    } catch {
        return "unavailable";
    }
};

// ================================
// SERVER ROUTE
// ================================
router.use("/", async (req: Request, res: Response, next: NextFunction) => {
        try {
            const localIPs = getLocalIP();

            const clientIP =
                (req.headers["x-forwarded-for"] as string)
                    ?.split(",")[0]
                    ?.trim() ||
                req.socket.remoteAddress ||
                "unknown";

            const publicIP = await getPublicIP();

        const gcpContext = {
            nodeEnv: process.env.NODE_ENV || "development",
            region: process.env.GCP_REGION || "unknown",
            instanceName: process.env.GCE_INSTANCE_NAME || "unknown",
            projectId: process.env.GCP_PROJECT_ID || "unknown",
        };

        // controller / route
        res.status(200).render("index", {
            message: "-: Welcome To GCP Terraform 001 :-",
            timestamp: new Date().toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
            }),

            ipDetails: {
                localServerIP: localIPs,
                clientIP: clientIP,
                publicServerIP: publicIP,
            },

            lbContext: {
                loadBalancerIP: process.env.LB_IP || "unknown",
                loadBalancerURL: process.env.LB_URL || "unknown",
            },

            gcpContext: gcpContext,
            });

        } catch (err) {
            next(err);
        }
    }
);

export default router;