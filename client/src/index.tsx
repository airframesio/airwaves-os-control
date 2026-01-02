import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main entry point loaded");

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("Root element not found");
}
