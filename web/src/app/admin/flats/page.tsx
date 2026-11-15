"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function FlatsPage() {
  const { data: flats = [], isLoading } = useQuery<any[]>({
    queryKey: ["flats"],
    queryFn: () => fetch("/api/flats").then((r) => r.json()),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Flats</h1>
        <p className="text-sm text-muted-foreground">{flats.length} flats in the society</p>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
          {flats.map((flat: any) => (
            <div key={flat.id} className="flex items-center gap-3 px-4 py-3">
              <div className="rounded-full bg-muted p-2">
                <Building className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Flat {flat.flatNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {flat.building ?? "Main Block"}{flat.floor != null ? ` · Floor ${flat.floor}` : ""} · {flat.residents?.length ?? 0} resident(s)
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
