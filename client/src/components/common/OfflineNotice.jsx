import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineNotice = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-danger text-surface px-4 py-2.5 text-xs font-medium text-center flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Please check your internet connection to continue.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="underline font-semibold ml-2 inline-flex items-center gap-1 hover:text-surface-alt"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
};

export default OfflineNotice;
