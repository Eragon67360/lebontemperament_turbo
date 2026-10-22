"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import {
  type MemberOrder,
  parseMemberOrders,
} from "@repo/domain/utils/memberOrders";
import { ORDER_DOCUMENTS_BUCKET } from "@repo/domain/utils/orderDocuments";
import { useEffect, useState } from "react";

export type MemberOrdersState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; orders: MemberOrder[] };

// One read per signed-in user and page load, shared by the home and the page.
const cache = new Map<string, Promise<MemberOrder[]>>();

function readOrders(userId: string): Promise<MemberOrder[]> {
  let pending = cache.get(userId);
  if (!pending) {
    pending = loadBrowserClient()
      .then((supabase) => supabase.rpc("member_orders"))
      .then(({ data, error }) => {
        if (error) throw error;
        return parseMemberOrders(data);
      });
    // A failure is not kept: the next visit asks again.
    pending.catch(() => cache.delete(userId));
    cache.set(userId, pending);
  }
  return pending;
}

/**
 * The signed-in member's own orders (public.member_orders(): only the
 * orders a superadmin linked to their account, until 30 days after
 * delivery), newest delivery first.
 */
export function useMemberOrders(): MemberOrdersState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<{
    userId: string;
    result: MemberOrdersState;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    readOrders(userId).then(
      (orders) => {
        if (!cancelled) {
          setState({ userId, result: { status: "ready", orders } });
        }
      },
      () => {
        if (!cancelled) setState({ userId, result: { status: "error" } });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId || state?.userId !== userId) return { status: "loading" };
  return state.result;
}

/**
 * Opens the member's order form: a one-minute signed link from the private
 * bucket, which the storage policy only grants to the member the order
 * names (and superadmins). Resolves false when it could not be opened.
 */
export async function downloadOrderDocument(document: {
  key: string;
  name: string;
}): Promise<boolean> {
  try {
    const supabase = await loadBrowserClient();
    const { data, error } = await supabase.storage
      .from(ORDER_DOCUMENTS_BUCKET)
      .createSignedUrl(document.key, 60, { download: document.name });
    if (error || !data?.signedUrl) return false;
    window.location.assign(data.signedUrl);
    return true;
  } catch {
    return false;
  }
}
