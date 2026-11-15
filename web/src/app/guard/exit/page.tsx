"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type EntryLog = {
  id: string;
  personType: string;
  personId: string;
  entryTime: string;
  exitTime: string | null;
  gate: { name: string };
};

export default function ExitPage() {
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data: entries = [], refetch } = useQuery<EntryLog[]>({
    queryKey: ["active-entries"],
    queryFn: () => fetch("/api/entries?limit=30").then((r) => r.json()),
    refetchInterval: 10_000,
  });

  const activeEntries = entries.filter((e) => !e.exitTime);

  async function logExit(entryLogId: string) {
    setExitingId(entryLogId); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/gate-ops/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryLogId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccess("Exit logged successfully.");
      refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExitingId(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Log Exit</h1>
        <p className="text-sm text-muted-foreground">People currently inside — tap to mark exit</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded p-2">
          <CheckCircle className="size-4" /> {success}
        </div>
      )}

      <Card>
        <CardContent className="p-0 divide-y">
          {activeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active entries found.</p>
          ) : (
            activeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 gap-3">
                <div>
                  <p className="text-sm font-medium capitalize">{entry.personType}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.gate.name} · {new Date(entry.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={exitingId === entry.id}
                  onClick={() => logExit(entry.id)}
                >
                  {exitingId === entry.id ? <RefreshCw className="size-3 animate-spin" /> : "Mark Exit"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
