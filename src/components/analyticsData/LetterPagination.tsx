"use client";

import { Button } from "@/components/ui/button";
import { texts } from "@/utils/shared/texts";
import { useRouter, useSearchParams } from "next/navigation";

//Q, W, X, Y - no municipalitys starting with these letters in CZ
const alphabet = "ABCDEFGHIJKLMNOPRSTUVZ".split("");

export default function LetterPagination({
  selectedLetter,
}: {
  selectedLetter: string | undefined;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleLetterChange = (letter: string) => {
    const params = new URLSearchParams(searchParams);
    if (letter === selectedLetter) {
      params.delete("letter");
    } else {
      params.set("letter", letter);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-1 mb-4">
      {alphabet.map((letter) => (
        <Button
          key={letter}
          variant={selectedLetter === letter ? "default" : "outline"}
          size="sm"
          onClick={() => handleLetterChange(letter)}
          className="w-8 h-8 p-0"
        >
          {letter}
        </Button>
      ))}
      <Button
        variant={!selectedLetter ? "default" : "ghost"}
        size="sm"
        onClick={() => {
          const params = new URLSearchParams(searchParams);
          params.delete("letter");
          router.push(`?${params.toString()}`);
        }}
        className="ml-2"
      >
        {texts.all}
      </Button>
    </div>
  );
}
