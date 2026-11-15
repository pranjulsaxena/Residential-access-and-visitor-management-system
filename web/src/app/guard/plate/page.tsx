"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Car, RefreshCw, CheckCircle, XCircle } from "lucide-react";

type PlateResult = {
  matched: boolean;
  plate_number: string | null;
  normalized?: string;
  confidence?: number;
  vehicle?: {
    id: string;
    vehicleNumber: string;
    type?: string;
    make?: string;
    owner: { name: string; flatNumber: string; building?: string };
  };
  message?: string;
};

export default function PlateScanPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlateResult | null>(null);
  const [error, setError] = useState("");

  async function handleScan(file: File) {
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("photo", file);

    try {
      const res = await fetch("/api/gate-ops/scan-plate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">License Plate Scanner</h1>
        <p className="text-sm text-muted-foreground">Photograph a vehicle plate to identify the resident</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="border-2 border-dashed rounded-lg aspect-video flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <Car className="size-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Tap to photograph plate</p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleScan(e.target.files[0]); }}
          />
          <Button onClick={() => fileRef.current?.click()} className="w-full" disabled={loading}>
            {loading ? <><RefreshCw className="size-4 mr-2 animate-spin" /> Scanning plate…</> : <><Camera className="size-4 mr-2" /> Photograph Plate</>}
          </Button>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <Card className={result.matched ? "border-green-300" : "border-orange-300"}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {result.matched ? <CheckCircle className="size-5 text-green-600" /> : <XCircle className="size-5 text-orange-600" />}
              <CardTitle className="text-base">
                {result.matched ? "Registered Vehicle" : "Unregistered Plate"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold tracking-widest">
                {result.normalized ?? result.plate_number ?? "—"}
              </span>
              {result.confidence != null && (
                <Badge variant="outline" className="text-xs">
                  {(result.confidence * 100).toFixed(0)}% conf.
                </Badge>
              )}
            </div>

            {result.vehicle && (
              <div className="bg-green-50 rounded-lg p-3 space-y-1 text-sm">
                <p className="font-medium">{result.vehicle.owner.name}</p>
                <p className="text-muted-foreground">
                  {result.vehicle.owner.building ? `${result.vehicle.owner.building}, ` : ""}
                  Flat {result.vehicle.owner.flatNumber}
                </p>
                {result.vehicle.make && (
                  <p className="text-muted-foreground capitalize">{result.vehicle.type} · {result.vehicle.make}</p>
                )}
              </div>
            )}

            {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}

            <Button variant="outline" size="sm" onClick={() => setResult(null)} className="w-full">
              Scan Another
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
