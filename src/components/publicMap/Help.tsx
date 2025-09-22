import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { Fragment } from "react";
import PublicButton from "../buttons/PublicButton";
import CloseModalButton from "./CloseModalButton";
import { H3, P, Ul } from "./Typography";

type HelpProps = {
  closeModal: () => void;
  isOpen: boolean;
};

export default function Help({ isOpen, closeModal }: HelpProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-2000 w-full" onClose={closeModal}>
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
                <CloseModalButton closeModal={closeModal} />
                <Dialog.Title
                  as="h2"
                  className="text-3xl font-medium leading-8 mb-12 pr-8"
                >
                  Návod k používání aplikace Mapa spádovosti
                </Dialog.Title>

                <H3>Pro koho je mapa spádových oblastí škol určena?</H3>

                <Ul>
                  <li>
                    <strong>Rodičům</strong> - pro zjištění spádové školy jejich
                    dětí.
                  </li>
                  <li>
                    <strong>Ředitelům</strong> - pro snadnou komunikaci o
                    spádových školách pomocí vizualizace.
                  </li>
                  <li>
                    <strong>Zřizovatelům</strong> - pro kontrolu a správu modelu
                    spádovosti.
                  </li>
                  <li>
                    <strong>Expertům na vzdělávání</strong> - pro nastavení
                    vhodné vzdělávací politiky, jako je přespádování nebo stavba
                    nových škol.
                  </li>
                </Ul>

                <H3>Jak mapa funguje?</H3>
                <P>
                  Mapa zobrazuje přehled spádových oblastí pro&nbsp;největších
                  300 obcí a&nbsp;měst v&nbsp;České republice, které zřizují dvě
                  a&nbsp;více základních či&nbsp;mateřských škol a&nbsp;jsou
                  povinny určit jejich spádovost.
                </P>
                <P>
                  Ve výchozím stavu&nbsp;se zobrazují základní školy, zobrazení
                  je&nbsp;možné přepnout&nbsp;na mateřské školy pomocí přepínače
                  nahoře&nbsp;–&nbsp;uprostřed.
                </P>
                <div className="flex flex-wrap justify-start items-center gap-4 mb-4">
                  <Image
                    src={"/prepinac-zs.png"}
                    alt="přepínač ZŠ"
                    width={280}
                    height={50}
                    className="block"
                  />
                  <Image
                    src={"/prepinac-ms.png"}
                    alt="přepínač MŠ"
                    width={280}
                    height={50}
                    className="block"
                  />
                </div>
                <P>Každá spádová oblast je barevně odlišena:</P>
                <P>
                  <Image
                    src={"/blue_triangle.svg"}
                    alt="modrý trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  <strong>Modrý trojúhelník</strong> označuje mateřské školy.
                </P>

                <P>
                  <Image
                    src={"/green_triangle.svg"}
                    alt="zelený trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  <strong>Zelený trojúhelník</strong> označuje první stupeň
                  základních škol
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

                <H3>Datový zdroj</H3>
                <P>
                  Zdrojem dat pro mapu spádovosti jsou aktuálně platné vyhlášky
                  obcí zveřejňované ve{" "}
                  <a
                    href="https://sbirkapp.gov.cz/"
                    className="text-sky-600"
                    target="_blank"
                  >
                    Sbírce právních předpisů územních samosprávných celků
                  </a>
                  .
                </P>

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
                  <em className="text-sm">Verze 2.0 (2025)</em>
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
