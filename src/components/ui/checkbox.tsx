import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "checked"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn("size-4 rounded border border-input accent-primary cursor-pointer", className)}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
