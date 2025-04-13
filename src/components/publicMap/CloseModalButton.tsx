import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  closeModal: () => void;
};

export default function CloseModalButton({ closeModal }: Props) {
  return (
    <button
      className="absolute right-6 top-6 transition-all hover:scale-110 md:right-6 md:top-6 cursor-pointer"
      onClick={closeModal}
    >
      <XMarkIcon className="w-7 text-sky-500" />
    </button>
  );
}
