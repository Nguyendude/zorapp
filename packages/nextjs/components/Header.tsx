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
      className={`${
        isActive ? "bg-secondary shadow-md" : ""
      } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
    >
      {children}
    </Link>
  );
};

export const Header = () => {
  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2 flex items-center gap-4">
        <div className="lg:hidden dropdown" data-tip="Menu">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li>
              <Link href="/">Create Post</Link>
            </li>
            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/explore">Explore</Link>
              <Link href="/channels">Channels</Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="text-xl font-bold">📝 PostMint</div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <li>
            <NavLink href="/">Create Post</NavLink>
          </li>
          <li>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </li>
          <li>
            <NavLink href="/explore">Explore</NavLink>
          </li>
          <li>
            <NavLink href="/creators">Creators</NavLink>
          </li>
          <li>
            <NavLink href="/channels">Channels</NavLink>
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
