"use client";

import React from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "success";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  const icons = {
    danger: <AlertCircle className="h-6 w-6 text-rose-600" />,
    primary: <HelpCircle className="h-6 w-6 text-brand-600" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  };

  const buttonVariants = {
    danger: "danger" as const,
    primary: "primary" as const,
    success: "success" as const,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className="mb-3 rounded-full bg-slate-100 p-3">
          {icons[variant]}
        </div>

        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 max-w-xs">{description}</p>

        <div className="mt-6 flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            className="flex-1"
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
