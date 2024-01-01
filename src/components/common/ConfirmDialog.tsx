import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { Button, Color, Subtitle } from "@tremor/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

type ConfirmDialogProps = {
  title: string;
  message: string;
  onConfirm: (() => Promise<void>) | (() => void);
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  confirmColor?: Color;
  confirmText?: string;
  cancelText?: string;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  onConfirm,
  isOpen,
  setIsOpen,
  confirmColor = Colors.Primary,
  confirmText = texts.confirm,
  cancelText = texts.cancel,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const onCancel = useCallback(() => setIsOpen(false), [setIsOpen]);

  const modalRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleClickOutside = useCallback(
    (event: Event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleEscape, handleClickOutside]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-black opacity-50 fixed inset-0"></div>
      <div
        ref={modalRef}
        className="bg-white fixed rounded left-6 right-6 p-6 w-[calc(100%-3rem)] sm:left-auto sm:right-auto sm:w-2/3 md:1/2 lg:w-[32rem] z-60 shadow-lg"
      >
        <Subtitle className="font-bold text-slate-500">{title}</Subtitle>
        <p className="text-sm mt-6">{message}</p>
        <div className="mt-6 flex justify-end gap-4">
          <Button onClick={onCancel} color={Colors.Secondary}>
            {cancelText}
          </Button>
          <Button
            onClick={async () => {
              setIsConfirming(true);
              await onConfirm();
              setIsOpen(false);
              setIsConfirming(false);
            }}
            color={confirmColor}
            loading={isConfirming}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
