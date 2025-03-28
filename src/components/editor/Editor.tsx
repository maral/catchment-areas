"use client";

import { StreetMarkdownController } from "@/controllers/StreetMarkdownController";
import { Founder, FounderType } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { SuggestionList, TextToMapError } from "@/utils/shared/types";
import {
  ArrowDownTrayIcon,
  CloudArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
  MapIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import { Button, Icon } from "@tremor/react";
import debounce from "lodash/debounce";
import type { editor } from "monaco-editor";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { remult } from "remult";
import { MapDataController } from "../../controllers/MapDataController";
import LinkButton from "../buttons/LinkButton";
import HeaderBox from "../common/HeaderBox";
import Spinner from "../common/Spinner";
import { Monaco, configureMonaco } from "./configureMonaco";
import { SchoolType } from "@/entities/School";

const owner = "street-markdown";

const ordinanceRepo = remult.repo(Ordinance);
const streetMarkdownRepo = remult.repo(StreetMarkdown);

export default function Editor({
  suggestions,
  streetMarkdownJson,
  ordinanceJson,
  founderJson,
  founderCount,
  schoolType,
}: {
  suggestions: SuggestionList[];
  streetMarkdownJson: any | null;
  ordinanceJson: any;
  founderJson: any;
  founderCount: number;
  schoolType: SchoolType;
}) {
  const [streetMarkdown, setStreetMarkdown] = useState<StreetMarkdown | null>(
    streetMarkdownJson ? streetMarkdownRepo.fromJson(streetMarkdownJson) : null
  );
  const [showOriginal, setShowOriginal] = useState(true);
  const [markers, setMarkers] = useState<editor.IMarkerData[]>([]);
  const [preprocessedText, setPreprocessedText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const isValidating = useRef(false);
  const shouldValidate = useRef(false);

  const ordinance = useMemo(() => {
    return ordinanceRepo.fromJson(ordinanceJson);
  }, [ordinanceJson]);

  const founder = useMemo(() => {
    return remult.repo(Founder).fromJson(founderJson);
  }, [founderJson]);

  const monacoInstance = useMonaco();

  // debounced validation function
  // only one validation can be running at a time
  // if a later validation is prevented, it will be run again after the current one finishes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validate = useCallback(
    debounce(async (monacoInstance) => {
      if (!monacoInstance || !monacoInstance.editor.getModels()[0]) return;

      if (isValidating.current) {
        shouldValidate.current = true;
      } else {
        isValidating.current = true;
        const lines = monacoInstance.editor.getModels()[0].getLinesContent();
        setMarkers(await getMarkersFromLines(lines, founder.id, schoolType));
        isValidating.current = false;
        if (shouldValidate.current) {
          shouldValidate.current = false;
          setTimeout(() => validate(monacoInstance), 100);
        }
      }
    }, 1000),
    [ordinance]
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
          await MapDataController.deleteMapData(ordinance, founder.id);
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

      validate(monacoInstance);
    }
  }, [monacoInstance, validate, preprocessedText]);

  const preprocessText = useCallback(() => {
    setIsPreprocessing(true);
    getPreprocessedText(
      ordinance,
      founder,
      setPreprocessedText,
      setStreetMarkdown,
      setIsPreprocessing
    );
  }, [ordinance, founder]);

  // preprocess the original text if no text is provided
  useEffect(() => {
    if (!streetMarkdown && !isPreprocessing) {
      preprocessText();
    }
  }, [streetMarkdown, isPreprocessing, preprocessText]);

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
      <HeaderBox
        title={texts.editOrdinanceText}
        middleSlot={
          <div>
            {isSaving ? <LoadingIndicator text={texts.saving} /> : <Saved />}
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <LinkButton
            buttonProps={{
              color: Colors.Primary,
              icon: MapIcon,
            }}
            href={`${routes.cities}/${ordinance.city.code}${routes.map}/${
              founderCount > 1 ? `founder/${founder.id}/` : ""
            }${ordinance.id}`}
          >
            {texts.map}
          </LinkButton>
          <Button
            color={Colors.Secondary}
            onClick={() => setShowOriginal(!showOriginal)}
            icon={showOriginal ? EyeSlashIcon : EyeIcon}
          >
            {texts.originalText}
          </Button>
          <LinkButton
            buttonProps={{
              color: Colors.Secondary,
              variant: "secondary",
              icon: ArrowDownTrayIcon,
            }}
            prefetch={false}
            href={`/api/ordinances/download/by-id/${ordinance.id}`}
            target="_blank"
          >
            {texts.ordinanceDocument}
          </LinkButton>
          <Button
            color={Colors.Secondary}
            variant="secondary"
            onClick={() => preprocessText()}
            icon={SparklesIcon}
            disabled={isPreprocessing}
          >
            {texts.gpt}
          </Button>{" "}
        </div>
      </HeaderBox>

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
            beforeMount={(monaco: Monaco) => {
              configureMonaco(monaco, suggestions);
            }}
            value={streetMarkdown?.sourceText || ""}
            onChange={() => {
              validate(monacoInstance);
              autoSave();
            }}
            options={{ automaticLayout: true, wordWrap: "on" }}
            language="street-markdown"
          />
        </div>

        <div className={`${showOriginal ? "" : "hidden"}`}>
          <MonacoEditor
            theme="smd-theme"
            value={ordinance.originalText}
            options={{ readOnly: true, automaticLayout: true, wordWrap: "on" }}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingIndicator({ text }: { text: string }) {
  return (
    <div className="inline-block px-3 py-1 text-xs font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse">
      {text}
    </div>
  );
}

function Saved() {
  return (
    <div className="inline-block px-3 py-1 text-xs font-medium leading-none text-center text-slate-600 bg-slate-200 rounded-full">
      <Icon
        icon={CloudArrowDownIcon}
        size="xs"
        className="text-green-500 px-0 py-0 mr-1 relative top-[2px]"
      />
      {texts.saved}
    </div>
  );
}

async function getPreprocessedText(
  ordinance: Ordinance,
  founder: Founder,
  setPreprocessedText: Dispatch<SetStateAction<string | null>>,
  setStreetMarkdown: Dispatch<SetStateAction<StreetMarkdown | null>>,
  setIsPreprocessing: Dispatch<SetStateAction<boolean>>
) {
  if (founder.founderType === FounderType.City) {
    const response = await fetch("/api/text-to-map/preprocess-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ordinanceId: ordinance.id,
        founderId: founder.id,
      }),
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
      setIsPreprocessing(false);
      return;
    } else {
      console.error("Error while preprocessing text");
    }
  }
  setStreetMarkdown(
    await StreetMarkdownController.insertAutoSaveStreetMarkdown(
      ordinance,
      founder,
      ordinance.originalText
    )
  );

  setPreprocessedText(ordinance.originalText);
  setIsPreprocessing(false);
}

async function getMarkersFromLines(
  lines: string[],
  founderId: number,
  schoolType: SchoolType
): Promise<editor.IMarkerData[]> {
  const markers: editor.IMarkerData[] = [];
  const response = await fetch("/api/text-to-map/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lines, founderId, schoolType }),
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
