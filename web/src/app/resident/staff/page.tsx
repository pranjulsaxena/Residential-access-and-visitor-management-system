"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, RefreshCw } from "lucide-react";

export default function StaffPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("maid");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: staff = [] } = useQuery<any[]>({
    queryKey: ["my-staff", session?.user.id],
    queryFn: () => fetch(`/api/staff?registeredById=${session?.user.id}`).then((r) => r.json()),
    enabled: !!session?.user.id,
  });

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registeredById: session?.user.id, name, role, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      qc.invalidateQueries({ queryKey: ["my-staff"] });
      setName(""); setPhone(""); setAdding(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function removeStaff(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/staff/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["my-staff"] });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Domestic Staff</h1>
          <p className="text-sm text-muted-foreground">Manage who can enter your flat</p>
        </div>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="size-4 mr-1" /> Add
        </Button>
      </div>

      {adding && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Register Staff Member</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addStaff} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="sname">Full Name *</Label>
                <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Role</Label>
                  <select className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="maid">Maid</option>
                    <option value="driver">Driver</option>
                    <option value="cook">Cook</option>
                    <option value="nurse">Nurse</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sphone">Phone</Label>
                  <Input id="sphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading} className="flex-1">
                  {loading ? <RefreshCw className="size-4 animate-spin" /> : "Register Staff"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 divide-y">
          {staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No staff registered yet.</p>
            </div>
          ) : (
            staff.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.role}{s.phone ? ` · ${s.phone}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon-sm" disabled={deleting === s.id} onClick={() => removeStaff(s.id)}>
                  {deleting === s.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
