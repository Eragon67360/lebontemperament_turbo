"use client";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function DashboardWelcomeHeader() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, [supabase]);

  const displayName =
    user?.user_metadata.display_name || user?.user_metadata.name;

  return (
    <div className="mb-12">
      <h1 className="text-2xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-black/60">
        Bonjour,{" "}
        <motion.span
          initial={{
            opacity: 0,
          }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
        >
          {displayName}
        </motion.span>
      </h1>
    </div>
  );
}
