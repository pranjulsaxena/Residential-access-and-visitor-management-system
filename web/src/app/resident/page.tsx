"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Bell, Car, Users } from "lucide-react";

export default function ResidentHome() {
  const { data: session } = useSession();

  const { data: pending = [] } = useQuery<any[]>({
    queryKey: ["pending-approvals"],
    queryFn: () => fetch("/api/visits/pending").then((r) => r.json()),
    refetchInterval: 5_000,
  });

  const { data: visits = [] } = useQuery<any[]>({
    queryKey: ["my-visits"],
    queryFn: () => fetch(`/api/visits?limit=10`).then((r) => r.json()),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {session?.user.name}</h1>
        <p className="text-sm text-muted-foreground">Flat {session?.user.flatNumber}</p>
      </div>

      {/* Pending notification */}
      {pending.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Bell className="size-5 text-yellow-600 animate-bounce" />
            <div>
              <p className="font-medium text-sm">
                {pending.length} visitor{pending.length > 1 ? "s" : ""} waiting for your approval!
              </p>
              <a href="/resident/approvals" className="text-xs text-yellow-700 underline">
                Review now →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="size-5 mx-auto mb-1 text-yellow-600" />
            <p className="text-xl font-bold">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="size-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xl font-bold">{visits.length}</p>
            <p className="text-xs text-muted-foreground">Recent Visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="size-5 mx-auto mb-1 text-green-600" />
            <p className="text-xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Vehicles</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent visits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Visitor History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No visitor history yet.</p>
          ) : (
            visits.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{v.visitor?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.purpose} · {new Date(v.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
