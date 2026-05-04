const express = require("express");
const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

// Engines
let engines = [
  {
    id: "ENG-001",
    instance: 0,
    position: "PORT",
    fuel: "DIESEL",
    state: "CRUISE",
    data: {
      rpm: 3000,
      temp: 85,
      oil: 40,
      fuel_rate: 20,
      battery: 13.8,
      hours: 1200,
      load: 60
    },
    faults: []
  },
  {
    id: "ENG-002",
    instance: 1,
    position: "STBD",
    fuel: "DIESEL",
    state: "CRUISE",
    data: {
      rpm: 2800,
      temp: 88,
      oil: 38,
      fuel_rate: 18,
      battery: 13.6,
      hours: 1250,
      load: 55
    },
    faults: []
  }
];

// Update simulation
function updateEngines() {
  engines.forEach(engine => {

    if (engine.state === "CRUISE") {
      engine.data.rpm = 2800 + Math.random() * 300;
    }

    engine.data.temp += Math.random() * 2 - 1;
    engine.data.oil += Math.random() * 2 - 1;
    engine.data.fuel_rate += Math.random() * 2 - 1;

    engine.data.battery += Math.random() * 0.1 - 0.05;

    engine.data.load = Math.random() * 100;

    if (engine.fuel === "DIESEL") {
      engine.data.boost = Math.random() * 2 + 1;
    }

    engine.data.rpm = Math.max(600, Math.min(4500, engine.data.rpm));
    engine.data.temp = Math.max(60, Math.min(110, engine.data.temp));
    engine.data.oil = Math.max(15, Math.min(60, engine.data.oil));
    engine.data.battery = Math.max(12.5, Math.min(14.5, engine.data.battery));

    engine.faults = [];

    if (engine.data.temp > 95) {
      engine.faults.push({
        spn: 110,
        fmi: 3,
        desc: "Coolant Temp High",
        severity: "CRITICAL"
      });
    }

    if (engine.data.oil < 25) {
      engine.faults.push({
        spn: 100,
        fmi: 1,
        desc: "Low Oil Pressure",
        severity: "WARNING"
      });
    }

  });
}

// Health score
function getHealth(engine) {
  let score = 100;

  if (engine.data.temp > 95) score -= 20;
  if (engine.data.oil < 25) score -= 20;
  if (engine.faults.length > 0) score -= 30;

  return Math.max(score, 0);
}

// Estimated time to failure
function getETF(engine) {
  if (engine.data.temp > 95) return "14h";
  if (engine.data.oil < 25) return "10h";
  return "Stable";
}

// Status
function getStatus(engine) {
  if (engine.faults.some(f => f.severity === "CRITICAL")) return "CRITICAL";
  if (engine.faults.length > 0) return "WARNING";
  return "NORMAL";
}

// API endpoint
app.get("/api/simulation", (req, res) => {

  updateEngines();

  const result = engines.map(engine => ({
    engine_id: engine.id,
    position: engine.position,
    rpm: Math.round(engine.data.rpm),
    temp: Math.round(engine.data.temp),
    oil: Math.round(engine.data.oil),
    fuel_rate: Math.round(engine.data.fuel_rate),
    battery: parseFloat(engine.data.battery.toFixed(2)),
    load: Math.round(engine.data.load),
    boost: engine.data.boost ? parseFloat(engine.data.boost.toFixed(2)) : null,
    status: getStatus(engine),
    faults: engine.faults,
    health: getHealth(engine),
    etf: getETF(engine),
    timestamp: new Date()
  }));

  res.json({
    vessel: "Yacht Alpha",
    engines: result,
    timestamp: new Date()
  });

});

// Start server
app.listen(PORT, () => {
  console.log("Simulation Server running on port " + PORT);
});
