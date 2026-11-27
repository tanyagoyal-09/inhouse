import { useLocation, useNavigate } from "react-router-dom";

import { SearchBox } from "../components/layout/HeaderSearch";
import { useAdmin } from "./AdminContext";

/** Header search for administrators: filters the Applications list. */
export function AdminSearch() {
  const { search, setSearch } = useAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onChange = (value: string) => {
    setSearch(value);
    // Searching only makes sense on the list, so take the admin there.
    if (value && pathname !== "/admin/patents") navigate("/admin/patents");
  };

  return (
    <SearchBox
      value={search}
      onChange={onChange}
      label="Search applications"
      placeholder="Search applications…"
    />
  );
}
