"use client";

import { ICON_KEYS, ICON_REGISTRY, type IconKey } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";

export function IconSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: IconKey) => void;
  className?: string;
}) {
  const Icon = (ICON_REGISTRY as Record<string, (typeof ICON_REGISTRY)[IconKey]>)[value];
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IconKey)}
        className={cn(
          "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
      >
        {ICON_KEYS.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {Icon && <Icon className="size-5" />}
    </div>
  );
}
