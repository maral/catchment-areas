import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { Allow, BackendMethod, remult } from "remult";

export type StreetMarkdownHistoryItem = {
  id: number;
  createdAt: string;
  author: string | null;
  state: StreetMarkdownState;
  comment: string;
};

// history is capped so that loading it doesn't fetch an unbounded amount of text
const HISTORY_LIMIT = 1000;

export class StreetMarkdownController {
  @BackendMethod({ allowed: true })
  static async insertAutoSaveStreetMarkdown(
    ordinance: Ordinance,
    founder: Founder,
    text: string
  ): Promise<StreetMarkdown | null> {
    const streetMarkdownRepo = remult.repo(StreetMarkdown);
    const userRepo = remult.repo(User);

    if (!remult.user) {
      return null;
    }

    return await streetMarkdownRepo.insert({
      sourceText: text,
      ordinance,
      founder,
      state: StreetMarkdownState.AutoSave,
      user: await userRepo.findId(remult.user.id),
      comment: StreetMarkdown.getAutosaveComment(),
      createdAt: new Date(),
    });
  }

  // Lists older saves of the street markdown (newest first), without the text itself.
  // Each editor visit stores a copy of the latest text, so consecutive saves with
  // identical text are collapsed into one - the oldest of them, which is the one
  // where the text was actually written.
  @BackendMethod({ allowed: Allow.authenticated })
  static async getHistory(
    ordinanceId: number,
    founderId: number,
    excludeId: number
  ): Promise<StreetMarkdownHistoryItem[]> {
    const ordinance = await remult.repo(Ordinance).findId(ordinanceId);
    const founder = await remult.repo(Founder).findId(founderId);
    if (!ordinance || !founder) {
      return [];
    }

    const streetMarkdowns = await remult.repo(StreetMarkdown).find({
      where: { ordinance, founder, id: { $ne: excludeId } },
      orderBy: { createdAt: "desc" },
      limit: HISTORY_LIMIT,
    });

    const history: StreetMarkdownHistoryItem[] = [];
    let previousText: string | null = null;
    for (const smd of streetMarkdowns) {
      const item: StreetMarkdownHistoryItem = {
        id: smd.id,
        createdAt: smd.createdAt.toISOString(),
        author: smd.user?.name || smd.user?.email || null,
        state: smd.state,
        comment: smd.comment,
      };
      if (smd.sourceText === previousText) {
        history[history.length - 1] = item;
      } else {
        history.push(item);
      }
      previousText = smd.sourceText;
    }
    return history;
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async getSourceText(id: number): Promise<string | null> {
    const smd = await remult.repo(StreetMarkdown).findId(id);
    return smd?.sourceText ?? null;
  }
}
