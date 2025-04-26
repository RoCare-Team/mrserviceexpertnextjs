// src/components/SiteLoader.js
import React, { useState, useEffect } from 'react';
// import Logo from './logo/Logo';
import Logo from '../logo/Logo';


const SiteLoader = ({ 
  logoSrc, 
  duration = 3000, 
  onLoadComplete 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(animate);
      } else if (onLoadComplete) {
        onLoadComplete();
      }
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [duration, onLoadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <Logo 
        src={logoSrc} 
        className="mb-6" 
        width={200} 
        height={100} 
      />
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full [background-color:#7533ea] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* <p className="mt-4 text-gray-600">
        {Math.round(progress)}% Loading...
      </p> */}
    </div>
  );
};

export default SiteLoader;
