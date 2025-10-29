import React from "react";
import RehearsalsList from "@/components/RehearsalsList";

export default function Repetitions() {
  return (
    <div className="container mx-auto flex h-full max-h-screen grow flex-col overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <RehearsalsList />
    </div>
  );
}
