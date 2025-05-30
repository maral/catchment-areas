import { Menu as HeadlessMenu, Transition } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  Bars3Icon,
  ExclamationTriangleIcon,
  MapIcon,
  QuestionMarkCircleIcon,
  RocketLaunchIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useState } from "react";
import { texts } from "../../utils/shared/texts";
import Help from "./Help";
import Intro from "./Intro";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function Menu() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);

  const showHelp = () => setIsHelpOpen(true);
  const hideHelp = () => setIsHelpOpen(false);

  const hideIntro = () => {
    localStorage.setItem("hasVisited", "true");
    setIsIntroOpen(false);
  };

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) {
      setIsIntroOpen(true);
    }
  }, []);

  return (
    <>
      <HeadlessMenu as="div">
        <HeadlessMenu.Button
          className="w-[50px] h-[50px] border rounded-md cursor-pointer bg-white hover:bg-slate-100 border-gray-300
block px-3 py-2 transition-colors shadow text-slate-400 hover:text-slate-500 content-center"
        >
          <Bars3Icon className="inline-block h-6 w-6" aria-hidden="true" />
        </HeadlessMenu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <HeadlessMenu.Items className="absolute left-0 mt-2 w-60 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden">
            <div className="px-1 py-1 ">
              <Item icon={ArrowDownTrayIcon} href={"/data"}>
                {texts.dataForDownload}
              </Item>
              <Item icon={MapIcon} href={"/embed"}>
                {texts.embedMap}
              </Item>
              <Item icon={SparklesIcon}>{texts.expertsEntrance}</Item>
              <Item
                icon={ExclamationTriangleIcon}
                href={texts.URL_reportBug}
                target="_blank"
              >
                {texts.reportBug}
              </Item>
              <Item icon={QuestionMarkCircleIcon} onClick={showHelp}>
                {texts.help}
              </Item>
            </div>
          </HeadlessMenu.Items>
        </Transition>
      </HeadlessMenu>
      <Help isOpen={isHelpOpen} closeModal={hideHelp} />
      <Intro isOpen={isIntroOpen} closeModal={hideIntro} />
    </>
  );
}

type ItemProps = {
  icon?: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
};

const Item = ({ icon, onClick, href, target, children }: ItemProps) => {
  const ButtonComponent = onClick ? "button" : "a";
  const disabled = !onClick && !href;
  const Icon = icon!;
  return (
    <HeadlessMenu.Item>
      {({ active }) => (
        <ButtonComponent
          className={`${disabled && "text-slate-400"} ${
            active ? "bg-sky-100 text-sky-900" : "text-gray-900"
          } transition-colors group flex w-full items-center rounded-md px-3 py-2 cursor-pointer`}
          onClick={onClick}
          href={href}
          target={target}
        >
          {icon && (
            <Icon
              className={`w-5 h-5 mr-2 ${
                disabled ? "text-gray-500" : "text-sky-500"
              }`}
            />
          )}
          {children}
          {disabled && <div className="grow"></div>}
          {disabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <RocketLaunchIcon className="w-5 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent className="z-[10000]">
                  {texts.featureUnderConstruction}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </ButtonComponent>
      )}
    </HeadlessMenu.Item>
  );
};
