import React from "react";
import { classNames } from "@/common/helpers/css";
import { SidebarHeader } from "./SidebarHeader";
import { Badge } from "@/components/ui/badge";
import { Search, useSearchStore } from "@/stores/useSearchStore";
import { take } from "lodash";
import sortBy from "lodash.sortby";
import { isDev } from "@/common/helpers/env";

const SearchesOverview = () => {
  const { searches } = useSearchStore();

  const renderSearch = (search: Search) => {
    return (
      <li key={`search-${search.startedAt}`} className="px-2 sm:px-3 lg:px-4">
        <div
          className={classNames(
            "flex align-center justify-between gap-x-3 rounded-md p-1 text-sm leading-6"
          )}
        >
          <span className="flex-nowrap truncate">{search.term}</span>
          {isDev() && (
            <Badge variant="outline" className="w-16">
              {(search.endedAt - search.startedAt) / 1000}s
            </Badge>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="">
      <SidebarHeader title="Search History" />
      <ul role="list" className="mt-2 mb-12">
        {take(
          sortBy(searches, (s) => -s.endedAt),
          10
        ).map(renderSearch)}
      </ul>
    </div>
  );
};

export default SearchesOverview;