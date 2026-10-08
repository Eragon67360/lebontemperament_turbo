import { ROLE_LABELS } from "@/utils/members/list";
// utils/roleUtils.ts
export function getRoleBadgeVariant(role: "user" | "admin" | "superadmin") {
  switch (role) {
    case "superadmin":
      return "default"; // Could be a custom variant like 'purple'
    case "admin":
      return "secondary";
    case "user":
      return "outline";
    default:
      return "outline";
  }
}

export function getRoleLabel(role: "user" | "admin" | "superadmin") {
  return ROLE_LABELS[role] ?? role;
}
