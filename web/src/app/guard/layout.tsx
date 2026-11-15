import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { Home, Camera, Car, LogIn, LogOut, FileText } from "lucide-react";

const links = [
  { href: "/guard", label: "Dashboard", icon: Home },
  { href: "/guard/identify", label: "Identify", icon: Camera },
  { href: "/guard/visitor", label: "New Visitor", icon: FileText },
  { href: "/guard/plate", label: "Plate Scan", icon: Car },
  { href: "/guard/entry", label: "Log Entry", icon: LogIn },
  { href: "/guard/exit", label: "Log Exit", icon: LogOut },
];

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 border-r bg-muted/30 hidden md:flex flex-col py-4 gap-1 px-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </aside>
        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden border-t bg-background flex justify-around py-2 z-10">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground px-2"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
        <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
