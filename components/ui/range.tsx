import * as React from "react";
import { cn } from "@/lib/utils";

/** A native range input dressed in the velvet direction (shadcn-style primitive). */
function Range({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="range"
      className={cn(
        "h-3 w-full cursor-pointer appearance-auto rounded-xl bg-deep accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Range };
