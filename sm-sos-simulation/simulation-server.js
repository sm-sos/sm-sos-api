const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Engine Data
let engines = [
  {
    id: "ENG-001",
    position: "PORT",
    rpm: 3000,
    temp: 85,
    oil: 40,
    fuel_rate: 20,
    battery: 13.8
  },
  {
    id: "ENG-002",
    position: "STBD",
    rpm: 2800,
    temp: 88,
    oil: 38,
    fuel_rate: 18,
    battery: 13.6
  }
];

// Update simulation
function updateEngines() {
  engines.forEach(engine => {
    engine.rpm += Math.random() * 100 - 50;
    engine.temp += Math.random() * 2 - 1;
    engine.oil += Math.random() * 2 - 1;

    engine.rpm = Math.max(600, Math.min(4500, engine.rpm));
    engine.temp = Math.max(60, Math.min(110, engine.temp));
    engine.oil = Math.max(15, Math.min(60, engine.oil));
  });
}

// Status logic
function getStatus(engine) {
  if (engine.temp > 95) return "CRITICAL";
  if (engine.oil < 25) return "WARNING";
  return "NORMAL";
}

// ✅ Root (مهم جدًا لRailway)
app.get("/", (req, res) => {
  res.status(200).send("SM-SOS Simulation Running");
});

// ✅ Health check (أفضل لRailway)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ✅ API
app.get("/api/simulation", (req, res) => {
  try {
    console.log("Simulation API called");

    updateEngines();

    const result = engines.map(engine => ({
      position: engine.position,
      rpm: Math.round(engine.rpm),
      temp: Math.round(engine.temp),
      oil: Math.round(engine.oil),
      fuel_rate: Math.round(engine.fuel_rate),
      battery: engine.battery,
      status: getStatus(engine)
    }));

    res.status(200).json({
      vessel: "Yacht Alpha",
      engines: result,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Error in /api/simulation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Error handler (احترافي)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).send("Server Error");
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("Simulation Server running on port " + PORT);
});
