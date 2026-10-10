"use client";

import {
  StreetMarkdownController,
  StreetMarkdownHistoryItem,
} from "@/controllers/StreetMarkdownController";
import { StreetMarkdownState } from "@/entities/StreetMarkdown";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { DiffEditor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import Spinner from "../common/Spinner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordinanceId: number;
  founderId: number;
  currentStreetMarkdownId: number | null;
  getCurrentText: () => string;
  onRestore: (text: string) => Promise<void>;
}

export function HistoryDialog({
  open,
  onOpenChange,
  ordinanceId,
  founderId,
  currentStreetMarkdownId,
  getCurrentText,
  onRestore,
}: HistoryDialogProps) {
  const [history, setHistory] = useState<StreetMarkdownHistoryItem[] | null>(
    null
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  // reload the history and the current text every time the dialog is opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setHistory(null);
    setSelectedId(null);
    setSelectedText(null);
    setCurrentText(getCurrentText());
    StreetMarkdownController.getHistory(
      ordinanceId,
      founderId,
      currentStreetMarkdownId ?? 0
    ).then((history) => {
      if (!cancelled) setHistory(history);
    });
    return () => {
      cancelled = true;
    };
  }, [open, ordinanceId, founderId, currentStreetMarkdownId, getCurrentText]);

  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    setSelectedText(null);
    StreetMarkdownController.getSourceText(selectedId).then((text) => {
      if (!cancelled) setSelectedText(text ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleRestore = async () => {
    if (selectedText === null) return;
    setIsRestoring(true);
    try {
      await onRestore(selectedText);
      onOpenChange(false);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isRestoring) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historie změn</DialogTitle>
          <DialogDescription>
            Vyberte starší uložení. Vlevo je aktuální text, vpravo vybrané
            uložení.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-[16rem_1fr] gap-4">
          <div className="overflow-y-auto border rounded-md">
            {history === null ? (
              <Spinner text="Načítám historii..." />
            ) : history.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">
                Žádná starší uložení.
              </p>
            ) : (
              <ul>
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left px-3 py-2 border-b text-sm hover:bg-slate-100 ${
                        item.id === selectedId ? "bg-slate-200" : ""
                      }`}
                    >
                      <div className="font-medium">
                        {new Date(item.createdAt).toLocaleString("cs-CZ")}
                      </div>
                      {item.author && (
                        <div className="text-slate-600">{item.author}</div>
                      )}
                      {item.state !== StreetMarkdownState.AutoSave &&
                        item.comment && (
                          <div className="text-xs text-slate-500">
                            {item.comment}
                          </div>
                        )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="min-h-0 border rounded-md overflow-hidden">
            {selectedId === null ? (
              <p className="p-3 text-sm text-slate-500">
                Vyberte uložení ze seznamu.
              </p>
            ) : selectedText === null ? (
              <Spinner text="Načítám..." />
            ) : selectedText === currentText ? (
              <p className="p-3 text-sm text-slate-500">
                Toto uložení je shodné s aktuálním textem.
              </p>
            ) : (
              <DiffEditor
                theme="smd-theme"
                language="street-markdown"
                original={currentText}
                modified={selectedText}
                options={{
                  readOnly: true,
                  originalEditable: false,
                  automaticLayout: true,
                  wordWrap: "on",
                }}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isRestoring}
          >
            Zavřít
          </Button>
          <Button
            onClick={handleRestore}
            disabled={
              isRestoring ||
              selectedText === null ||
              selectedText === currentText
            }
          >
            <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
            {isRestoring ? "Obnovuji..." : "Použít toto uložení"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
