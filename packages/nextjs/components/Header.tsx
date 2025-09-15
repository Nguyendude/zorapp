"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`$
        {isActive ? "bg-secondary shadow-md" : ""}
      hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
    >
      {children}
    </Link>
  );
};

export const Header = () => {
  return (
    <div className="sticky top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2 flex items-center gap-4">
        <Link href="/" className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="text-xl font-bold">📝 Post</div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <li>
            <NavLink href="/explore">Explore</NavLink>
          </li>
          <li>
            <NavLink href="/creators">Creators</NavLink>
          </li>
          <li>
            <NavLink href="/channels">Channels</NavLink>
          </li>
          <li>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </li>
        </ul>
        {/* Search bar */}
        <form className="ml-4 flex items-center" role="search" onSubmit={e => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search..."
            className="input input-bordered input-sm rounded-full px-4"
            style={{ fontFamily: "inherit" }}
          />
        </form>
      </div>
      <div className="navbar-end flex items-center gap-4 mr-4">
        <Link href="/create">
          <button className="btn btn-primary btn-sm rounded-full font-semibold px-4 mr-2" type="button">
            Create a coin
          </button>
        </Link>
        <SwitchTheme />
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
