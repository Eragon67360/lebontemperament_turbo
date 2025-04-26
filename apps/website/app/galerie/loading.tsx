// app/galerie/loading.tsx
import React from "react";

const Loading = () => {
  return (
    <div className="px-8 max-w-[1440px] w-full flex flex-col mb-32">
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/2 h-[400px] bg-gray-200 rounded"></div>
              <div className="w-full lg:w-1/2 space-y-4">
                <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
