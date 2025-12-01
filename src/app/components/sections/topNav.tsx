"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useUserType, useUserName } from "@/src/app/utils/auth";

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const userType = useUserType();
  const userName = useUserName();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function handleLogout() {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("expiresAt");
    } catch (err) {
      console.warn("Error clearing localStorage during logout", err);
    }
    window.location.href = "/auth/login";
  }

  return (
    <nav className="w-full h-20 bg-black text-white flex items-center px-6 shadow-md">
      <div className="flex items-center justify-between w-full">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/Groovo.svg"
            alt="Groovo Logo"
            width={120}
            height={32}
            priority
          />
        </div>

        {/* Center: search bar */}
        {/*
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              aria-label="Search"
              className="w-full bg-neutral-800 text-sm placeholder:text-neutral-400 text-white rounded-md py-2 px-3 outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Search"
            />
          </div>
        </div>
        */}
        {/* Right: account button with placeholder avatar and dropdown */}
        <div className="ml-4 relative" ref={dropdownRef}>
          <button
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 px-1 py-1 rounded-full focus:outline-none"
          >
            {/* placeholder avatar as an inline SVG circle */}
            <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center overflow-hidden">
              <Image
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${userName || "Account"}`}
                alt="User Avatar"
                width={32}
                height={32}
                unoptimized
              />
            </div>

            <span className="hidden sm:inline-block text-sm">
              {userName || "Account"} {userType && `(${userType})`}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-neutral-900 rounded-md shadow-lg py-1 z-20">
              <a
                href="/dashboard"
                className="block px-4 py-2 text-sm hover:bg-neutral-800"
                onClick={() => setOpen(false)}
              >
                Profile
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm hover:bg-neutral-800"
                onClick={() => setOpen(false)}
              >
                Account
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
