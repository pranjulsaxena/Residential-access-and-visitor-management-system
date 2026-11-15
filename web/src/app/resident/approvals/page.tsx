"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { CheckCircle, XCircle, User, Clock, RefreshCw } from "lucide-react";

type Approval = {
  id: string;
  status: string;
  visit: {
    id: string;
    purpose: string;
    status: string;
    gate: { name: string };
    guard: { name: string };
    visitor: { name: string; phone?: string } | null;
    impersonationChecks: { result: string; similarityScore: number }[];
  };
};

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const { data: approvals = [], isLoading, refetch } = useQuery<Approval[]>({
    queryKey: ["pending-approvals"],
    queryFn: () => fetch("/api/visits/pending").then((r) => r.json()),
    refetchInterval: 3_000,
  });

  async function decide(visitId: string, action: "approve" | "reject") {
    setActing(visitId);
    try {
      await fetch(`/api/visits/${visitId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      setNote("");
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      refetch();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Visitor Approvals</h1>
          <p className="text-sm text-muted-foreground">Requests waiting for your decision</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className="size-3 animate-spin" /> Live
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      )}

      {!isLoading && approvals.length === 0 && (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground">
            <CheckCircle className="size-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending approvals. You're all caught up!</p>
          </CardContent>
        </Card>
      )}

      {approvals.map((approval) => {
        const v = approval.visit;
        const impCheck = v.impersonationChecks[0];
        return (
          <Card key={approval.id} className="border-yellow-200">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  {v.visitor?.name ?? "Unknown Visitor"}
                </CardTitle>
                <StatusBadge status="pending" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Visitor details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Phone</span>
                  <p>{v.visitor?.phone ?? "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Purpose</span>
                  <p>{v.purpose}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Gate</span>
                  <p>{v.gate.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Guard</span>
                  <p>{v.guard.name}</p>
                </div>
              </div>

              {/* Impersonation check result */}
              {impCheck && (
                <div className={`text-xs rounded p-2 ${impCheck.result === "pass" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  ID Check: {impCheck.result === "pass" ? "✓ Face matches ID" : "⚠ Face DOES NOT match ID"} 
                  {" "}({(impCheck.similarityScore * 100).toFixed(0)}% similarity)
                </div>
              )}

              {/* Note field */}
              <div className="space-y-1">
                <Label className="text-xs">Note (optional)</Label>
                <Input
                  placeholder="Add a note to your decision…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-7 text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={acting === v.id}
                  onClick={() => decide(v.id, "approve")}
                >
                  {acting === v.id ? <RefreshCw className="size-4 animate-spin" /> : <><CheckCircle className="size-4 mr-1" /> Approve</>}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={acting === v.id}
                  onClick={() => decide(v.id, "reject")}
                >
                  {acting === v.id ? <RefreshCw className="size-4 animate-spin" /> : <><XCircle className="size-4 mr-1" /> Reject</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
