import React from 'react';

const Logo = ({ 
  src, 
  alt = "Company Logo", 
  className = "",
  width = 150,
  height = 50
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={src} 
        alt={alt} 
        className="object-contain" 
        width={width} 
        height={height}
      />
    </div>
  );
};

export default Logo;
