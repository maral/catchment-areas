import { Dialog, Transition } from "@headlessui/react";
import { MapIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@tremor/react";
import { Fragment } from "react";
import PublicButton from "../buttons/PublicButton";
import Image from "next/image";
import { P } from "./Typography";

type IntroProps = {
  closeModal: () => void;
  isOpen: boolean;
};

export default function Intro({ isOpen, closeModal }: IntroProps) {
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
                  Vítejte v mapě spádovosti
                </Dialog.Title>
                <p className="pb-8">
                  Tato aplikace vám pomůže jednoduše zjistit spádovou školu dle
                  vaší adresy. Aktuálně zobrazuje spádovost základních škol v
                  300 největších městech ČR.
                </p>
                <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 items-baseline">
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
