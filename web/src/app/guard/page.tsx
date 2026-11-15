"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Users, Clock, AlertCircle, TrendingUp } from "lucide-react";

type Stats = {
  totalEntriesToday: number;
  currentlyInside: number;
  pendingApprovals: number;
  entryBreakdown: { resident: number; visitor: number; staff: number; unknown: number };
};

export default function GuardDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const { data: liveEntries = [] } = useQuery<any[]>({
    queryKey: ["dashboard-live"],
    queryFn: () => fetch("/api/dashboard/live").then((r) => r.json()),
    refetchInterval: 10_000,
  });

  const cards = [
    { title: "Entries Today", value: stats?.totalEntriesToday ?? "—", icon: TrendingUp, color: "text-blue-600" },
    { title: "Currently Inside", value: stats?.currentlyInside ?? "—", icon: Users, color: "text-green-600" },
    { title: "Pending Approvals", value: stats?.pendingApprovals ?? "—", icon: AlertCircle, color: "text-yellow-600" },
    { title: "Avg Entry/Hour", value: stats ? Math.round((stats.totalEntriesToday / 24) * 10) / 10 : "—", icon: Clock, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Guard Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time gate activity overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{isLoading ? "…" : value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdown */}
      {stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              {Object.entries(stats.entryBreakdown).map(([type, count]) => (
                <div key={type} className="space-y-1">
                  <p className="text-lg font-semibold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{type}s</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently Inside */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Currently Inside ({liveEntries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {liveEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No one is currently inside.</p>
          ) : (
            <div className="divide-y">
              {liveEntries.map((entry: any) => (
                <div key={entry.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {entry.resident?.name ?? entry.visit?.visitor?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.gate?.name} • {new Date(entry.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <StatusBadge status={entry.personType} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
