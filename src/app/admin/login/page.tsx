"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { ShieldCheck } from "lucide-react";

const BACKGROUND_MASK = "radial-gradient(ellipse at center, transparent 20%, black 75%)";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Şifre hatalı.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="relative min-h-dvh flex items-center justify-center px-6 overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <AnimatedDotGrid
          className="h-full w-full"
          maxOpacity={0.35}
          interactive
          wave
          style={{ maskImage: BACKGROUND_MASK, WebkitMaskImage: BACKGROUND_MASK }}
        />
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm flex flex-col gap-5 border border-border rounded-2xl p-7 bg-card/90 shadow-xl"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">Admin Girişi</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Portföy yönetim paneli</p>
          </div>
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting} className="rounded-xl">
          {submitting ? "Giriş yapılıyor..." : "Giriş yap"}
        </Button>
      </form>
    </main>
  );
}
