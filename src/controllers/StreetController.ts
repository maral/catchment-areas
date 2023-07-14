import { Founder } from "@/entities/Founder";
import { School } from "@/entities/School";
import { SchoolFounder } from "@/entities/SchoolFounder";
import { Street } from "@/entities/Street";
import { texts } from "@/utils/shared/texts";
import { SuggestionList } from "@/utils/shared/types";
import { BackendMethod, remult } from "remult";

export class StreetController {
  @BackendMethod({ allowed: true })
  static async getAutocompleteSuggestions(
    founderId: number
  ): Promise<SuggestionList[]> {
    const founder = await remult.repo(Founder).findId(founderId, {
      load: (f) => [f.city!],
    });
    const streets = await remult.repo(Street).find({
      where: { city: founder.city },
    });

    const schoolIzos = (
      await remult.repo(SchoolFounder).find({
        where: { founderId: founder.id },
      })
    ).map((sf) => sf.schoolIzo);

    const schools = await remult.repo(School).find({
      where: { izo: { $in: schoolIzos } },
    });

    const streetSuggestionList: SuggestionList = {
      texts: streets.map((s) => s.name),
      detail: texts.streetEditorLabel,
    };

    const schoolSuggestionList: SuggestionList = {
      texts: schools.map((s) => s.name),
      detail: texts.schoolEditorLabel,
    };

    return [streetSuggestionList, schoolSuggestionList];
  }
}
