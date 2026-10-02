import { useLayoutEffect, useRef, useState } from "react";
import type { CompoundView, GraphChartType, NormalizedDag } from "../graph/types";
import type { GraphContextMenu, GraphContextTarget } from "../state/contextMenu";
import { getContextMenuPages, type ContextMenuAction } from "./contextMenuModel";
export type { ContextMenuAction } from "./contextMenuModel";

interface ContextMenuProps {
  menu: GraphContextMenu | null;
  dag: NormalizedDag | null;
  chartType: GraphChartType;
  view: CompoundView;
  onAction: (action: ContextMenuAction, target: GraphContextTarget) => void;
  onClose: () => void;
}

export default function ContextMenu(props: ContextMenuProps) {
  if (!props.menu || !props.dag) return null;
  return <MenuContent key={JSON.stringify(props.menu)} {...props} menu={props.menu} dag={props.dag} />;
}

function MenuContent({ menu, dag, chartType, view, onAction, onClose }: ContextMenuProps & { menu: GraphContextMenu; dag: NormalizedDag }) {
  const [pageId, setPageId] = useState("root");
  const menuRef = useRef<HTMLDivElement>(null);
  const pages = getContextMenuPages(menu.target, dag, chartType, view);
  const page = pages[pageId] ?? pages.root;
  const id = menu.target.kind === "canvas" ? menu.target.parentId : menu.target.id;
  const title = id ? (menu.target.kind === "node" ? dag.nodes[id]?.title : dag.hierarchy?.groups[id]?.title) || id : "All nodes";

  useLayoutEffect(() => {
    const element = menuRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.left = `${Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8))}px`;
    element.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [menu, pageId]);

  return <div id="node-context-menu" className="node-context-menu is-visible" ref={menuRef}
    role="menu" aria-label={`${page.label}: ${title}`} style={{ left: menu.x, top: menu.y }}
    onClick={(event) => event.stopPropagation()} onContextMenu={(event) => event.preventDefault()}
    onKeyDown={(event) => {
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')];
      const active = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (active + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      } else if (event.key === "ArrowRight" && document.activeElement?.getAttribute("data-page")) {
        event.preventDefault(); setPageId(document.activeElement.getAttribute("data-page")!);
      } else if (event.key === "ArrowLeft" && pageId !== "root") {
        event.preventDefault(); setPageId("root");
      } else if (event.key === "Escape" || event.key === "Tab") {
        event.stopPropagation(); onClose();
      }
    }}>
    <div className="context-menu-heading"><span>{page.label}</span><strong title={title}>{title}</strong></div>
    {pageId !== "root" && <button role="menuitem" className="context-menu-item" onClick={() => setPageId("root")}>← Back</button>}
    {page.sections.map((section, index) => <div key={index} role="group" className="context-menu-section">
      {section.map((item) => <button key={item.action ?? item.page} type="button" role="menuitem"
        className={`context-menu-item${item.danger ? " context-menu-item-danger" : ""}`}
        disabled={item.disabled} data-page={item.page} aria-haspopup={item.page ? "menu" : undefined}
        onClick={() => item.page ? setPageId(item.page) : onAction(item.action!, menu.target)}>
        <span>{item.label}</span>{item.page && <span aria-hidden="true">›</span>}
      </button>)}
    </div>)}
  </div>;
}
