import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import debounce from "lodash/debounce";
import { useMemo, useRef, useState } from "react";
import Select, {
  components,
  DropdownIndicatorProps,
  InputActionMeta,
  InputProps,
  MenuListProps,
  MenuProps,
  OptionProps,
} from "react-select";
import {
  SuggestionItem,
  SuggestionsResponse,
} from "../../types/suggestionTypes";

const API_KEY = process.env.NEXT_PUBLIC_MAPY_CZ_API_KEY;

type SuggestionOption = {
  label: string;
  value: SuggestionItem;
};

type SearchInputProps = {
  onSelect: (item: SuggestionItem) => void;
};

export function SearchInput({ onSelect }: SearchInputProps) {
  const [value, setValue] = useState<SuggestionOption | null>(null);
  const [inputValue, setInputValue] = useState("");
  // Kept in local state (not react-select/async's internal cache) so the
  // previous suggestions are still there if the user re-focuses the search
  // bar after selecting an address, instead of showing "Žádné výsledky".
  const [options, setOptions] = useState<SuggestionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectRef = useRef<any>(undefined);

  const fetchOptions = useMemo(
    () =>
      debounce((query: string) => {
        fetch(
          `https://api.mapy.cz/v1/suggest?lang=cs&limit=5&locality=cz&type=regional.address&apikey=${API_KEY}&query=${query}`
        )
          .then((response) => response.json())
          .then((jsonData: SuggestionsResponse) => {
            setOptions(
              jsonData.items.map((item) => ({
                value: item,
                label: item.name,
              }))
            );
            setIsLoading(false);
          });
      }, 300),
    []
  );

  const onInputChange = (inputValue: string, { action }: InputActionMeta) => {
    // Deliberately no handling for "input-blur": keep whatever the user
    // typed after clicking away instead of reverting/clearing it for them.
    if (action === "input-change") {
      setInputValue(inputValue);
      if (inputValue) {
        setIsLoading(true);
        fetchOptions(inputValue);
      } else {
        setOptions([]);
      }
    }
  };

  const onChange = (option: SuggestionOption | null) => {
    setValue(option);
    setInputValue(option ? option.label : "");
    if (option?.value) {
      onSelect(option.value);
    }
  };

  const onFocus = () => value && selectRef.current?.select?.inputRef.select();

  return (
    <Select
      ref={selectRef}
      className="w-full"
      placeholder="Vyhledat adresu"
      value={value}
      inputValue={inputValue}
      onInputChange={onInputChange}
      isMulti={false}
      onChange={onChange}
      onFocus={onFocus}
      options={options}
      isLoading={isLoading}
      filterOption={null}
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
      classNames={{
        control() {
          return "shadow-sm";
        },
      }}
      styles={{
        menuList(base) {
          return {
            ...base,
            maxHeight: "400px",
          };
        },
        control(base) {
          return {
            ...base,
            borderRadius: "0.375rem",
            borderColor: "rgb(209, 213, 219)",
          };
        },
      }}
    />
  );
}

function Input(props: InputProps<SuggestionOption>) {
  const InputComponent = components.Input as React.ComponentType<
    InputProps<SuggestionOption>
  >;
  return <InputComponent {...props} isHidden={false} />;
}

function DropdownIndicator(props: DropdownIndicatorProps<SuggestionOption>) {
  const DropdownIndicatorComponent =
    components.DropdownIndicator as React.ComponentType<
      DropdownIndicatorProps<SuggestionOption>
    >;
  return (
    <DropdownIndicatorComponent {...props}>
      <MagnifyingGlassIcon className="w-5 m-1.5 text-sky-500" />
    </DropdownIndicatorComponent>
  );
}

function Option(props: OptionProps<SuggestionOption>) {
  const item = props.data.value;
  const OptionComponent = components.Option as React.ComponentType<
    OptionProps<SuggestionOption>
  >;
  return (
    <OptionComponent {...props}>
      <div
        className={`font-semibold ${
          props.isSelected ? "text-white" : "text-sky-600"
        }`}
      >
        {item.name}
      </div>
      <div className="text-sm">{item.location}</div>
    </OptionComponent>
  );
}

function Menu(props: MenuProps<SuggestionOption>) {
  const MenuComponent = components.Menu as React.ComponentType<
    MenuProps<SuggestionOption>
  >;
  return (
    <>{props.selectProps.inputValue ? <MenuComponent {...props} /> : null}</>
  );
}

function MenuList(props: MenuListProps<SuggestionOption>) {
  const MenuListComponent = components.MenuList as React.ComponentType<
    MenuListProps<SuggestionOption>
  >;
  return <MenuListComponent {...props} />;
}
