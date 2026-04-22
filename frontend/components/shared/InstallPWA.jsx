"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "dd_pwa_install_dismissed";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setDismissed(alreadyDismissed || isStandalone);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] rounded-xl border bg-white p-3 shadow-lg md:inset-x-auto md:right-5 md:w-[430px]">
      <p className="text-sm font-medium text-slate-800">Install DDinfoways Staff App for quick access</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          Dismiss
        </Button>
        <Button size="sm" onClick={handleInstall} className="bg-[#1A3A5C] text-white hover:bg-[#15304A]">
          Install
        </Button>
      </div>
    </div>
  );
}
