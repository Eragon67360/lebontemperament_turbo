import { AuthProvider } from "@/components/providers/AuthProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthProvider>{children}</AuthProvider>
    </>
  );
}

export default Providers;
