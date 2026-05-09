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
// Simulate Telemetry (PGNs)
// ============================
function simulateTelemetry(engine) {

  const rpm = Math.floor(600 + Math.random() * 3900);
  const load = Math.round((rpm / 4500) * 100);

  return {
    pgn_127488: { // Engine Rapid
      rpm,
      load
    },
    pgn_127489: { // Engine Dynamic
      temp: Math.round(70 + load * 0.4),
      oil: Math.round(30 + load * 0.3),
      fuel_rate: Math.round(10 + load * 0.2),
      battery: Number((13.5 + Math.random()).toFixed(2))
    },
    pgn_127493: { // Transmission
      gear: Math.random() > 0.5 ? "FWD" : "NEUTRAL",
      trans_temp: Math.round(40 + Math.random() * 20)
    }
  };
}

// ============================
// Simulate ECU Diagnostics
// ============================
function simulateDiagnostics(telemetry) {

  let dtc = [];

  // DTC (PGN 65226)
  if (telemetry.pgn_127489.temp > 95) {
    dtc.push({
      pgn: 65226,
      spn: 110,
      code: "E001",
      description: "Engine Over Temperature"
    });
  }

  if (telemetry.pgn_127489.oil < 25) {
    dtc.push({
      pgn: 65226,
      spn: 100,
      code: "E002",
      description: "Low Oil Pressure"
    });
  }

  // Engine Status Bits (24-bit simplified)
  const engine_status_bits = {
    check_engine: dtc.length > 0,
    over_temp: telemetry.pgn_127489.temp > 95,
    low_oil: telemetry.pgn_127489.oil < 25,
    warning: dtc.length > 0
  };

  // Transmission Status (5-bit simplified)
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
// API
// ============================
app.get("/api/simulation", (req, res) => {

  const result = engines.map(engine => {

    const telemetry = simulateTelemetry(engine);
    const diagnostics = simulateDiagnostics(telemetry);

    return {
      engine: engine.engine,
      identity: engine.identity,
      telemetry,
      diagnostics
    };
  });

  res.json({
    source: "YDEG-04 Simulation",
    protocol: "NMEA2000",
    engines: result,
    timestamp: new Date().toISOString()
  });
});

// ============================
app.listen(PORT, () => {
  console.log(`🚀 YDEG Simulation running on ${PORT}`);
});
});
