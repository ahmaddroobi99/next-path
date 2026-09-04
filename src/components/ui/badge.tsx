import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-elevated text-muted",
        accent: "bg-accent/15 text-accent",
        in: "bg-path-in/15 text-path-in",
        out: "bg-path-out/15 text-path-out",
        ok: "bg-ok/15 text-ok",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
