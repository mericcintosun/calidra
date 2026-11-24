import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// D4 velvet: generous round corners, plum panels, lavender fill for the one primary action.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lift hover:bg-primary/85",
        secondary: "bg-deep text-foreground shadow-lift hover:bg-line",
        outline:
          "border border-line bg-surface text-foreground hover:bg-deep aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground",
        ghost: "text-foreground hover:bg-deep aria-pressed:bg-deep aria-pressed:ring-1 aria-pressed:ring-primary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/85",
        link: "text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary",
      },
      // Every size keeps at least a 44 px hit area (min-h-11) for gloved or sweaty thumbs.
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 rounded-xl px-3 text-xs",
        lg: "min-h-12 rounded-2xl px-7 text-base",
        icon: "min-h-11 min-w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
