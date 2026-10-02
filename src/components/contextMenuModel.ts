import type { CompoundView, GraphChartType, NormalizedDag } from "../graph/types";
import type { GraphContextTarget } from "../state/contextMenu";

export type ContextMenuAction =
  | "view-node" | "copy-key" | "rename-node" | "delete-node" | "delete-subtree"
  | "edit-parents" | "edit-children" | "add-node" | "copy-node" | "copy-node-to-child"
  | "paste-node" | "paste-node-to-child" | "group-enter" | "group-toggle"
  | "group-members" | "group-with-siblings" | "group-rename" | "group-move"
  | "group-promote" | "group-dissolve" | "add-member" | "paste-member";

export interface MenuEntry {
  label: string;
  action?: ContextMenuAction;
  page?: string;
  danger?: boolean;
  disabled?: boolean;
}
export interface MenuPage { label: string; sections: MenuEntry[][] }

export function getContextMenuPages(
  target: GraphContextTarget, dag: NormalizedDag, chart: GraphChartType, view: CompoundView,
): Record<string, MenuPage> {
  const nested = chart === "compound";
  const parent = target.kind === "canvas" ? target.parentId : Object.prototype.hasOwnProperty.call(dag.hierarchy?.parentById ?? {}, target.id) ? dag.hierarchy!.parentById[target.id] : null;
  const organize: MenuPage = { label: "Subgraph membership", sections: [[
    { label: "Group with siblings…", action: "group-with-siblings" },
    { label: "Move to subgraph…", action: "group-move" },
    { label: "Move up one level", action: "group-promote", disabled: !parent },
  ]] };
  if (target.kind === "group") return {
    root: { label: "Subgraph", sections: [
      [{ label: "Enter subgraph", action: "group-enter" }, { label: view.collapsedGroupIds.includes(target.id) ? "Expand subgraph" : "Collapse subgraph", action: "group-toggle" }],
      [{ label: "Rename subgraph…", action: "group-rename" }, { label: "Members", page: "members" }, { label: "Subgraph membership", page: "organize" }],
      [{ label: "Copy ID", action: "copy-key" }, { label: "Ungroup · keep members", action: "group-dissolve", danger: true }],
    ] },
    members: { label: "Members", sections: [[{ label: "Add node here…", action: "add-member" }, { label: "Paste node here…", action: "paste-member" }, { label: "Group members…", action: "group-members" }]] },
    organize,
  };
  if (target.kind === "canvas") return {
    root: { label: parent ? "Subgraph canvas" : "Canvas", sections: [[
      { label: parent ? "Add node here…" : "Add node…", action: nested ? "add-member" : "add-node" },
      { label: parent ? "Paste node here…" : "Paste node…", action: nested ? "paste-member" : "paste-node" },
      ...(nested ? [{ label: "Group members…", action: "group-members" as const }] : []),
    ]] },
  };
  return {
    root: { label: "Node", sections: [
      [{ label: "Open details", action: "view-node" }, { label: "Rename ID…", action: "rename-node" }],
      [{ label: "Connections", page: "connections" }, ...(nested ? [{ label: "Subgraph membership", page: "organize" }] : []), { label: "Copy & paste", page: "clipboard" }],
      [{ label: "Delete node", action: "delete-node", danger: true }],
    ] },
    connections: { label: "Connections", sections: [[
      { label: "Edit incoming relationships…", action: "edit-parents" },
      { label: "Edit outgoing relationships…", action: "edit-children" },
      { label: "Add connected node…", action: "add-node" },
    ], ...(!nested ? [[{ label: "Delete reachable nodes", action: "delete-subtree" as const, danger: true }]] : [])] },
    clipboard: { label: "Copy & paste", sections: [[
      { label: "Copy ID", action: "copy-key" }, { label: "Copy node JSON", action: "copy-node" },
      { label: "Duplicate & connect…", action: "copy-node-to-child" },
      { label: "Paste & connect…", action: "paste-node-to-child" },
    ]] },
    organize,
  };
}
