"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User, Search } from "lucide-react";

export default function ResidentsPage() {
  const [search, setSearch] = useState("");

  const { data: residents = [], isLoading } = useQuery<any[]>({
    queryKey: ["residents"],
    queryFn: () => fetch("/api/residents").then((r) => r.json()),
  });

  const filtered = residents.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.flat?.flatNumber?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Residents</h1>
        <p className="text-sm text-muted-foreground">{residents.length} registered residents</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search by name or flat…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
          {filtered.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="rounded-full bg-muted p-2">
                <User className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.isPrimary && <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50">Primary</Badge>}
                  {r.role === "secretary" && <Badge variant="outline" className="text-xs text-purple-600 bg-purple-50">Secretary</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Flat {r.flat?.flatNumber} · {r.phone}</p>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {r.faceProfiles?.length ?? 0} face(s)
              </div>
            </div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No residents found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
