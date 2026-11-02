"use client";
// Perplexity-style left navigation: logo row, nav, Pinned / Projects / Recents, profile at the bottom. Collapsible.
import * as React from "react";
import { BellIcon, ChevronDownIcon, ChevronRightIcon, FileTextIcon, FolderIcon, GlobeIcon, PanelLeftIcon, PlayIcon, PlusIcon, SearchIcon } from "lucide-react";
import { LogoMark } from "@/components/shell/chrome";
import type { Profile } from "@/lib/gamification/derive";
import { cn } from "@/lib/utils";

export function Sidebar({ profile, recents, onNew, onNav, queueDone, queueLeft }: {
  profile: Profile; recents: string[]; onNew: () => void; onNav: (id: "browser" | "changes" | "sources" | "replay") => void; queueDone: number; queueLeft: number;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [open, setOpen] = React.useState({ pinned: false, projects: true, recents: true });
  const nav = [
    { id: "replay", label: "Replay demo", icon: PlayIcon }, { id: "browser", label: "Browser agent", icon: GlobeIcon },
    { id: "changes", label: "Reports", icon: FileTextIcon }, { id: "sources", label: "Sources", icon: SearchIcon },
  ] as const;
  const pct = Math.min(100, (profile.xp / Math.max(1, profile.nextRankAt)) * 100);
  return (
    <aside aria-label="navigation" className={cn("hidden shrink-0 flex-col border-r border-line-1 bg-bg-0 transition-[width] duration-300 md:flex", collapsed ? "w-14" : "w-60")}>
      <div className="flex items-center gap-1 px-3 py-3">
        <LogoMark className="size-6" />
        {!collapsed && <span className="ml-1 text-[13px] font-semibold">Palate <span className="text-accent">+</span> Sous</span>}
        <button aria-label={collapsed ? "expand sidebar" : "collapse sidebar"} onClick={() => setCollapsed((c) => !c)} className="ml-auto grid size-7 place-items-center rounded-md text-text-3 hover:bg-bg-2 hover:text-text-1">
          <PanelLeftIcon className="size-4" />
        </button>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        <button onClick={onNew} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-text-1 hover:bg-bg-2"><PlusIcon className="size-4" />{!collapsed && "New"}</button>
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNav(id)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-text-2 transition-colors hover:bg-bg-2 hover:text-text-1"><Icon className="size-4" />{!collapsed && label}</button>
        ))}
      </nav>
      {!collapsed && (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 text-[12px]">
          {([["pinned", "Pinned"], ["projects", "Projects"], ["recents", "Recents"]] as const).map(([k, title]) => (
            <div key={k} className="mb-1">
              <button onClick={() => setOpen((o) => ({ ...o, [k]: !o[k] }))} className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-text-3 hover:text-text-2">
                {title}{open[k] ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
              </button>
              {open[k] && (
                <div className="slide-in flex flex-col">
                  {k === "projects" && <span className="flex items-center gap-2 px-2.5 py-1.5 text-text-1"><FolderIcon className="size-3.5 text-text-3" />Fork It 2026</span>}
                  {k === "pinned" && <span className="px-2.5 py-1 text-text-3">Nothing pinned</span>}
                  {k === "recents" && (recents.length ? recents.map((r) => <span key={r} className="truncate rounded-md px-2.5 py-1.5 text-text-2 hover:bg-bg-2">{r}</span>) : <span className="px-2.5 py-1 text-text-3">No sessions yet</span>)}
                </div>
              )}
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between px-2.5 text-[11px] text-text-3"><span>Queue</span><span className="tnum">{queueDone} done · {queueLeft} left</span></div>
        </div>
      )}
      <div className={cn("mt-auto border-t border-line-1 p-3", collapsed && "grid place-items-center")}>
        {collapsed ? (
          <span className="grid size-8 place-items-center rounded-full border border-accent text-[12px] font-semibold text-accent" title={`${profile.rank} · ${profile.xp} XP`}>S</span>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full border-2 border-accent bg-bg-2 text-[12px] font-semibold text-accent">S</span>
              <div className="flex min-w-0 flex-col"><span className="text-[13px] font-medium leading-4">Sous #1</span><span className="text-[11px] text-accent">{profile.rank}</span></div>
              <BellIcon className="ml-auto size-4 text-text-3" aria-hidden />
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-bg-2" role="progressbar" aria-valuenow={profile.xp} aria-valuemax={profile.nextRankAt} aria-label="XP to next rank"><div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
            <div className="tnum flex justify-between text-[10px] text-text-3"><span>{profile.xp} XP</span><span>{Math.max(0, profile.nextRankAt - profile.xp)} to {profile.nextRankName}</span></div>
          </div>
        )}
      </div>
    </aside>
  );
}
