import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./i18n";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './utils/network.js';
import './utils/axiosCache.js';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer position="bottom-right" />
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
    navigator.serviceWorker.register(swUrl, import.meta.env.DEV ? { type: 'module' } : {}).catch(console.error);
  });
} 