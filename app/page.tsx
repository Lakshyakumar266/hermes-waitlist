"use client";

import WaitlistPage from "../components/waitlist";
import { LoadingScreen } from "../components/loadingScreen";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [modelReady, setModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0); // ← add

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
