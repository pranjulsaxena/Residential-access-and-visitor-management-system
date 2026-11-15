import { Badge } from "@/components/ui/badge";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "exited"
  | "active"
  | "inactive"
  | string;

const map: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
  exited: { label: "Exited", className: "bg-gray-100 text-gray-700" },
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-700" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = map[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
