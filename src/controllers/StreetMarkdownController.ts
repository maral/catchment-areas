import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { BackendMethod, remult } from "remult";

export class StreetMarkdownController {
  @BackendMethod({ allowed: true })
  static async insertAutoSaveStreetMarkdown(
    ordinance: Ordinance,
    text: string
  ): Promise<StreetMarkdown | null> {
    const streetMarkdownRepo = remult.repo(StreetMarkdown);
    const userRepo = remult.repo(User);
    const ordinanceRepo = remult.repo(Ordinance);

    if (!remult.user) {
      return null;
    }

    await ordinanceRepo.update(ordinance.id, { ...ordinance, jsonData: null });

    return await streetMarkdownRepo.insert({
      sourceText: text,
      ordinance,
      state: StreetMarkdownState.AutoSave,
      user: await userRepo.findId(remult.user.id),
      comment: StreetMarkdown.getAutosaveComment(),
      createdAt: new Date(),
    });
  }
}
