import { Search } from "lucide-react";
import { type FormEvent, useEffect, useId, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

/**
 * Header search for applicants. It is a real, URL-driven search:
 * submitting goes to /patents?q=… where the list filters by that query,
 * so results survive refresh, Back/Forward and bookmarking.
 */
export function PatentSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();

  const onPatents = pathname === "/patents";
  const urlQuery = onPatents ? params.get("q") ?? "" : "";
  const [value, setValue] = useState(urlQuery);

  // Keep the box in step with the URL (Back/Forward, list-page edits).
  useEffect(() => setValue(urlQuery), [urlQuery]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    const target = query ? `/patents?q=${encodeURIComponent(query)}` : "/patents";
    // Refining a search on the list page edits the current entry instead of stacking history.
    navigate(target, { replace: onPatents });
  };

  return (
    <SearchBox
      value={value}
      onChange={setValue}
      onSubmit={submit}
      label="Search my patents"
      placeholder="Search my patents…"
    />
  );
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (event: FormEvent) => void;
  label: string;
  placeholder: string;
}

export function SearchBox({ value, onChange, onSubmit, label, placeholder }: SearchBoxProps) {
  // The search box is rendered twice (desktop header + phone row), so ids must be unique.
  const inputId = useId();
  return (
    <form role="search" onSubmit={onSubmit ?? ((e) => e.preventDefault())} className="relative w-full max-w-md">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field !rounded-full !bg-paper !py-2.5 !pl-10 !pr-4"
      />
    </form>
  );
}
