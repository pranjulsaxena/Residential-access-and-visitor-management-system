"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, User, Settings } from "lucide-react";

const roleColors: Record<string, string> = {
  guard: "bg-blue-100 text-blue-800",
  resident: "bg-green-100 text-green-800",
  secretary: "bg-purple-100 text-purple-800",
};

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="border-b bg-background px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary p-1.5">
          <Shield className="size-4 text-primary-foreground" />
        </div>
        <div>
          <span className="font-semibold text-sm">RAVS</span>
          {user?.gateName && (
            <span className="text-xs text-muted-foreground ml-2">
              • {user.gateName}
            </span>
          )}
          {user?.flatNumber && (
            <span className="text-xs text-muted-foreground ml-2">
              • Flat {user.flatNumber}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              <span>{user.name}</span>
              <Badge
                className={roleColors[user.role] ?? ""}
                variant="outline"
              >
                {user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
