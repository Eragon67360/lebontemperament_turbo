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
      className="w-2/5 lg:w-1/5 rounded-r-lg bg-gradient-to-r from-primary to-[#00F1AE] text-white font-bold text-xs md:text-sm lg:text-base"
    >
      S&apos;abonner
    </button>
  );
};

export default ButtonWithToast;
