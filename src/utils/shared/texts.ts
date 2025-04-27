import { SchoolType } from "@/types/basicTypes";

export const texts = {
  actions: "Akce",
  active: "Aktivní",
  add: "Přidat",
  addUser: "Přidat uživatele",
  admin: "Administrátor",
  addOrdinanceManually: "Přidat vyhlášku ručně",
  addOrdinance: "Přidat vyhlášku",
  addOrdinanceFromCollection: "Přidat vyhlášku ze sbírky právních předpisů",
  addressPoints: "Adresní místa",
  allRegions: "Všechny kraje",
  author: "Autor",
  cancel: "Zrušit",
  cancelRejection: "Zrušit zamítnutí",
  catchmentAreas: "Spádové oblasti",
  city: "Město",
  comment: "Komentář",
  confirm: "Potvrdit",
  dataForDownload: "Data ke stažení",
  delete: "Smazat",
  deleteOrdinanceTitle: "Smazat vyhlášku",
  deleteOrdinanceMessage: "Opravdu chcete smazat vybranou vyhlášku?",
  deleteUserTitle: "Smazat uživatele",
  deleteUserMessage: "Opravdu chcete smazat uživatele?",
  downloadJson: "Stáhnout JSON",
  downloadOrdinanceDocument: "Stáhnout dokument vyhlášky",
  downloadSmd: "Stáhnout SMD",
  edit: "Upravit",
  editedAt: "Datum úpravy",
  editor: "Editor",
  editOrdinance: "Upravit vyhlášku",
  editOrdinanceText: "Upravit text vyhlášky",
  editUser: "Upravit uživatele",
  email: "E-mail",
  emailAlreadyExists: "Tento e-mail je již registrován.",
  embedMap: "Vložit mapu na web",
  expert: "Expert",
  expertsEntrance: "Vstup pro experty",
  featureUnderConstruction: "Přípravovaná funkce",
  fillOutEmail: "Vyplňte e-mail...",
  fillOutFullName: "Vyplňte jméno a příjmení...",
  fillValidEmail: "Vyplňte platný e-mail.",
  founderNotFound: "Zřizovatel nenalezen.",
  fullName: "Jméno a příjmení",
  gpt: "GPT",
  help: "Nápověda",
  logout: "Odhlásit se",
  map: "Mapa",
  mapForPublic: "Mapa pro veřejnost",
  microsoftAccountRequired:
    "Uživatel musí mít pod tímto e-mailem účet u Microsoftu (Office 365 apod.)",
  new: "nová",
  newOrdinances: "Nové vyhlášky",
  newOrdinancesAvailable: (count: number) =>
    `${count} ${
      count === 1
        ? "nová vyhláška"
        : count >= 2 && count <= 4
        ? "nové vyhlášky"
        : "nových vyhlášek"
    } ze Sbírky právních předpisů k dispozici. Co nejdříve je prosím přidejte.`,
  name: "Název",
  no: "Ne",
  noData: "Nebyla nalezena žádná data k zobrazení",
  noDataOrdinanceFromRegister:
    "Obec {{city}} nemá ve Sbírce právních předpisů nahranou žádnou vyhlášku.",
  notRegistered: "neregistrovaný",
  numberOfSchools: (schoolType: SchoolType) =>
    schoolType === SchoolType.Elementary
      ? "Počet zakladních škol"
      : "Počet mateřských škol",
  ordinanceDocument: "Dokument vyhlášky",
  ordinanceFile: "Soubor vyhlášky",
  ordinanceName: "Název vyhlášky",
  ordinanceNumber: "Číslo vyhlášky",
  ordinanceNumberExample: "např. 3/2025",
  ordinances: "Vyhlášky",
  originalText: "Původní text",
  polygons: "Oblasti",
  progress: "Přehled",
  region: "Kraj",
  reject: "Zamítnout",
  rejected: "Zamítnutá",
  reportBug: "Nahlásit chybu",
  requiredField: "Toto pole je povinné.",
  requiredFile: "Vyberte prosím soubor.",
  requiredOrdinanceNumber:
    "Vyplňte prosím číslo vyhlášky (ve formátu číslo/rok, např. 3/2019).",
  requiredValidToAfterValidFrom:
    "Datum konce platnosti musí být později než datum začátku platnosti.",
  role: "Role",
  save: "Uložit",
  saved: "Uloženo",
  saving: "Ukládání...",
  schoolEditorLabel: "škola",
  school: "Škola",
  schools: "Školy",
  schoolsDeclined: (schoolsCount: number, schoolType: SchoolType) => {
    const schoolForms = ["škola", "školy", "škol"];
    const elementaryForms = ["základní", "základní", "základních"];
    const kindergartenForms = ["mateřská", "mateřské", "mateřských"];

    const index = schoolsCount === 1 ? 0 : schoolsCount <= 4 ? 1 : 2;
    const typeForms =
      schoolType === SchoolType.Elementary
        ? elementaryForms
        : kindergartenForms;

    return `${typeForms[index]} ${schoolForms[index]}`;
  },
  schoolsElementary: "Základní školy",
  schoolsKindergarten: "Mateřské školy",
  selectDate: "Vyberte datum...",
  selectRole: "Vyberte roli",
  selectSchool: "Vyberte školu",
  setActive: "Nastavit jako Aktivní",
  setAsInProgress: 'Označit jako "Rozpracováno"',
  setAsPublished: 'Označit jako "Zveřejněno"',
  setAsNoExistingOrdinance: 'Označit jako "Vyhláška neexistuje"',
  setAsNoOrdinance: 'Označit jako "Bez vyhlášky"',
  statusInProgress: "Rozpracováno",
  statusNoExistingOrdinance: "Vyhláška neexistuje",
  statusNoOrdinance: "Bez vyhlášky",
  statusPublished: "Zveřejněno",
  streetEditorLabel: "ulice",
  status: "Stav",
  unknownStatus: "Neznámý stav",
  unmappedAddressPoints: "Neurčená adresní místa",
  unmappedRegistrationNumberAddressPoints: "Neurčená adresní místa s č.ev.",
  users: "Uživatelé",
  validFrom: "Platnost od",
  validity: "Platnost",
  validTo: "Platnost do",
  viewOnMap: "Zobrazit na mapě",
  yes: "Ano",

  URL_reportBug: "https://forms.gle/gRQGb77MvNnJfpA16",
};

export const replacePlaceholders = (
  text: string,
  placeholders: Record<string, string>
) => {
  let result = text;
  Object.keys(placeholders).forEach((key) => {
    result = result.replace(`{{${key}}}`, placeholders[key]);
  });
  return result;
};
