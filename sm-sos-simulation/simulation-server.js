const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ============================
// Engine Data
// ============================
let engines = [
  {
    id: "ENG-001",
    position: "PORT",
    battery: 13.8
  },
  {
    id: "ENG-002",
    position: "STBD",
    battery: 13.6
  }
];

// ============================
// Engine Mode Logic
// ============================
function getEngineMode(rpm) {
  if (rpm < 1000) return "IDLE";
  if (rpm < 3200) return "CRUISE";
  return "HIGH";
}

// ============================
// Status Logic
// ============================
function getStatus(engine) {
  if (engine.temp > 95 || engine.oil < 20) return "CRITICAL";
  if (engine.temp > 90 || engine.oil < 25) return "WARNING";
  return "NORMAL";
}

// ============================
// Alerts Logic
// ============================
function getAlerts(engine) {
  let alerts = [];

  if (engine.temp > 95) alerts.push("HIGH_TEMP");
  if (engine.oil < 25) alerts.push("LOW_OIL");
  if (engine.rpm > 4200) alerts.push("HIGH_RPM");

  return alerts;
}

// ============================
// Health Score (0 - 100)
// ============================
function getHealth(engine) {
  let score = 100;

  if (engine.temp > 90) score -= 20;
  if (engine.oil < 30) score -= 20;
  if (engine.rpm > 4000) score -= 10;

  return Math.max(0, score);
}

// ============================
// Update Simulation
// ============================
function updateEngines() {
  engines.forEach(engine => {

    // Random operating mode
    const modeRand = Math.random();

    if (modeRand < 0.3) {
      engine.rpm = 600 + Math.random() * 300; // Idle
    } else if (modeRand < 0.8) {
      engine.rpm = 2200 + Math.random() * 1000; // Cruise
    } else {
      engine.rpm = 3500 + Math.random() * 1000; // High
    }

    // Load %
    engine.load = Math.round((engine.rpm / 4500) * 100);

    // Temperature
    engine.temp = 70 + (engine.load * 0.4) + (Math.random() * 2 - 1);

    // Oil pressure
    engine.oil = 30 + (engine.load * 0.3) + (Math.random() * 2 - 1);

    // Fuel rate
    engine.fuel_rate = Math.round(10 + engine.load * 0.2);

    // Vibration (simulated stability)
    engine.vibration = (Math.random() * 5).toFixed(2);

    // Clamp
    engine.rpm = Math.max(600, Math.min(4500, engine.rpm));
    engine.temp = Math.max(60, Math.min(110, engine.temp));
    engine.oil = Math.max(15, Math.min(60, engine.oil));
  });
}

// ============================
// Root
// ============================
app.get("/", (req, res) => {
  res.status(200).send("✅ SM-SOS Simulation Running");
});

// ============================
// Health Check
// ============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ============================
// Simulation API
// ============================
app.get("/api/simulation", (req, res) => {
  try {
    updateEngines();

    const result = engines.map(engine => {
      const mode = getEngineMode(engine.rpm);
      const status = getStatus(engine);
      const alerts = getAlerts(engine);
      const health = getHealth(engine);

      return {
        id: engine.id,
        position: engine.position,
        mode,
        rpm: Math.round(engine.rpm),
        load: engine.load,
        temp: Math.round(engine.temp),
        oil: Math.round(engine.oil),
        fuel_rate: engine.fuel_rate,
        battery: engine.battery,
        vibration: engine.vibration,
        status,
        health,
        alerts
      };
    });

    res.status(200).json({
      vessel: "Yacht Alpha",
      engines: result,
      summary: {
        total_engines: result.length,
        critical: result.filter(e => e.status === "CRITICAL").length,
        warnings: result.filter(e => e.status === "WARNING").length,
        average_health: Math.round(
          result.reduce((sum, e) => sum + e.health, 0) / result.length
        )
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error("❌ Error in /api/simulation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============================
// Global Error Handler
// ============================
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).send("Server Error");
});

// ============================
// Start Server
// ============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Simulation Server running on port ${PORT}`);
});
