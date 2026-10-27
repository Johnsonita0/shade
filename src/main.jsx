import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "aos/dist/aos.css";
import App from "./App.jsx";
import "../styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
