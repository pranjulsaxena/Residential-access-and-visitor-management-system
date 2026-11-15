"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Plus, Trash2, RefreshCw } from "lucide-react";

export default function VehiclesPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("car");
  const [make, setMake] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ["my-vehicles", session?.user.id],
    queryFn: () => fetch(`/api/vehicles?residentId=${session?.user.id}`).then((r) => r.json()),
    enabled: !!session?.user.id,
  });

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentId: session?.user.id, vehicleNumber, vehicleType, make }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      qc.invalidateQueries({ queryKey: ["my-vehicles"] });
      setVehicleNumber(""); setMake(""); setAdding(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteVehicle(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["my-vehicles"] });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Vehicles</h1>
          <p className="text-sm text-muted-foreground">Registered vehicles for automatic gate entry</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="size-4 mr-1" /> Add
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Register New Vehicle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addVehicle} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="vnum">Plate Number *</Label>
                <Input id="vnum" placeholder="e.g. MH12AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} required className="font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="make">Make / Brand</Label>
                  <Input id="make" placeholder="e.g. Honda" value={make} onChange={(e) => setMake(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading} className="flex-1">
                  {loading ? <RefreshCw className="size-4 animate-spin" /> : "Register Vehicle"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vehicle list */}
      <Card>
        <CardContent className="p-0 divide-y">
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vehicles registered yet.</p>
            </div>
          ) : (
            vehicles.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Car className="size-5 text-muted-foreground" />
                  <div>
                    <p className="font-mono font-semibold text-sm">{v.vehicleNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.vehicleType ?? "vehicle"}{v.make ? ` · ${v.make}` : ""}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" disabled={deleting === v.id} onClick={() => deleteVehicle(v.id)}>
                  {deleting === v.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
