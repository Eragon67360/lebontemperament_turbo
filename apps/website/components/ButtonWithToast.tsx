"use client";

import { Button } from "@heroui/react";
import React from "react";
import { toast } from "sonner";

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
    <Button
      onClick={handleClick}
      color="primary"
      radius="sm"
      className="w-2/5 text-xs font-bold md:text-sm lg:w-1/5 lg:text-base"
    >
      S&apos;abonner
    </Button>
  );
};

export default ButtonWithToast;
