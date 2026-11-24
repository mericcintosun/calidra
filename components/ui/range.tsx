import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A native range input dressed in the velvet direction (shadcn-style primitive). The element is
 * 44 px tall (h-11) so the whole band around the thin native track takes a tap or a drag.
 */
function Range({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="range"
      className={cn(
        "h-11 w-full cursor-pointer appearance-auto rounded-xl bg-transparent accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Range };
