import { api } from "@/app/api/[...remult]/api";
import Editor from "@/components/editor/Editor";
import { StreetController } from "@/controllers/StreetController";
import { StreetMarkdownController } from "@/controllers/StreetMarkdownController";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { getOrdinanceIdFromFrom } from "@/utils/breadcrumbItems";
import { isPrefetch } from "@/utils/server/headers";
import { notFound } from "next/navigation";
import { remult } from "remult";

export const dynamic = 'force-dynamic';

export default async function EditorPage({
  params: { id, from },
}: {
  params: { id: string; from?: string[] };
}) {
  const ordinanceId = getOrdinanceIdFromFrom(from);

  const { ordinanceJson, streetMarkdownJson, suggestions } =
    await api.withRemult(async () => {
      const ordinanceRepo = remult.repo(Ordinance);
      const streetMarkdownRepo = remult.repo(StreetMarkdown);
  
      const founder = remult.repo(Founder).findId(Number(id));
      const ordinance = await ordinanceRepo.findId(Number(ordinanceId));
      if (!founder || !ordinance) {
        notFound();
      }

      const streetMarkdowns = await streetMarkdownRepo.find({
        where: { ordinance },
        orderBy: { createdAt: "desc" },
        limit: 1,
      });

      // create new autosave smd if previous exists
      let streetMarkdownJson: any | null = null;
      if (streetMarkdowns.length > 0 && !isPrefetch()) {
        const smd = await StreetMarkdownController.insertAutoSaveStreetMarkdown(
          ordinance,
          streetMarkdowns[0].sourceText
        );
        if (smd === null) {
          notFound();
        }
        streetMarkdownJson = streetMarkdownRepo.toJson(smd);
      }

      return {
        ordinanceJson: ordinanceRepo.toJson(ordinance),
        streetMarkdownJson,
        suggestions: await StreetController.getAutocompleteSuggestions(
          Number(id)
        ),
      };
    });

  return (
    <div>
      <Editor
        suggestions={suggestions}
        ordinanceJson={ordinanceJson}
        streetMarkdownJson={streetMarkdownJson}
      />
    </div>
  );
}
