"use client";
import { StreetMarkdownController } from "@/controllers/StreetMarkdownController";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { Colors } from "@/styles/Themes";
import { SuggestionList, TextToMapError } from "@/utils/shared/types";
import {
  ArrowDownOnSquareIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import { Button } from "@tremor/react";
import debounce from "lodash/debounce";
import type { editor } from "monaco-editor";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { remult } from "remult";
import LinkBtn from "../buttons/LinkBtn";
import Spinner from "../common/Spinner";
import { Monaco, configureMonaco } from "./configureMonaco";

const owner = "street-markdown";

const ordinanceRepo = remult.repo(Ordinance);
const streetMarkdownRepo = remult.repo(StreetMarkdown);

export default function Editor({
  suggestions,
  streetMarkdownJson,
  ordinanceJson,
}: {
  suggestions: SuggestionList[];
  streetMarkdownJson: any | null;
  ordinanceJson: any;
}) {
  const [streetMarkdown, setStreetMarkdown] = useState<StreetMarkdown | null>(
    streetMarkdownJson ? streetMarkdownRepo.fromJson(streetMarkdownJson) : null
  );
  const [showOriginal, setShowOriginal] = useState(true);
  const [markers, setMarkers] = useState<editor.IMarkerData[]>([]);
  const [preprocessedText, setPreprocessedText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreprocessing, setIsPreprocessing] = useState(false);

  const ordinance = useMemo(() => {
    return ordinanceRepo.fromJson(ordinanceJson);
  }, [ordinanceJson]);

  const monacoInstance = useMonaco();

  // debounced validation function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validate = useCallback(
    debounce(async () => {
      if (monacoInstance) {
        const lines = monacoInstance.editor.getModels()[0].getLinesContent();
        setMarkers(await getMarkersFromLines(lines, ordinance.founder.id));
      }
    }, 1000),
    [monacoInstance, ordinance]
  );

  // debounced autosave function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSave = useCallback(
    debounce(async () => {
      if (monacoInstance && streetMarkdown) {
        setIsSaving(true);
        const text = monacoInstance.editor.getModels()[0].getValue();
        const saveToSmd = async () => {
          streetMarkdown.sourceText = text;
          streetMarkdown.createdAt = new Date();
          streetMarkdown.comment = StreetMarkdown.getAutosaveComment();
          await streetMarkdownRepo.update(streetMarkdown.id, {
            ...streetMarkdown,
          });
          setIsSaving(false);
        };
        saveToSmd();
      }
    }, 1000),
    [monacoInstance, streetMarkdown]
  );

  // run initial validation / set content after preprocess
  useEffect(() => {
    if (monacoInstance) {
      if (preprocessedText) {
        monacoInstance.editor.getModels()[0].setValue(preprocessedText);
      }

      validate();
    }
  }, [monacoInstance, validate, preprocessedText]);

  // preprocess the original text if no text is provided
  useEffect(() => {
    if (!streetMarkdown && !isPreprocessing) {
      setIsPreprocessing(true);
      getPreprocessedText(
        ordinance,
        setPreprocessedText,
        setStreetMarkdown,
        setIsPreprocessing
      );
    }
  }, [ordinance, streetMarkdown, isPreprocessing]);

  // update markers
  useEffect(() => {
    if (monacoInstance) {
      monacoInstance.editor.setModelMarkers(
        monacoInstance.editor.getModels()[0],
        owner,
        markers
      );
    }
  }, [monacoInstance, markers]);

  return (
    <div className="overflow-hidden">
      <div className="relative flex justify-center items-center pb-4 mb-4 border-b h-16">
        <div className="absolute left-0 flex items-center gap-2">
          <Button
            color="indigo"
            onClick={() => setShowOriginal(!showOriginal)}
            icon={ArrowDownOnSquareIcon}
          >
            Uložit
          </Button>
          <LinkBtn
            buttonProps={{
              color: Colors.Primary,
              variant: "secondary",
              icon: MapIcon,
            }}
            href={`/founders/${ordinance.founder.id}/map/${ordinance.id}`}
          >
            Mapa
          </LinkBtn>
          {isSaving && <LoadingIndicator text={"Ukládám..."} />}
        </div>
        <div className="text-slate-400 text-sm hidden lg:block">Verze 10</div>
        <div className="absolute right-0">
          <LinkBtn
            buttonProps={{
              color: Colors.Secondary,
              variant: "secondary",
              icon: ArrowDownTrayIcon,
            }}
            prefetch={false}
            href={ordinance.documentUrl}
            target="_blank"
          >
            Dokument vyhlášky
          </LinkBtn>{" "}
          <Button
            color={Colors.Secondary}
            variant="secondary"
            onClick={() => setShowOriginal(!showOriginal)}
            icon={showOriginal ? EyeSlashIcon : EyeIcon}
          >
            Původní text
          </Button>
        </div>
      </div>

      <div
        className={`h-[calc(100vh-12rem)] grid ${
          showOriginal ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div className="relative">
          {isPreprocessing && (
            <>
              <div className="z-10 absolute top-0 left-0 right-0 bottom-0 bg-white opacity-50"></div>
              <Spinner text="Vyhlášku teď předzpracováváme pomocí ChatGPT, může to trvat vyšší desítky sekund..." />
            </>
          )}
          <MonacoEditor
            theme="smd-theme"
            beforeMount={(monaco: Monaco) => configureMonaco(monaco, suggestions)}
            value={streetMarkdown?.sourceText || ""}
            onChange={() => {
              validate();
              autoSave();
            }}
            options={{ automaticLayout: true }}
            language="street-markdown"
          />
        </div>

        <div className={`${showOriginal ? "" : "hidden"}`}>
          <MonacoEditor
            theme="smd-theme"
            value={ordinance.originalText}
            options={{ readOnly: true, automaticLayout: true }}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingIndicator({ text }: { text: string }) {
  return (
    <div className="inline-block px-3 py-1 text-xs font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse dark:bg-blue-900 dark:text-blue-200">
      {text}
    </div>
  );
}

async function getPreprocessedText(
  ordinance: Ordinance,
  setPreprocessedText: Dispatch<SetStateAction<string | null>>,
  setStreetMarkdown: Dispatch<SetStateAction<StreetMarkdown | null>>,
  setIsPreprocessing: Dispatch<SetStateAction<boolean>>
) {
  const response = await fetch("/api/text-to-map/preprocess-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ordinanceId: ordinance.id }),
  });

  if (response.ok) {
    const json = (await response.json()) as {
      processedText: string;
      autosaveStreetMarkdownId: number;
    };

    setPreprocessedText(json.processedText);
    setStreetMarkdown(
      await streetMarkdownRepo.findId(json.autosaveStreetMarkdownId)
    );
  } else {
    console.error("Error while preprocessing text");

    setStreetMarkdown(
      await StreetMarkdownController.insertAutoSaveStreetMarkdown(
        ordinance,
        ordinance.originalText
      )
    );

    setPreprocessedText(ordinance.originalText);
  }
  setIsPreprocessing(false);
}

async function getMarkersFromLines(
  lines: string[],
  founderId: number
): Promise<editor.IMarkerData[]> {
  const markers: editor.IMarkerData[] = [];
  const response = await fetch("/api/text-to-map/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lines, founderId }),
  });
  const { errors, warnings } = (await response.json()) as {
    errors: TextToMapError[];
    warnings: TextToMapError[];
  };

  errors.forEach((error) => {
    markers.push(
      createMarker(
        8, //MarkerSeverity.Error,
        error.message,
        error.lineNumber,
        error.line,
        error.startOffset,
        error.endOffset
      )
    );
  });

  warnings.forEach((warning) => {
    markers.push(
      createMarker(
        4, //MarkerSeverity.Warning,
        warning.message,
        warning.lineNumber,
        warning.line,
        warning.startOffset,
        warning.endOffset
      )
    );
  });
  return markers;
}

function createMarker(
  severity: number, //MarkerSeverity,
  message: string,
  lineNumber: number,
  line: string,
  startOffset: number,
  endOffset: number
): editor.IMarkerData {
  return {
    severity,
    message,
    startLineNumber: lineNumber,
    startColumn: startOffset + 1,
    endLineNumber: lineNumber,
    endColumn: endOffset + 1,
  };
}
