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
import { City } from "@/entities/City";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params: { code, founderId, from, schoolType },
}: {
  params: {
    code: string;
    founderId: string;
    from?: string[];
    schoolType: string;
  };
}) {
  const ordinanceId = getOrdinanceIdFromFrom(from);

  const {
    ordinanceJson,
    founderJson,
    streetMarkdownJson,
    suggestions,
    founderCount,
  } = await api.withRemult(async () => {
    const city = await remult.repo(City).findFirst({ code: Number(code) });
    const founderCount = await remult.repo(Founder).count({ city });

    const ordinanceRepo = remult.repo(Ordinance);
    const streetMarkdownRepo = remult.repo(StreetMarkdown);

    const founder = await remult.repo(Founder).findId(Number(founderId));
    const ordinance = await ordinanceRepo.findId(Number(ordinanceId));
    if (!founder || !ordinance) {
      notFound();
    }

    const streetMarkdowns = await streetMarkdownRepo.find({
      where: { ordinance, founder },
      orderBy: { createdAt: "desc" },
      limit: 1,
    });

    // create new autosave smd if previous exists
    let streetMarkdownJson: any | null = null;
    if (streetMarkdowns.length > 0 && !isPrefetch()) {
      const smd = await StreetMarkdownController.insertAutoSaveStreetMarkdown(
        ordinance,
        founder,
        streetMarkdowns[0].sourceText
      );
      if (smd === null) {
        notFound();
      }
      streetMarkdownJson = streetMarkdownRepo.toJson(smd);
    }

    return {
      ordinanceJson: ordinanceRepo.toJson(ordinance),
      founderJson: remult.repo(Founder).toJson(founder),
      streetMarkdownJson,
      suggestions: await StreetController.getAutocompleteSuggestions(
        Number(founderId)
      ),
      founderCount,
    };
  });

  return (
    <div>
      <Editor
        suggestions={suggestions}
        ordinanceJson={ordinanceJson}
        founderJson={founderJson}
        streetMarkdownJson={streetMarkdownJson}
        founderCount={founderCount}
        schoolType={schoolType}
      />
    </div>
  );
}
