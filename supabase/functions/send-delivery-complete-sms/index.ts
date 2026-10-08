import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperadmin } from "../_shared/caller-auth.ts";
import { deliveryMessage } from "../_shared/delivery-messages.ts";
import { pushToRecipient } from "../_shared/delivery-push.ts";
import { requireServiceKey } from "../_shared/supabase-keys.ts";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      requireServiceKey(),
    );

    // Only the delivery driver (a superadmin) runs delivery rounds.
    const caller = await requireSuperadmin(req, supabaseAdmin);
    if (caller instanceof Response) return caller;

    const { recipientId } = await req.json();
    if (!recipientId) {
      return new Response(JSON.stringify({ error: "Missing recipientId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Since #593 « livrée » is a push only, to the phones linked in the app;
    // the name is kept for installed driver apps.
    const pushed = await pushToRecipient(
      supabaseAdmin,
      recipientId,
      deliveryMessage("delivered", recipientId),
    );

    return new Response(JSON.stringify({ success: true, pushed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in send-delivery-complete-sms function:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
