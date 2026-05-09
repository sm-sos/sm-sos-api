const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ============================
// Engine Configuration (Identity Layer)
// ============================
let engines = [
  {
    engine: {
      id: "ENG-001",
      position: "PORT"
    },
    identity: {
      fuel_type: "Diesel",
      protocol: "J1939"
    }
  },
  {
    engine: {
      id: "ENG-002",
      position: "STBD"
    },
    identity: {
      fuel_type: "Diesel",
      protocol: "J1939"
    }
  }
];

// ============================
// Root (for testing)
// ============================
app.get("/", (req, res) => {
  res.send("✅ YDEG API Running");
});

// ============================
// Health Check
// ============================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ============================
// Simulate Telemetry (PGNs)
// ============================
function simulateTelemetry(engine) {

  const rpm = Math.floor(600 + Math.random() * 3900);
  const load = Math.round((rpm / 4500) * 100);

  return {
    pgn_127488: {
      pgn: 127488,
      rpm,
      load
    },
    pgn_127489: {
      pgn: 127489,
      temp: Math.round(70 + load * 0.4),
      oil: Math.round(30 + load * 0.3),
      fuel_rate: Math.round(10 + load * 0.2),
      battery: Number((13.5 + Math.random()).toFixed(2))
    },
    pgn_127493: {
      pgn: 127493,
      gear: ["FWD", "NEUTRAL", "REV"][Math.floor(Math.random() * 3)],
      trans_temp: Math.round(40 + Math.random() * 20)
    }
  };
}

// ============================
// Simulate ECU Diagnostics
// ============================
function simulateDiagnostics(telemetry) {

  let dtc = [];

  if (telemetry.pgn_127489.temp > 95) {
    dtc.push({
      pgn: 65226,
      spn: 110,
      code: "E001",
      severity: "CRITICAL",
      description: "Engine Over Temperature"
    });
  }

  if (telemetry.pgn_127489.oil < 25) {
    dtc.push({
      pgn: 65226,
      spn: 100,
      code: "E002",
      severity: "WARNING",
      description: "Low Oil Pressure"
    });
  }

  const engine_status_bits = {
    check_engine: dtc.length > 0,
    over_temp: telemetry.pgn_127489.temp > 95,
    low_oil: telemetry.pgn_127489.oil < 25,
    warning: dtc.length > 0
  };

  const transmission_status = {
    warning: telemetry.pgn_127493.trans_temp > 70
  };

  return {
    dtc,
    engine_status_bits,
    transmission_status
  };
}

// ============================
// API Endpoint
// ============================
app.get("/api/simulation", (req, res) => {

  const result = engines.map(engine => {

    const telemetry = simulateTelemetry(engine);
    const diagnostics = simulateDiagnostics(telemetry);

    return {
      engine: engine.engine,
      identity: engine.identity,
      telemetry,
      diagnostics,
      timestamp: new Date().toISOString()
    };
  });

  const system_status =
    result.some(e => e.diagnostics.dtc.length > 0) ? "ALERT" : "NORMAL";

  res.json({
    source: "YDEG-04 Simulation",
    protocol: "NMEA2000",
    system_status,
    engines: result,
    timestamp: new Date().toISOString()
  });
});

// ============================
// Start Server
// ============================
app.listen(PORT, () => {
  console.log(`🚀 YDEG Simulation running on ${PORT}`);
});
