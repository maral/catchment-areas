import Editor from "@/components/editor/Editor";
import { readFileSync } from "fs";
import "@/utils/textToMapInit";

export default async function EditorPage() {
  const text = readFileSync("public/vyhlaska_CL.txt", "utf-8");

  return (
    <div>
      <Editor text={text} />
    </div>
  );
}
