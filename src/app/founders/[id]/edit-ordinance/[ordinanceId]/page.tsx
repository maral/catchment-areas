import { api } from "@/app/api/[...remult]/route";
import Editor from "@/components/editor/Editor";
import { StreetController } from "@/controllers/StreetController";
import { StreetMarkdownController } from "@/controllers/StreetMarkdownController";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { isPrefetch } from "@/utils/server/headers";
import { remult } from "remult";

export default async function EditorPage({
  params: { id, ordinanceId },
}: {
  params: { id: string; ordinanceId: string };
}) {
  const { ordinanceJson, streetMarkdownJson, suggestions } = await api.withRemult(
    async () => {
      const ordinanceRepo = remult.repo(Ordinance);
      const streetMarkdownRepo = remult.repo(StreetMarkdown);

      const ordinance = await ordinanceRepo.findId(Number(ordinanceId));

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
        streetMarkdownJson = smd ? streetMarkdownRepo.toJson(smd) : null;
      }

      return {
        ordinanceJson: ordinanceRepo.toJson(ordinance),
        streetMarkdownJson,
        suggestions: await StreetController.getAutocompleteSuggestions(Number(id)),
      };
    }
  );

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
