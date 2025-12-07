"use client";

import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { SchoolType } from "@/types/basicTypes";
import {
  getMarkersFromLines,
  getPreprocessedText,
} from "@/utils/client/editor";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { SuggestionList } from "@/utils/shared/types";
import {
  ArrowDownTrayIcon,
  CloudArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
  MapIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import debounce from "lodash/debounce";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { remult } from "remult";
import { MapDataController } from "../../controllers/MapDataController";
import { getRootPathBySchoolType } from "../../entities/School";
import LinkButton from "../buttons/LinkButton";
import HeaderBox from "../common/HeaderBox";
import Spinner from "../common/Spinner";
import { Button } from "../ui/button";
import { Monaco, configureMonaco } from "./configureMonaco";
import { PreprocessDialog } from "./PreprocessDialog";

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
  const [showPreprocessDialog, setShowPreprocessDialog] = useState(false);
  const isValidating = useRef(false);
  const shouldValidate = useRef(false);
  const isMountedRef = useRef(true);

  const ordinance = useMemo(() => {
    return ordinanceRepo.fromJson(ordinanceJson);
  }, [ordinanceJson]);

  const founder = useMemo(() => {
    return remult.repo(Founder).fromJson(founderJson);
  }, [founderJson]);

  const preprocessProps = useMemo(
    () => ({
      ordinance,
      founder,
      setPreprocessedText,
      setStreetMarkdown,
      setIsPreprocessing,
    }),
    [ordinance, founder]
  );

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
        const markers = await getMarkersFromLines(lines, founder.id, schoolType);
        if (isMountedRef.current) {
          setMarkers(markers);
        }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // run initial validation / set content after preprocess
  useEffect(() => {
    if (monacoInstance) {
      if (preprocessedText) {
        monacoInstance.editor.getModels()[0].setValue(preprocessedText);
      }

      validate(monacoInstance);
    }
  }, [monacoInstance, validate, preprocessedText]);

  const preprocessText = useCallback((customText?: string) => {
    setIsPreprocessing(true);
    getPreprocessedText({ ...preprocessProps, customText });
  }, [preprocessProps]);

  const handlePreprocessDialogSubmit = useCallback((customText: string) => {
    setShowPreprocessDialog(false);
    preprocessText(customText);
  }, [preprocessText]);

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
            href={`${getRootPathBySchoolType(schoolType)}/${
              ordinance.city.code
            }${routes.map}/${founderCount > 1 ? `founder/${founder.id}/` : ""}${
              ordinance.id
            }`}
          >
            <MapIcon />
            {texts.map}
          </LinkButton>
          <Button
            variant="secondary"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? <EyeSlashIcon /> : <EyeIcon />}
            {texts.originalText}
          </Button>
          <LinkButton
            buttonProps={{
              variant: "secondary",
            }}
            prefetch={false}
            href={`/api/ordinances/download/by-id/${ordinance.id}`}
            target="_blank"
          >
            <ArrowDownTrayIcon />
            {texts.ordinanceDocument}
          </LinkButton>
          <Button
            variant="secondary"
            onClick={() => setShowPreprocessDialog(true)}
            disabled={isPreprocessing}
          >
            <SparklesIcon />
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
      
      <PreprocessDialog
        open={showPreprocessDialog}
        onOpenChange={setShowPreprocessDialog}
        originalText={ordinance.originalText}
        onSubmit={handlePreprocessDialogSubmit}
        isProcessing={isPreprocessing}
      />
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
    <div className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-200 rounded-full">
      <CloudArrowDownIcon className="w-4 text-green-500" />
      {texts.saved}
    </div>
  );
}
