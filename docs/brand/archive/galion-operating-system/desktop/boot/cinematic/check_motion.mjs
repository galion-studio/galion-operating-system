// G.A.L.I.O.N. — General Autonomous Local Intelligence Open Network
// Developed and distributed by Galion Labs
// Perpetual Open MIT License
// Copyright © 2026 Galion Labs. All rights reserved.
// The licence text is LICENSE at the repository root. This file does not restate it.

import { readFileSync } from "node:fs";
import { at, position } from "./motion.mjs";

const timeline = JSON.parse(readFileSync(new URL("./timeline.json", import.meta.url), "utf8"));
const times = [0, 0.2, 0.205, 0.21, 1.0, 1.2, 2.31, 2.32, 2.45, 2.6, 3.5, 4.2, 4.5, 4.7, 5.0];
const payload = {};
for (const t of times) payload[t.toFixed(3)] = position(at(timeline, t));
process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
