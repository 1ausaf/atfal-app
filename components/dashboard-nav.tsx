"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { UserRole } from "@/lib/db-types";

const navLinkClass =
  "text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 inline-flex items-center gap-1 transition-colors";
const dropdownPanelClass =
  "absolute top-full left-0 mt-1 min-w-[10rem] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1 z-50";
const dropdownItemClass =
  "block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors";

type NavCounts = { friends: number; messages: number; homework: number; lessons: number };

function DropdownItem({
  href,
  label,
  count = 0,
  onNavigate,
}: {
  href: string;
  label: string;
  count?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`${dropdownItemClass} inline-flex items-center gap-1`}
      onClick={onNavigate}
    >
      {label}
      {count > 0 && (
        <span className="rounded-full bg-red-500 w-2 h-2 inline-block shrink-0 ml-1" aria-hidden />
      )}
    </Link>
  );
}

function Dropdown({
  label,
  children,
  open,
  onToggle,
  panelRef,
}: {
  label: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`${navLinkClass} appearance-none bg-transparent border-0 cursor-pointer`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <svg
          className={`w-4 h-4 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={dropdownPanelClass} role="menu">
          {children}
        </div>
      )}
    </div>
  );
}

export function DashboardNav({
  role,
  navCounts,
}: {
  role: UserRole;
  navCounts: NavCounts;
}) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const connectRef = useRef<HTMLDivElement>(null);
  const learnRef = useRef<HTMLDivElement>(null);
  const manageRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  const isTifl = role === "tifl";
  const isLocalNazim = role === "local_nazim";
  const isRegionalNazim = role === "regional_nazim";
  const isNazim = isLocalNazim || isRegionalNazim;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        openDropdown &&
        !connectRef.current?.contains(target) &&
        !learnRef.current?.contains(target) &&
        !manageRef.current?.contains(target) &&
        !adminRef.current?.contains(target)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const closeDropdown = () => setOpenDropdown(null);

  return (
    <nav className="flex items-center gap-4 flex-wrap">
      <Link href="/dashboard" className={navLinkClass}>
        Dashboard
      </Link>
      <Link href="/profile" className={navLinkClass}>
        Profile
      </Link>

      {isTifl && (
        <Dropdown
          label="Connect"
          open={openDropdown === "connect"}
          onToggle={() => setOpenDropdown((v) => (v === "connect" ? null : "connect"))}
          panelRef={connectRef}
        >
          <DropdownItem
            href="/messages"
            label="Messages"
            count={navCounts.messages}
            onNavigate={closeDropdown}
          />
          <DropdownItem
            href="/friends"
            label="Friends"
            count={navCounts.friends}
            onNavigate={closeDropdown}
          />
        </Dropdown>
      )}

      {isTifl && (
        <Dropdown
          label="Learn"
          open={openDropdown === "learn"}
          onToggle={() => setOpenDropdown((v) => (v === "learn" ? null : "learn"))}
          panelRef={learnRef}
        >
          <DropdownItem
            href="/homework"
            label="Homework"
            count={navCounts.homework}
            onNavigate={closeDropdown}
          />
          <DropdownItem
            href="/lessons"
            label="Lessons"
            count={navCounts.lessons}
            onNavigate={closeDropdown}
          />
          <DropdownItem href="/learn/salat" label="Salat" onNavigate={closeDropdown} />
        </Dropdown>
      )}

      {isNazim && (
        <Dropdown
          label="Manage"
          open={openDropdown === "manage"}
          onToggle={() => setOpenDropdown((v) => (v === "manage" ? null : "manage"))}
          panelRef={manageRef}
        >
          <DropdownItem href="/tifls" label="Tifls" onNavigate={closeDropdown} />
          <DropdownItem href="/homework" label="Homework" onNavigate={closeDropdown} />
          <DropdownItem href="/events" label="Events" onNavigate={closeDropdown} />
          <DropdownItem href="/learn/salat/pending" label="Salat tests" onNavigate={closeDropdown} />
          {isRegionalNazim && (
            <DropdownItem href="/lessons" label="Lessons" onNavigate={closeDropdown} />
          )}
        </Dropdown>
      )}

      {isRegionalNazim && (
        <Dropdown
          label="Admin"
          open={openDropdown === "admin"}
          onToggle={() => setOpenDropdown((v) => (v === "admin" ? null : "admin"))}
          panelRef={adminRef}
        >
          <DropdownItem href="/admin" label="Overview" onNavigate={closeDropdown} />
          <DropdownItem href="/admin/analytics" label="Analytics" onNavigate={closeDropdown} />
          <DropdownItem href="/admin/chats" label="All Chats" onNavigate={closeDropdown} />
        </Dropdown>
      )}

      <Link href="/leaderboard" className={navLinkClass}>
        Leaderboard
      </Link>
      <Link
        href="/signout"
        className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        Sign out
      </Link>
    </nav>
  );
}
