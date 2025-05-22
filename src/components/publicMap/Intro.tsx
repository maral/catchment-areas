import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import Image from "next/image";
import { Fragment } from "react";
import PublicButton from "../buttons/PublicButton";
import CloseModalButton from "./CloseModalButton";
import { H3, P } from "./Typography";

type IntroProps = {
  closeModal: () => void;
  isOpen: boolean;
};

export default function Intro({ isOpen, closeModal }: IntroProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-2000 w-full" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>

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
                  Vítejte v mapě spádovosti
                </Dialog.Title>
                <P>
                  Mapa zobrazuje přehled spádových oblastí pro největších 300
                  obcí a&nbsp;měst v&nbsp;České republice, které zřizují dvě
                  a&nbsp;více základních či mateřských škol a&nbsp;jsou povinny
                  určit jejich spádovost.
                </P>

                <H3>Orientace v mapě</H3>
                <P>Každá spádová oblast je barevně odlišena:</P>
                <P>
                  <Image
                    src={"/blue_triangle.svg"}
                    alt="modrý trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  <strong>Modrý trojúhelník</strong> - města a obce s již
                  zpracovanou vyhláškou - mateřské školy.
                </P>
                <P>
                  <Image
                    src={"/green_triangle.svg"}
                    alt="zelený trojúhelník"
                    width={24}
                    height={24}
                    className="inline-block"
                  />{" "}
                  <strong>Zelený trojúhelník</strong> - města a obce s již
                  zpracovanou vyhláškou - první stupeň základních škol
                </P>
                <H3>Ovladací prvky</H3>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-baseline">
                  <Image
                    src={"/intro-search.png"}
                    alt="lupa"
                    width={13}
                    height={13}
                    className="inline-block"
                  />
                  <p>Zadejte svou adresu do vyhledávacího pole.</p>
                  <Image
                    src={"/intro-zoom.png"}
                    alt="přiblížení"
                    width={13}
                    height={13}
                    className="inline-block"
                  />
                  <p>
                    Přibližte myší nebo prsty mapu a zobrazí se spádové oblasti
                    a školy.
                  </p>
                  <Image
                    src={"/intro-clicker.png"}
                    alt="kurzor"
                    width={13}
                    height={13}
                    className="inline-block"
                  />
                  <p>
                    Kliknutím na konkrétní školu uvidíte pouze její spádovou
                    oblast.
                  </p>
                  <Image
                    src={"/intro-hamburger.png"}
                    alt="ikona menu"
                    width={13}
                    height={13}
                    className="inline-block"
                  />{" "}
                  <p>
                    Další nabídku možností jako například vložení mapy na
                    vlastní web či nápovědu si zobrazíte rozkliknutím tlačítka ☰
                    vlevo nahoře.
                  </p>
                </div>
                <div className="mt-4 flex justify-start">
                  <PublicButton onClick={closeModal} variant="primary">
                    Přejít na mapu
                  </PublicButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
