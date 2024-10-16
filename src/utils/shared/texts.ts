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
  approvedAt: "Datum schválení",
  author: "Autor",
  cancel: "Zrušit",
  catchmentAreas: "Spádové oblasti",
  city: "Město",
  cities: "Města",
  comment: "Komentář",
  confirm: "Potvrdit",
  counties: "Okresy",
  county: "Okres",
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
  editHistory: "Historie úprav",
  editor: "Editor",
  editOrdinance: "Upravit vyhlášku",
  editOrdinanceText: "Upravit text vyhlášky",
  editUser: "Upravit uživatele",
  email: "E-mail",
  emailAlreadyExists: "Tento e-mail je již registrován.",
  emailVerified: "E-mail ověřen",
  embedMap: "Vložit mapu na web",
  expert: "Expert",
  expertsEntrance: "Vstup pro experty",
  featureUnderConstruction: "Přípravovaná funkce",
  fillOutEmail: "Vyplňte e-mail...",
  fillOutFullName: "Vyplňte jméno a příjmení...",
  fillOutName: "Vyplňte název...",
  fillValidEmail: "Vyplňte platný e-mail.",
  founderNotFound: "Zřizovatel nenalezen.",
  fullName: "Jméno a příjmení",
  gpt: "GPT",
  help: "Nápověda",
  ico: "IČO",
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
  numberOfSchools: "Počet škol",
  ordinanceDocument: "Dokument vyhlášky",
  ordinanceFile: "Soubor vyhlášky",
  ordinanceName: "Název vyhlášky",
  ordinanceNumber: "Číslo vyhlášky",
  ordinances: "Vyhlášky",
  ordinanceUploaded: "Vyhláška nahrána",
  originalText: "Původní text",
  orp: "ORP",
  polygons: "Oblasti",
  publishedAt: "Datum zveřejnění",
  region: "Kraj",
  regions: "Kraje",
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
  schoolsDeclined: (schoolsCount: number) =>
    schoolsCount === 1
      ? "škola"
      : 2 <= schoolsCount && schoolsCount <= 4
      ? "školy"
      : "škol",
  selectDate: "Vyberte datum...",
  setAsInProgress: 'Označit jako "Rozpracováno"',
  setAsPublished: 'Označit jako "Zveřejněno"',
  shortName: "Zkratka",
  statusInProgress: "Rozpracováno",
  statusNoActiveOrdinance: "Bez platné vyhlášky",
  statusNoOrdinance: "Bez vyhlášky",
  statusPublished: "Zveřejněno",
  streetEditorLabel: "ulice",
  status: "Stav",
  unverified: "Neověřený",
  url: "URL",
  unknownStatus: "Neznámý stav",
  unmappedAddressPoints: "Neurčená adresní místa",
  unmappedRegistrationNumberAddressPoints: "Neurčená adresní místa s č.ev.",
  user: "Uživatel",
  userName: "Jméno",
  users: "Uživatelé",
  valid: "Platná",
  validFrom: "Platnost od",
  validity: "Platnost",
  validTo: "Platnost do",
  version: "Verze",
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
