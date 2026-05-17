import express from "express";
import Redis from "ioredis";

const app = express();

const publisher  = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.post("notifications", async(req , res) => {
    const payload = {
        title: req.body.title || "Default Title",
        createdAt: new Date().toISOString(),
    }

    const receivers = await publisher.publish("notifications", JSON.stringify(payload));

    res.json({
        message: `Notifications sent to ${receivers} subscribers`
    })

} )

app.listen(3000, () => {
    console.log("API server is running o port http://localhost:3000");
} )