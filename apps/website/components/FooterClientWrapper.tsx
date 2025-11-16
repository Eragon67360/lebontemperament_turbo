"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

export const FooterClientWrapper = () => {
  const path = usePathname();
  if (path === "/") {
    return <></>;
  }
  return (
    <>
      <Footer />
    </>
  );
};
