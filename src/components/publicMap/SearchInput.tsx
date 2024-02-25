import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Icon } from "@tremor/react";
import debounce from "lodash/debounce";
import { useRef, useState } from "react";
import {
  components,
  DropdownIndicatorProps,
  InputActionMeta,
  InputProps,
  MenuListProps,
  MenuProps,
  NoticeProps,
  OptionProps,
} from "react-select";
import AsyncSelect from "react-select/async";
import {
  SuggestionItem,
  SuggestionsResponse,
} from "../../types/suggestionTypes";

const API_KEY = process.env.NEXT_PUBLIC_MAPY_CZ_API_KEY;

type SuggestionOption = {
  label: string;
  value: SuggestionItem;
};

const loadOptions = debounce(
  (
    inputValue: string,
    callback: (options: { label: string; value: SuggestionItem }[]) => void
  ) => {
    fetch(
      `https://api.mapy.cz/v1/suggest?lang=cs&limit=5&locality=cz&type=regional.address&apikey=${API_KEY}&query=${inputValue}`
    )
      .then((response) => response.json())
      .then((jsonData: SuggestionsResponse) => {
        const options = jsonData.items.map((item) => ({
          value: item,
          label: item.name,
        }));

        callback(options);
      });
  },
  300
);

type SearchInputProps = {
  onSelect: (item: SuggestionItem) => void;
};

export function SearchInput({ onSelect }: SearchInputProps) {
  // This needs to become a controlled component so track state
  const [value, setValue] = useState<SuggestionOption | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [justSelectedValue, setJustSelectedValue] =
    useState<SuggestionOption | null>(null);

  const selectRef = useRef<any>();

  const onInputChange = (inputValue: string, { action }: InputActionMeta) => {
    setJustSelectedValue(null);

    if (action === "input-blur") {
      setInputValue(value ? value.label : "");
    }

    if (action === "input-change") {
      setInputValue(inputValue);
    }
  };

  const onChange = (option: SuggestionOption | null) => {
    setValue(option);
    setJustSelectedValue(option);
    setInputValue(option ? option.label : "");
    if (option?.value) {
      onSelect(option.value);
    }
  };

  const onFocus = () => value && selectRef.current?.select?.inputRef.select();

  return (
    <AsyncSelect
      ref={selectRef}
      className="w-full"
      loadOptions={loadOptions}
      placeholder="Vyhledat adresu"
      value={value}
      inputValue={inputValue}
      onInputChange={onInputChange}
      isMulti={false}
      onChange={onChange}
      onFocus={onFocus}
      options={justSelectedValue ? [justSelectedValue] : undefined}
      controlShouldRenderValue={false}
      loadingMessage={() => "Načítám..."}
      noOptionsMessage={() => "Žádné výsledky"}
      components={{
        DropdownIndicator,
        Option,
        Input,
        Menu,
        MenuList,
      }}
      styles={{
        menuList(base) {
          return {
            ...base,
            maxHeight: "400px",
          };
        },
      }}
    />
  );
}

function Input(props: InputProps<SuggestionOption>) {
  return <components.Input {...props} isHidden={false} />;
}

function DropdownIndicator(props: DropdownIndicatorProps<SuggestionOption>) {
  return (
    <components.DropdownIndicator {...props}>
      <Icon icon={MagnifyingGlassIcon} />
    </components.DropdownIndicator>
  );
}

function Option(props: OptionProps<SuggestionOption>) {
  const item = props.data.value;

  return (
    <components.Option {...props}>
      <div className="font-bold text-purple-500">{item.name}</div>
      <div className="text-sm">{item.location}</div>
    </components.Option>
  );
}

function Menu(props: MenuProps<SuggestionOption>) {
  return (
    <>{props.selectProps.inputValue ? <components.Menu {...props} /> : null}</>
  );
}

function MenuList(props: MenuListProps<SuggestionOption>) {
  return <components.MenuList {...props} />;
}
