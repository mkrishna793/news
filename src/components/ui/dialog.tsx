"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export function DialogContent({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="dialog-overlay" />
      <D.Content className="dialog-content">
        <D.Title className="dialog-title">{title}</D.Title>
        <D.Description className="dialog-description">
          {description}
        </D.Description>
        {children}
        <D.Close className="dialog-close" aria-label="Close">
          <X size={18} />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
