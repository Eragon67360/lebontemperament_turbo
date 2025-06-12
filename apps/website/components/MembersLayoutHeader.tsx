"use client";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function MembersLayoutHeader({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_user");
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem("cached_user", JSON.stringify(data.user));
      }
    };
    getUser();
  }, [supabase]);

  const getFirstName = (fullName: string) => {
    if (!fullName) return "";

    const matches = fullName.match(/^([A-Za-z]+(?:-[A-Za-z]+)*)/);

    if (matches) {
      return matches[0];
    }

    const parts = fullName.split(/(?=[A-Z]{2,})/);
    return parts[0]?.trim();
  };

  return (
    <>
      {pathname.startsWith("/membres/") ? (
        <div className="container mx-auto flex-1 flex flex-col min-h-0 px-4 sm:px-6 lg:px-8">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mr-auto py-3 sm:py-4 lg:py-6 flex gap-2 sm:gap-3 lg:gap-4 items-center flex-shrink-0">
            <Image alt="picto" src={"/img/picto.svg"} width={48} height={48} />
            {user && (
              <span className="truncate">
                Bonjour,{" "}
                <span className="inline-block">
                  {getFirstName(
                    user.user_metadata.display_name || user.user_metadata.name,
                  )}
                </span>
              </span>
            )}
          </div>
          {children}
        </div>
      ) : (
        <div className="grow flex-1 h-fit w-full p-4 flex items-center justify-center">
          {children}
        </div>
      )}
    </>
  );
}
