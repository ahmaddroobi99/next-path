import type { ComponentProps, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof Dialog.Content> & { title?: string; children?: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-[var(--shadow-border)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Dialog.Title className="text-sm font-medium tracking-wide">{title}</Dialog.Title>
          <Dialog.Close className="grid size-10 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg">
            <X className="size-4" />
          </Dialog.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
