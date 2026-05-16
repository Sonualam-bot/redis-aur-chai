import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const BANNER_KEY = "app:banner";

app.post("/banner", async(req, res) => {
    await redis.set(BANNER_KEY, req.body.message || "Welcome to saturday aur redis!" );;
    res.json({
        success: true
    })
})

app.get("/banner", async(req, res) => {
    const message = await redis.get(BANNER_KEY);
    res.json({message})
} )

app.delete("/banner", async(req, res) => {
    await redis.del(BANNER_KEY);
    res.json({
        success: true
    })
})

app.get("/banner/exists", async (req, res) => {
    const exists = await redis.exists(BANNER_KEY);
    res.json({
        exists: Boolean(exists)
    })
})

app.post("/banner/exists-multiple", async (req, res) => {
    const keys = req.body.keys;
    if (!Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({ error: "keys must be a non-empty array" });
    }
    const count = await redis.exists(...keys);
    res.json({
        keysChecked: keys,
        existCount: count,
        allExist: count === keys.length,
        anyExist: count > 0
    });
})

app.listen(3000, () => {
    console.log("Server is listening to port 3000")
})