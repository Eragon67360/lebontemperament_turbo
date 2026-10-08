import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { initialsOf } from "@/utils/members/list";

/** The member's photo, or their initials on the soft teal fallback. Decorative: the name is always beside it. */
export function MemberAvatar({
  user,
  className,
}: {
  user: Pick<User, "avatar" | "display_name" | "email">;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9 text-[13px]", className)} aria-hidden>
      {user.avatar && (
        <AvatarImage src={user.avatar} alt="" className="object-cover" />
      )}
      <AvatarFallback>
        {initialsOf(user.display_name, user.email)}
      </AvatarFallback>
    </Avatar>
  );
}
