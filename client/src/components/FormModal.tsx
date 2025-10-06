import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  cancelLabel?: string;
  isLoading?: boolean;
  isSubmitting?: boolean;
  children: ReactNode;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  submitLabel = "Submit",
  submitDisabled = false,
  isLoading = false,
  isSubmitting = false,
  cancelLabel = "Cancel",
  children,
}: FormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] gap-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-base">{description}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-6">
            {children}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-modal"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled || isLoading || isSubmitting}
              data-testid="button-submit-modal"
            >
              {isLoading || isSubmitting ? "Processing..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}