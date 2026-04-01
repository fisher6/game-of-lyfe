"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [windowClosed, setWindowClosed] = useState(false);
  const [windowMinimized, setWindowMinimized] = useState(false);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [time] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  });

  return (
    <div
      className="win2k-desktop"
      onClick={() => setStartMenuOpen(false)}
    >
      {/* Desktop icons */}
      <div className="desktop-icons">
        <DesktopIcon label="My Computer" icon="💻" />
        <DesktopIcon label="Game of Lyfe" icon="🎮" />
        <DesktopIcon label="Recycle Bin" icon="🗑️" />
        <DesktopIcon label="My Documents" icon="📁" />
      </div>

      {/* Main dialog window */}
      {!windowClosed && !windowMinimized && (
        <div className="win2k-window">
          {/* Title bar */}
          <div className="win2k-titlebar">
            <div className="win2k-titlebar-left">
              <span className="win2k-titlebar-icon">🎮</span>
              <span className="win2k-titlebar-text">Game of Lyfe — Welcome</span>
            </div>
            <div className="win2k-titlebar-buttons">
              <button
                className="win2k-btn-chrome win2k-btn-minimize"
                onClick={() => setWindowMinimized(true)}
                aria-label="Minimize"
              >
                _
              </button>
              <button
                className="win2k-btn-chrome win2k-btn-maximize"
                aria-label="Maximize"
              >
                □
              </button>
              <button
                className="win2k-btn-chrome win2k-btn-close"
                onClick={() => setWindowClosed(true)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Menu bar */}
          <div className="win2k-menubar">
            <span className="win2k-menu-item">File</span>
            <span className="win2k-menu-item">Edit</span>
            <span className="win2k-menu-item">View</span>
            <span className="win2k-menu-item">Help</span>
          </div>

          {/* Window content */}
          <div className="win2k-content">
            {/* Sidebar */}
            <div className="win2k-sidebar">
              <div className="win2k-sidebar-header">Game of Lyfe</div>
              <div className="win2k-sidebar-body">
                <p className="win2k-sidebar-text">
                  A life simulation experience. Grow from age 8 — your choices shape everything.
                </p>
                <div className="win2k-sidebar-divider" />
                <div className="win2k-sidebar-links">
                  <a className="win2k-link">📄 About</a>
                  <a className="win2k-link">🔧 How to Play</a>
                  <a className="win2k-link">📞 Support</a>
                </div>
              </div>
            </div>

            {/* Main area */}
            <div className="win2k-main">
              <div className="win2k-banner">
                <h1 className="win2k-title">Game of Lyfe</h1>
                <p className="win2k-subtitle">Version 1.0 — Life Simulation Software</p>
              </div>

              <div className="win2k-inset-box">
                <p className="win2k-body-text">
                  Grow up from age eight with health, happiness, and money on the line.
                  Pick school paths, social media moments, college or work — a small demo
                  you can extend into a full life sim.
                </p>
              </div>

              <div className="win2k-info-row">
                <div className="win2k-info-badge">ℹ️</div>
                <p className="win2k-info-text">
                  Sign in with your Google account to save progress to the cloud.
                </p>
              </div>

              <div className="win2k-button-row">
                {status === "loading" ? (
                  <div className="win2k-status-bar-inner">
                    <span>Loading…</span>
                  </div>
                ) : session ? (
                  <Link href="/play" className="win2k-btn win2k-btn-primary">
                    ▶ Continue Your Life
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/play" })}
                    className="win2k-btn win2k-btn-primary"
                  >
                    🔑 Sign in with Google
                  </button>
                )}
                <button
                  type="button"
                  className="win2k-btn win2k-btn-secondary"
                  onClick={() => setWindowClosed(true)}
                >
                  Cancel
                </button>
              </div>

              {session && (
                <div className="win2k-signed-in">
                  ✔ Signed in as: <strong>{session.user?.email}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="win2k-statusbar">
            <div className="win2k-status-section">Ready</div>
            <div className="win2k-status-section">Life Sim v1.0</div>
            <div className="win2k-status-section">© 2000 Game of Lyfe Corp</div>
          </div>
        </div>
      )}

      {/* Restored window button if minimized */}
      {windowMinimized && (
        <div className="win2k-restore-hint">
          Window minimized — click the taskbar to restore
        </div>
      )}

      {/* Closed dialog */}
      {windowClosed && (
        <div className="win2k-window win2k-window-small">
          <div className="win2k-titlebar">
            <div className="win2k-titlebar-left">
              <span className="win2k-titlebar-icon">⚠️</span>
              <span className="win2k-titlebar-text">Game of Lyfe</span>
            </div>
            <div className="win2k-titlebar-buttons">
              <button className="win2k-btn-chrome win2k-btn-close" onClick={() => setWindowClosed(false)} aria-label="Close">✕</button>
            </div>
          </div>
          <div className="win2k-content win2k-dialog-body">
            <div className="win2k-dialog-icon">⚠️</div>
            <div>
              <p className="win2k-dialog-text">Are you sure you want to exit Game of Lyfe?</p>
              <p className="win2k-dialog-subtext">Your unsaved progress may be lost.</p>
            </div>
          </div>
          <div className="win2k-dialog-footer">
            <button className="win2k-btn win2k-btn-primary" onClick={() => setWindowClosed(false)}>No</button>
            <button className="win2k-btn win2k-btn-secondary" onClick={() => setWindowClosed(false)}>Yes</button>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="win2k-taskbar" onClick={(e) => e.stopPropagation()}>
        <button
          className={`win2k-start-btn ${startMenuOpen ? "win2k-start-btn-active" : ""}`}
          onClick={() => setStartMenuOpen((v) => !v)}
        >
          <span className="win2k-start-logo">⊞</span> Start
        </button>

        <div className="win2k-taskbar-divider" />

        {/* Open windows in taskbar */}
        <button
          className={`win2k-taskbar-window-btn ${windowMinimized ? "" : "win2k-taskbar-window-btn-active"}`}
          onClick={() => {
            setWindowClosed(false);
            setWindowMinimized(false);
          }}
        >
          🎮 Game of Lyfe
        </button>

        <div className="win2k-taskbar-spacer" />

        {/* System tray */}
        <div className="win2k-tray">
          <span className="win2k-tray-icon" title="Network">🌐</span>
          <span className="win2k-tray-icon" title="Volume">🔊</span>
          <span className="win2k-tray-time">{time}</span>
        </div>

        {/* Start menu */}
        {startMenuOpen && (
          <div className="win2k-start-menu">
            <div className="win2k-start-menu-header">
              <div className="win2k-start-menu-user">
                <span className="win2k-start-menu-avatar">👤</span>
                <span className="win2k-start-menu-username">
                  {session?.user?.name ?? "User"}
                </span>
              </div>
            </div>
            <div className="win2k-start-menu-items">
              <a className="win2k-start-menu-item">📁 My Documents</a>
              <a className="win2k-start-menu-item">🖼️ My Pictures</a>
              <a className="win2k-start-menu-item">🎵 My Music</a>
              <div className="win2k-start-menu-divider" />
              <a className="win2k-start-menu-item">🌐 Internet Explorer</a>
              <a className="win2k-start-menu-item">📧 Outlook Express</a>
              <div className="win2k-start-menu-divider" />
              <a className="win2k-start-menu-item">⚙️ Control Panel</a>
              <a className="win2k-start-menu-item">🔍 Search</a>
              <a className="win2k-start-menu-item">❓ Help</a>
              <div className="win2k-start-menu-divider" />
              <a className="win2k-start-menu-item win2k-start-menu-shutdown">🔴 Shut Down...</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopIcon({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="win2k-desktop-icon">
      <span className="win2k-desktop-icon-img">{icon}</span>
      <span className="win2k-desktop-icon-label">{label}</span>
    </div>
  );
}
