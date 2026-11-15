"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Users, Building, TrendingUp, Shield, AlertCircle } from "lucide-react";

export default function AdminOverview() {
  const { data: stats } = useQuery<any>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const { data: liveEntries = [] } = useQuery<any[]>({
    queryKey: ["dashboard-live"],
    queryFn: () => fetch("/api/dashboard/live").then((r) => r.json()),
    refetchInterval: 10_000,
  });

  const { data: residents = [] } = useQuery<any[]>({
    queryKey: ["residents"],
    queryFn: () => fetch("/api/residents").then((r) => r.json()),
  });

  const { data: flats = [] } = useQuery<any[]>({
    queryKey: ["flats"],
    queryFn: () => fetch("/api/flats").then((r) => r.json()),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Society Overview</h1>
        <p className="text-sm text-muted-foreground">Secretary dashboard — full society visibility</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Entries Today", value: stats?.totalEntriesToday ?? "—", icon: TrendingUp, color: "text-blue-600" },
          { label: "Inside Now", value: stats?.currentlyInside ?? "—", icon: Users, color: "text-green-600" },
          { label: "Pending Approvals", value: stats?.pendingApprovals ?? "—", icon: AlertCircle, color: "text-yellow-600" },
          { label: "Total Residents", value: residents.length || "—", icon: Building, color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
              <Icon className={`size-4 ${color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entry breakdown */}
      {stats?.entryBreakdown && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Today's Entry Types</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              {Object.entries(stats.entryBreakdown).map(([type, count]) => (
                <div key={type} className="space-y-1">
                  <p className="text-lg font-semibold">{count as number}</p>
                  <p className="text-xs text-muted-foreground capitalize">{type}s</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently inside */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Currently Inside ({liveEntries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {liveEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Society is empty right now.</p>
          ) : (
            liveEntries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {entry.resident?.name ?? entry.visit?.visitor?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.gate?.name} · {new Date(entry.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <StatusBadge status={entry.personType} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Flat occupancy */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Flat Overview ({flats.length} flats)</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y max-h-64 overflow-y-auto">
          {flats.map((flat: any) => (
            <div key={flat.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <span className="text-sm font-medium">Flat {flat.flatNumber}</span>
                {flat.building && <span className="text-xs text-muted-foreground ml-1">({flat.building})</span>}
              </div>
              <span className="text-xs text-muted-foreground">{flat.residents?.length ?? 0} resident(s)</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
