import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonVariant, buttonVariants } from "@/components/ui/button";
import { texts } from "@/utils/shared/texts";
import React from "react";

export type ConfirmFunction = (() => Promise<void>) | (() => void);

type ConfirmDialogProps = {
  title: string;
  message: string;
  onConfirm: ConfirmFunction;
  confirmButtonVariant?: ButtonVariant;
  confirmText?: string;
  cancelText?: string;
  children: React.ReactNode;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  onConfirm,
  confirmButtonVariant = "default",
  confirmText = texts.confirm,
  cancelText = texts.cancel,
  children,
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: confirmButtonVariant })}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
