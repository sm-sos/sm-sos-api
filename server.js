const express = require("express");
const app = express();

app.use(express.json());

app.post("/api/intake", (req, res) => {
  console.log("📥 Incoming Request:", req.body);
  res.json({ status: "received" });
});

app.get("/", (req, res) => {
  res.send("SM‑SOS API Running ✅");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
