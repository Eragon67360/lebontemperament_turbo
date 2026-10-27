import { ROLE_LABELS, type Role } from "@/utils/members/list";
// utils/roleUtils.ts
export function getRoleBadgeVariant(role: Role) {
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

export function getRoleLabel(role: Role) {
  return ROLE_LABELS[role] ?? role;
}
