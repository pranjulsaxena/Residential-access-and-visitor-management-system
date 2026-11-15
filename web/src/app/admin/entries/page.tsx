"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { TrendingUp, LogIn, LogOut } from "lucide-react";

export default function EntriesPage() {
  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: ["all-entries"],
    queryFn: () => fetch("/api/entries?limit=50").then((r) => r.json()),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Entry Log</h1>
        <p className="text-sm text-muted-foreground">All gate entries — refreshes every 15s</p>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
          {entries.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">No entries recorded today.</p>
          )}
          {entries.map((entry: any) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`rounded-full p-1.5 ${entry.exitTime ? "bg-muted" : "bg-green-100"}`}>
                {entry.exitTime ? <LogOut className="size-3.5 text-muted-foreground" /> : <LogIn className="size-3.5 text-green-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium capitalize">{entry.personType}</p>
                  <StatusBadge status={entry.exitTime ? "exited" : "active"} />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.gate?.name} · {entry.guard?.name} ·{" "}
                  {new Date(entry.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  {entry.exitTime && ` → ${new Date(entry.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
              {entry.plateScan && (
                <span className="text-xs font-mono text-muted-foreground">{entry.plateScan.extractedNumber}</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
