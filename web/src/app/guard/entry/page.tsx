"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, RefreshCw } from "lucide-react";

type Flat = { id: string; flatNumber: string; building?: string };

export default function EntryPage() {
  const { data: session } = useSession();
  const [personType, setPersonType] = useState("visitor");
  const [personId, setPersonId] = useState("unknown");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleEntry(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/gate-ops/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateId: session?.user.gateId ?? "",
          guardId: session?.user.id ?? "",
          personType,
          personId,
          method: "manual",
          vehicleNumber: vehicleNumber || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccess(`Entry logged! Log ID: ${data.entryLogId}`);
      setPersonId("unknown"); setVehicleNumber("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Manual Entry Log</h1>
        <p className="text-sm text-muted-foreground">Manually log an entry that wasn't auto-identified</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleEntry} className="space-y-3">
            <div className="space-y-1">
              <Label>Person Type</Label>
              <select
                className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={personType}
                onChange={(e) => setPersonType(e.target.value)}
              >
                <option value="visitor">Visitor</option>
                <option value="resident">Resident</option>
                <option value="staff">Staff</option>
                <option value="vehicle">Vehicle Only</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pid">Person ID / Name</Label>
              <Input id="pid" placeholder="ID or name for reference" value={personId} onChange={(e) => setPersonId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plate">Vehicle Number (optional)</Label>
              <Input id="plate" placeholder="e.g. MH12AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded p-2">
                <CheckCircle className="size-4" /> {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><RefreshCw className="size-4 mr-2 animate-spin" />Logging…</> : "Log Entry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
