// app/galerie/loading.tsx
import React from "react";

const Loading = () => {
  return (
    <div className="container mx-auto mb-32 flex w-full flex-col px-8">
      <div className="animate-pulse">
        <div className="bg-default-200 mb-8 h-32 w-1/3 rounded"></div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-8 lg:flex-row">
              <div className="bg-default-200 h-[400px] w-full rounded lg:w-1/2"></div>
              <div className="w-full space-y-4 lg:w-1/2">
                <div className="bg-default-200 h-12 w-3/4 rounded"></div>
                <div className="bg-default-200 h-6 w-1/2 rounded"></div>
                <div className="bg-default-200 h-6 w-1/2 rounded"></div>
                <div className="bg-default-200 h-6 w-1/2 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loading;
