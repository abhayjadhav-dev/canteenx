import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPwaButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };

    const onInstalled = () => {
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (!promptEvent) return null;

  return (
    <button className="btn btn-outline btn-sm" onClick={handleInstall}>
      <Download size={16} /> Install
    </button>
  );
}
