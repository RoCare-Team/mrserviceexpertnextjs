// ServicesSkeleton.jsx
import React from "react";

const ServicesSkeleton = () => {
  // Create an array of 4 items for skeleton loading
  const skeletonItems = Array(10).fill(null);

  return (
    <div className="services-list">
      {/* Service Items Skeleton - Exact match with your image */}
      {skeletonItems.map((_, index) => (
        <div 
          key={index} 
          className="common-service-style border-b border-gray-200 py-4 px-4"
        >
          <div className="flex justify-between items-start">
            {/* Left side - Service Details */}
            <div className="flex-1">
              {/* Category Badge - "Repair" */}
              <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse mb-2"></div>
              
              {/* Service Name - Main heading */}
              <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
              
              {/* Rating and Reviews */}
              <div className="flex items-center gap-1 mb-3">
                {/* Star */}
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                {/* Rating number */}
                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                {/* Reviews text */}
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* Prices Section */}
              <div className="flex items-center gap-2 mb-2">
                {/* Current Price - ₹399 */}
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                {/* Original Price - ₹499 */}
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* "Added" Button Placeholder */}
              <div className="mt-1">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="ml-4">
              <div className="h-20 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Bottom Info Section - 3 lines of text */}
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicesSkeleton;