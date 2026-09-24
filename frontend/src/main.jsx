import React from "react";

// MUST be set before any other module imports are evaluated.
// ESM imports are hoisted, so this runs after ALL imports resolve.
// The only reliable fix is a bootstrap file pattern using dynamic import.
window.React = React;

// Now dynamically import the rest of the app — this guarantees
// window.React is set before react-calendar, react-time-picker,
// react-clock, and other UMD-style libraries initialize.
import("./bootstrap.jsx");
