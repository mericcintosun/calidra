import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Status chips use solid semantic fills with ground-colored text. Gold is a tiny detail only.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-xl border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-line bg-deep text-foreground",
        outline: "border-line text-muted-foreground",
        ok: "border-transparent bg-ok text-background",
        warn: "border-transparent bg-warn text-background",
        bad: "border-transparent bg-bad text-background",
        gold: "border-gold text-gold",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
