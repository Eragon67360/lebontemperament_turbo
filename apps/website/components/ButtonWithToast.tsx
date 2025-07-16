"use client";
import React from "react";
import { toast } from "sonner";

// Define the props type for the component
interface ButtonWithToastProps {
  message: string;
  description: string;
  onClick: () => void;
}

const ButtonWithToast: React.FC<ButtonWithToastProps> = ({
  message,
  description,
  onClick,
}) => {
  const handleClick = () => {
    onClick();
    toast(message, { description });
  };

  return (
    <button
      onClick={handleClick}
      className="from-primary w-2/5 rounded-r-lg bg-gradient-to-r to-[#00F1AE] text-xs font-bold text-white md:text-sm lg:w-1/5 lg:text-base"
    >
      S&apos;abonner
    </button>
  );
};

export default ButtonWithToast;
