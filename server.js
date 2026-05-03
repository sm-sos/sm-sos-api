const express = require("express");
const app = express();

app.use(express.json());

// Webhook endpoint
app.post("/api/intake", (req, res) => {
  console.log("Incoming Request:", req.body);
  res.status(200).json({ status: "received" });
});

// Health check
app.get("/", (req, res) => {
  res.send("SM-SOS API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
