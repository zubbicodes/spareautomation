import { createContext, useContext, type ReactNode } from "react";

import { getDefaultContentBundle, type ContentBundle } from "./registry";

const ContentContext = createContext<ContentBundle | null>(null);

export function ContentProvider({ value, children }: { value: ContentBundle; children: ReactNode }) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

/** Defaults also make isolated component tests and catastrophic loader failures safe. */
export function useContent() {
  return useContext(ContentContext) ?? getDefaultContentBundle();
}
