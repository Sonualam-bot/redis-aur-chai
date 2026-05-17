import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Redis key naming convention:
// - We use `:` to separate logical parts of the key.
// - This is a common pattern, not a Redis requirement.
// - It makes keys easier to read, query, and manage.
// Example: `post:123:views` means "the views count for post 123".
// Example: `quiz:leaderboard` means "the leaderboard for the quiz app".

// Increment a post view counter
app.post("/post/:id/view", async (req, res) => {
  const postId = req.params.id;
  // `post:${postId}:views` is a namespaced key.
  // `post` is the main object type, `${postId}` is the specific post,
  // and `views` is the field we are tracking for that post.
  const key = `post:${postId}:views`;

  try {
    const views = await redis.incr(key);
    res.json({ postId, views: Number(views) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add points to a leaderboard member
app.post("/leaderboard/score", async (req, res) => {
  const { user, points } = req.body;

  if (!user || typeof points !== "number") {
    return res.status(400).json({ error: "user and numeric points are required" });
  }

  try {
    // `quiz:leaderboard` is the sorted set key for leaderboard scores.
    // `quiz` is a namespace to avoid collisions with other app data.
    // `leaderboard` tells us this key stores ranking/score data.
    const score = await redis.zincrby("quiz:leaderboard", points, user);
    res.json({ user, score: Number(score) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top leaders with scores
app.get("/leaderboard", async (req, res) => {
  try {
    // ZREVRANGE returns members in descending score order.
    // `WITHSCORES` returns [member, score, member, score, ...].
    const leaders = await redis.zrevrange("quiz:leaderboard", 0, 9, "WITHSCORES");
    const result = [];

    for (let i = 0; i < leaders.length; i += 2) {
      result.push({ user: leaders[i], score: Number(leaders[i + 1]) });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a user's rank
app.get("/leaderboard/:user/rank", async (req, res) => {
  const user = req.params.user;

  try {
    // ZREVRANK returns the 0-based rank when the sorted set is ordered from highest to lowest.
    const rank = await redis.zrevrank("quiz:leaderboard", user);

    if (rank === null) {
      return res.status(404).json({ error: "user not found in leaderboard" });
    }

    // Convert 0-based rank to 1-based rank for humans.
    res.json({ user, rank: rank + 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
    console.log("Server is listening to http://localhost:3000")
})