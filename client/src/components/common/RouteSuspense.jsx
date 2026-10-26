import React, { Suspense } from 'react';

export const RouteLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-6 h-6 border-2 border-line border-t-primary rounded-full animate-spin mb-3" />
    <span className="text-xs text-ink-muted font-mono tracking-wider">Loading...</span>
  </div>
);

export const RouteSuspense = ({ children }) => {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
};

export default RouteSuspense;
