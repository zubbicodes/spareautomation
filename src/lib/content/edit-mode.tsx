import { createContext, useContext, type ReactNode } from "react";

/**
 * Visual editing support.
 *
 * When the CMS renders a public page inside its visual editor it sets this
 * context, and editable text picks up a `data-cms-field` attribute naming the
 * content path behind it. The attribute is invisible and is never emitted on
 * the live website, so the public UI is byte-for-byte unchanged for visitors.
 */
const EditModeContext = createContext(false);

export function EditModeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <EditModeContext.Provider value={enabled}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}

export type EditableProps = { "data-cms-field"?: string; "data-cms-label"?: string };

/**
 * Returns the marker props for an editable value, or nothing outside the editor.
 * `path` is the dotted path inside the content document, e.g.
 * `catalogue.ranges.0.lines.2.label`.
 */
export function useEditable() {
  const enabled = useEditMode();
  return (path: string, label?: string): EditableProps =>
    enabled ? { "data-cms-field": path, "data-cms-label": label } : {};
}
