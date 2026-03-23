"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LoadingScreen } from "./loadingScreen";
import WaitlistPage from "./waitlist";
import useIsMobile from "../app/hooks/useIsMobile";

export default function HomePage() {
  const isMobile = useIsMobile();
  const [modelReady, setModelReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (isMobile) {
      const t = setTimeout(() => setModelReady(true), 600); // smooth fake load
      return () => clearTimeout(t);
    }
  }, [isMobile]);
  
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
