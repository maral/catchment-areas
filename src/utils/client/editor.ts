import { StreetMarkdownController } from "@/controllers/StreetMarkdownController";
import { Founder, FounderType } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { SchoolType } from "@/types/basicTypes";
import { TextToMapError } from "@/utils/shared/types";
import type { editor } from "monaco-editor";
import {
  Dispatch,
  SetStateAction
} from "react";
import { remult } from "remult";

const streetMarkdownRepo = remult.repo(StreetMarkdown);

export async function getPreprocessedText(
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

export async function getMarkersFromLines(
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
