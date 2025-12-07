"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface PreprocessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalText: string;
  onSubmit: (customText: string) => void;
  isProcessing: boolean;
}

export function PreprocessDialog({
  open,
  onOpenChange,
  originalText,
  onSubmit,
  isProcessing,
}: PreprocessDialogProps) {
  const [customText, setCustomText] = useState(originalText);

  const handleSubmit = () => {
    onSubmit(customText);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isProcessing) {
      onOpenChange(newOpen);
      if (newOpen) {
        // Reset to original text when opening
        setCustomText(originalText);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upravit text před zpracováním GPT</DialogTitle>
          <DialogDescription>
            Můžete upravit text vyhlášky před odesláním na zpracování pomocí ChatGPT.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Zadejte text vyhlášky..."
            className="h-full w-full resize-none"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !customText.trim()}
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            {isProcessing ? "Zpracovávám..." : "Zpracovat pomocí GPT"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}