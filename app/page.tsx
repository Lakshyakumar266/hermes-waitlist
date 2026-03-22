"use client";

import WaitlistPage from "../components/waitlist";
import { LoadingScreen } from "../components/loadingScreen";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [modelReady, setModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0); // ← add

  useEffect(() => {
    // Set the page title
    document.title = "Hermes Workspace - Waitlist";

    // Set the favicon (logo) dynamically
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = "/hermes-square-icon.svg"; // make sure the file exists in your public folder
  }, []);

  return (
    <>
      <AnimatePresence>
        {!modelReady && <LoadingScreen progress={loadProgress} />}{" "}
        {/* ← pass progress */}
      </AnimatePresence>
      <div style={{ visibility: modelReady ? "visible" : "hidden" }}>
        <WaitlistPage onModelReady={setModelReady} />
      </div>
    </>
  );
}
