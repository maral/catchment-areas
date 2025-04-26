import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown, StreetMarkdownState } from "@/entities/StreetMarkdown";
import { User } from "@/entities/User";
import { BackendMethod, remult } from "remult";

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
}
