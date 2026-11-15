"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default function GuardsPage() {
  const { data: guards = [], isLoading } = useQuery<any[]>({
    queryKey: ["guards"],
    queryFn: () => fetch("/api/guards").then((r) => r.json()),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Security Guards</h1>
        <p className="text-sm text-muted-foreground">{guards.length} active guards</p>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
          {guards.map((g: any) => (
            <div key={g.id} className="flex items-center gap-3 px-4 py-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Shield className="size-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{g.username}{g.phone ? ` · ${g.phone}` : ""}
                </p>
              </div>
              {g.assignedGate && (
                <Badge variant="outline" className="text-xs">{g.assignedGate.name}</Badge>
              )}
            </div>
          ))}
          {!isLoading && guards.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No guards registered.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
