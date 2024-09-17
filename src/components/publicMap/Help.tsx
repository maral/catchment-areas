import { Dialog, Transition } from "@headlessui/react";
import { QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@tremor/react";
import { Fragment } from "react";
import PublicButton from "../buttons/PublicButton";
import Image from "next/image";

type HelpProps = {
  closeModal: () => void;
  isOpen: boolean;
};

export default function Help({ isOpen, closeModal }: HelpProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[2000] w-full"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full md:w-[736px] transform overflow-hidden rounded-2xl bg-white p-8 text-left text-slate-700 align-middle shadow-xl transition-all">
                <button
                  className="absolute right-6 top-6 transition-all hover:scale-110 md:right-6 md:top-6"
                  onClick={closeModal}
                >
                  <Icon icon={XMarkIcon} color="sky" size="lg" />
                </button>
                <Dialog.Title
                  as="h2"
                  className="text-3xl font-medium leading-8 mb-12 pr-8"
                >
                  Návod k používání aplikace Mapa spádovosti
                </Dialog.Title>

                <H3>Pro koho je mapa spádových oblastí škol určena?</H3>
                <P>
                  <Ul>
                    <li>
                      <strong>Rodičům</strong> - pro zjištění spádové školy
                      jejich dětí.
                    </li>
                    <li>
                      <strong>Ředitelům</strong> - pro snadnou komunikaci o
                      spádových školách pomocí vizualizace.
                    </li>
                    <li>
                      <strong>Zřizovatelům</strong> - pro kontrolu a správu
                      modelu spádovosti.
                    </li>
                    <li>
                      <strong>Expertům na vzdělávání</strong> - pro nastavení
                      vhodné vzdělávací politiky, jako je přespádování nebo
                      stavba nových škol.
                    </li>
                  </Ul>
                </P>

                <H3>Jak mapa funguje?</H3>
                <P>
                  Mapa zobrazuje přehled spádových oblastí pro největších 300
                  obcí a&nbsp;měst v&nbsp;České republice, které zřizují dvě
                  a&nbsp;více základních škol a&nbsp;jsou povinny určit jejich
                  spádovost. V další fázi budou přidány spádové oblasti
                  mateřských škol.
                </P>

                <H3>Orientace v mapě</H3>
                <P>Každá spádová oblast je barevně odlišena:</P>
                <P>
                  <Image
                    src={"/green_triangle.svg"}
                    alt="zelený trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  <strong>Zelený trojúhelník</strong> - města a obce s již
                  zpracovanou vyhláškou.
                </P>
                <P>
                  <Image
                    src={"/grey_triangle.svg"}
                    alt="zelený trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  <strong>Šedý trojúhelník</strong> - města a obce čekající na
                  zpracování.
                </P>

                <H3>Vyhledávání spádové oblasti prostřednictvím adresy</H3>

                <Ul>
                  <li>
                    <strong>Zadání adresy</strong> - Do pole &quot;Vyhledat
                    adresu&quot; zadejte ulici a číslo popisné vašeho bydliště.
                  </li>
                  <li>
                    <strong>Výběr z nabídky</strong> - Vyberte konkrétní adresu
                    z nabídky, která se objeví po zadání města.
                  </li>
                </Ul>

                <H3>Zobrazení spádové oblasti</H3>
                <Ul>
                  <li>
                    <strong>Přiblížení</strong> - Při přiblížení uvidíte barevné
                    oblasti a body označující školy.
                  </li>
                  <li>
                    <strong>Detailní zobrazení</strong> - Dalším přiblížením se
                    zobrazí menší body označující jednotlivá bydliště. Shodná
                    barva označuje příslušnou spádovou oblast, školu a bydliště.
                    Kliknutím na konkrétní bod bydliště se zobrazí příslušná
                    spádová škola.
                  </li>
                  <li>
                    <strong>Zobrazení konkrétní školy</strong> - Kliknutím na
                    bod školy se zvýrazní její spádová oblast a ostatní oblasti
                    se skryjí (odbarví se).
                  </li>
                </Ul>

                <H3>Co znamenají barvy a symboly</H3>
                <Ul>
                  <li>
                    <strong>Pravý dolní roh</strong> - V pravém dolním rohu
                    můžete mapu přiblížit/oddálit pomocí symbolu plus nebo
                    mínus. Přiblížením se objeví další barvy a symboly.
                  </li>
                  <li>
                    <strong>Tečky s barevností</strong> - Některé adresy mají
                    více spádových škol. Kliknutím na bod školy a dalším
                    přiblížením se zobrazí tečky jednotlivých bydlišť s
                    barevností příslušející spádovým školám.
                  </li>
                  <li>
                    <strong>Barevné oblasti</strong> - Při najetí myší na
                    barevnou oblast se zvýrazní škola spádová pro danou oblast.
                    Pokud oblast patří k více školám, barvy se překryjí a
                    ztmavnou.
                  </li>
                </Ul>

                <H3>Další funkce mapy</H3>
                <P>
                  <strong>
                    Vysvětlivky v sendvičovém menu v levém horním rohu
                  </strong>
                </P>
                <Ul>
                  <li>
                    <strong>Data ke stažení</strong> - Stáhněte si text
                    vyhlášky.
                  </li>
                  <li>
                    <strong>Vložit mapu na web</strong> - Mapu školy nebo města
                    můžete vložit na svůj web.
                  </li>
                  <li>
                    <strong>Vstup pro experty</strong> - Připravované
                    rozšiřující funkce pro experty.
                  </li>
                  <li>
                    <strong>Nahlásit chybu</strong> - Zobrazí se formulář pomocí
                    kterého můžete popsat a nahlásit chybu.
                  </li>
                  <li>
                    <strong>Nápověda</strong> - Zobrazí se text s nápovědou.
                  </li>
                </Ul>

                <H3>Nahlášení chyby</H3>
                <P>
                  Pokud najdete chybu v zobrazené lokalitě, prosím, nahlaste ji
                  pomocí tlačítka{" "}
                  <a
                    href="https://zapojmevsechny.cz/mapa-spadovosti-kontakt"
                    className="text-sky-600"
                    target="_blank"
                  >
                    Nahlásit chybu
                  </a>
                  . Budeme se snažit chybu co nejdříve opravit. Děkujeme za vaši
                  pomoc!
                </P>
                <P>
                  <em>
                    Mapa spádových obvodů je nástroj vytvořený{" "}
                    <a href="https://www.npi.cz/" className="text-sky-600">
                      Národním pedagogickým institutem ČR
                    </a>{" "}
                    za účelem usnadnění orientace v české vzdělávací krajině.
                    Pomocí umělé inteligence jsou texty vyhlášek převáděny do
                    adresních bodů, které jsou vykresleny na mapovém podkladu.
                    Soubor adres je po kontrole zveřejněn a pro snazší orientaci
                    došlo ke sjednocení spádové oblasti jedné konkrétní školy do
                    barevně vyznačené oblasti (polygonu).
                  </em>
                </P>

                <P>
                  <em className="text-sm">Verze 1.0 (2024)</em>
                </P>

                <div className="mt-4 flex justify-end">
                  <PublicButton onClick={closeModal}>Zavřít</PublicButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-8 text-xl font-semibold">{children}</h3>;
}

function H4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-slate-500 mt-8 text-lg font-medium">{children}</h4>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 mb-4">{children}</ul>;
}
