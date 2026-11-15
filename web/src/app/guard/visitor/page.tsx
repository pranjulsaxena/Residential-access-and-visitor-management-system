"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  Camera, CheckCircle, XCircle, Clock, RefreshCw, ScanLine
} from "lucide-react";

type Flat = { id: string; flatNumber: string; building?: string };

type VisitResult = {
  visit: { id: string; status: string };
  visitor: { name: string };
};

type PollStatus = {
  status: "pending" | "approved" | "rejected";
  latestApproval: { notes?: string } | null;
};

type IdResult = {
  id_type?: string;
  name?: string;
  id_number?: string;
  dob?: string;
  rawImageUrl?: string;
};

export default function NewVisitorPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<"form" | "scan-id" | "waiting" | "done">("form");

  // Form fields
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [flatId, setFlatId] = useState("");

  // ID scan
  const [idResult, setIdResult] = useState<IdResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Visit result + polling
  const [visitResult, setVisitResult] = useState<VisitResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: flats = [] } = useQuery<Flat[]>({
    queryKey: ["flats"],
    queryFn: () => fetch("/api/flats").then((r) => r.json()),
  });

  // Poll visit status every 3 seconds while waiting
  const { data: pollStatus } = useQuery<PollStatus>({
    queryKey: ["visit-status", visitResult?.visit.id],
    queryFn: () =>
      fetch(`/api/visits/${visitResult!.visit.id}/status`).then((r) => r.json()),
    enabled: step === "waiting" && !!visitResult?.visit.id,
    refetchInterval: 3000,
  });

  // Auto-advance when approved/rejected
  if (step === "waiting" && pollStatus && pollStatus.status !== "pending") {
    setStep("done");
  }

  // ID scan via file upload
  const handleIdScan = useCallback(async (file: File) => {
    setScanLoading(true);
    const form = new FormData();
    form.append("photo", file);
    try {
      const res = await fetch("/api/gate-ops/scan-id", { method: "POST", body: form });
      const data = await res.json();
      setIdResult(data);
      if (data.name && !visitorName) setVisitorName(data.name);
    } catch {
      /* silently fail – guard can fill manually */
    } finally {
      setScanLoading(false);
    }
  }, [visitorName]);

  async function createVisit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!flatId) { setFormError("Please select a flat."); return; }
    setCreating(true);

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatId,
          gateId: session?.user.gateId ?? "",
          guardId: session?.user.id ?? "",
          visitorName,
          visitorPhone,
          purpose,
          visitType: "visitor",
          visitorIdType: idResult?.id_type,
          visitorIdNumber: idResult?.id_number,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create visit");
      setVisitResult(data);
      setStep("waiting");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  // ---- Render ----

  if (step === "waiting") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-yellow-600 animate-pulse" />
              Waiting for Resident Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Notification sent to the resident of the selected flat.
              Please ask the visitor to wait.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={pollStatus?.status ?? "pending"} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="size-3 animate-spin" />
              Checking every 3 seconds…
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done" && pollStatus) {
    const approved = pollStatus.status === "approved";
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Card className={approved ? "border-green-300" : "border-red-300"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {approved ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <XCircle className="size-5 text-red-600" />
              )}
              {approved ? "Entry Approved" : "Entry Rejected"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <strong>{visitResult?.visitor.name}</strong> has been{" "}
              {approved ? "approved to enter" : "denied entry"}.
            </p>
            {pollStatus.latestApproval?.notes && (
              <p className="text-sm text-muted-foreground">
                Note: {pollStatus.latestApproval.notes}
              </p>
            )}
            <Button
              onClick={() => {
                setStep("form");
                setVisitorName(""); setVisitorPhone(""); setPurpose("");
                setFlatId(""); setIdResult(null); setVisitResult(null);
              }}
              className="w-full"
            >
              New Visitor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">New Visitor</h1>
        <p className="text-sm text-muted-foreground">Register an unknown visitor and request resident approval</p>
      </div>

      {/* ID Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScanLine className="size-4" /> Scan ID Document (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleIdScan(e.target.files[0]); }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={scanLoading}
            className="w-full"
          >
            {scanLoading ? <><RefreshCw className="size-3 mr-2 animate-spin" /> Scanning…</> : <><Camera className="size-3 mr-2" /> Photograph ID</>}
          </Button>
          {idResult && (
            <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
              <p><span className="text-muted-foreground">Type:</span> {idResult.id_type ?? "—"}</p>
              <p><span className="text-muted-foreground">Name:</span> {idResult.name ?? "—"}</p>
              <p><span className="text-muted-foreground">Number:</span> {idResult.id_number ?? "—"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visitor Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Visitor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createVisit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="vname">Full Name *</Label>
              <Input id="vname" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vphone">Phone</Label>
              <Input id="vphone" type="tel" value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="purpose">Purpose *</Label>
              <Input id="purpose" placeholder="e.g. Delivery, Visit, Service" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="flat">Visiting Flat *</Label>
              <select
                id="flat"
                className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={flatId}
                onChange={(e) => setFlatId(e.target.value)}
                required
              >
                <option value="">Select flat…</option>
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.building ? `${f.building} - ` : ""}Flat {f.flatNumber}
                  </option>
                ))}
              </select>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? <><RefreshCw className="size-4 mr-2 animate-spin" /> Creating…</> : "Send Approval Request →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
