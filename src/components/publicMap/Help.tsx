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
                  className="text-3xl font-medium leading-6"
                >
                  Nápověda
                </Dialog.Title>
                <H3>Pokrytí obcí a měst</H3>
                <P>
                  V aplikaci Spádové oblasti jsou zobrazeny všechny obce, které
                  mají dvě a více škol a mají proto povinnost vydávat spádovou
                  vyhlášku. Zeleným trojúhelníkem{" "}
                  <Image
                    src={"/green_triangle.svg"}
                    alt="zelený trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  jsou označena města a obce, které již mají v aplikaci vyhlášku
                  zpracovanou do mapových dat. Šedý trojúhelník označuje města a
                  obce, které ještě čekají na zpracování.
                </P>
                <H3>Vyhledání adresy</H3>
                <P>
                  V poli <em>Vyhledat adresu</em> zadejte adresu místa, jehož
                  spádovou školu chcete zobrazit a vyberte z nabídky.
                </P>
                <H3>Barevné oblasti a body</H3>
                <P>
                  Od určitého přiblížení uvidíte barevné oblasti a body
                  vyznačující školy. Při ještě větším přiblížením se zobrazí i
                  menší body označující jednotlivá bydliště. Barva oblasti, bodu
                  a školy se shodují, pokud bod (a tedy i oblast) spadá k dané
                  škole.
                </P>
                <Image
                  src={"/multicolor_markers.png"}
                  alt="vícebarevné tečky"
                  width={188}
                  height={121}
                  className="float-right"
                />
                <P>
                  Některé adresy ale mohou mít{" "}
                  <strong>více spádových škol</strong>. Častým případem jsou
                  například obce na Slezsku, které mají školu s polským
                  vyučovacím jazykem, jejíž spádovou oblastí je celé město. V
                  tom případě se na dané adrese zobrazí barevných teček několik,
                  odpovídajících barevně všem spádovým školám.
                </P>
                <H4>Oblasti</H4>
                <P>
                  Při najetí myší nad barevnou oblast se zvýrazní škola spádová
                  pro danou oblast. Pokud oblast přísluší k více školám, barvy
                  se překryjí a tím smíchají (obvykle trochu tmavší barva), při
                  najetí myši se zvýrazní všechny spádové školy najednou.
                </P>
                <H4>Body</H4>
                <P>
                  Po kliknutí na barevný bod se zobrazí adresa a tlačítko{" "}
                  <em>Zobrazit spádovou školu</em>. To propojí adresní bod s
                  jeho spádovou školou, případně více školami.
                </P>
                <H4>Zobrazení spádové oblasti školy</H4>
                <P>
                  V případech, kdy se spádové oblasti škol překrývají nebo je
                  blízko sebe více různých oblastí stejné barvy, hodí se funkce
                  zobrazení spádové oblasti školy, kterou lze vyvolat kliknutím
                  na bod školy. Poté se zvýrazní spádová oblast školy a ostatní
                  oblasti se skryjí.
                </P>

                <H3>Chyby ve spádovostech</H3>
                <P>
                  Spádové vyhlášky jednotlivých měst jsou do mapových dat
                  převáděny částečně automatizovaným procesem. V některých
                  případech proto mohou být data nepřesná. Pokud si všimnete
                  jakékoliv chyby, nahlašte ji pomocí tlačítka{" "}
                  <em>Nahlásit chybu</em> a pomožte nám aplikaci vylepšovat.
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
  return <h3 className="mb-2 mt-8 text-xl font-medium">{children}</h3>;
}

function H4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-slate-500 mt-8 text-lg font-medium">{children}</h4>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4">{children}</p>;
}
