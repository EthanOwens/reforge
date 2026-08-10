import { useState } from 'react'
import ResumeMakerScreen from './tools/resume/ResumeMakerScreen'
import SettingsModal from './settings/SettingsModal'
import type { AppSettings } from './settings/settingsStore'
import './AppShell.css'

type ToolId = 'resumeMaker' | 'utility1' | 'utility2'

interface ToolDefinition {
  id: ToolId
  label: string
  enabled: boolean
}

const TOOLS: ToolDefinition[] = [
  { id: 'resumeMaker', label: 'Resume Maker', enabled: true },
  { id: 'utility1', label: 'Utility #1', enabled: false },
  { id: 'utility2', label: 'Utility #2', enabled: false },
]

interface AppShellProps {
  appSettings: AppSettings
  onAppSettingsChange: (next: AppSettings) => void
}

// Persistent app chrome: a left nav rail (shows per-selection contextual
// actions when a schema/variation is highlighted, otherwise empty), a
// floating settings cog, a top ribbon of tool tabs, and a center content
// area showing whatever the active tool renders. Replaces the old
// LandingScreen + per-screen App.tsx switching.
function AppShell({ appSettings, onAppSettingsChange }: AppShellProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [navContext, setNavContext] = useState<React.ReactNode>(null)
  // Bumped whenever the already-active tool's tab is re-clicked, and used as
  // that tool's `key` so React remounts it from scratch — the simplest way
  // to fully reset a tool's internal navigation state back to its home view.
  const [resetKey, setResetKey] = useState(0)

  const handleToolClick = (tool: ToolDefinition) => {
    if (!tool.enabled) return
    if (activeTool === tool.id) {
      setResetKey((key) => key + 1)
      return
    }
    setActiveTool(tool.id)
  }

  return (
    <div className="app-shell">
      <nav className="app-shell-nav">
        <div className="app-shell-nav-context">{navContext}</div>
      </nav>

      <div className="app-shell-main">
        <div className="app-shell-ribbon" role="tablist" aria-label="Tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={activeTool === tool.id}
              className={`app-shell-ribbon-tab${activeTool === tool.id ? ' active' : ''}`}
              disabled={!tool.enabled}
              onClick={() => handleToolClick(tool)}
            >
              {tool.label}
            </button>
          ))}
        </div>

        <div className="app-shell-content">
          {activeTool === 'resumeMaker' && (
            <ResumeMakerScreen
              key={resetKey}
              appSettings={appSettings}
              onAppSettingsChange={onAppSettingsChange}
              onExit={() => setActiveTool(null)}
              onNavContextChange={setNavContext}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        className="app-shell-settings-cog"
        aria-label="Open settings"
        onClick={() => setSettingsOpen(true)}
      >
        ⚙
      </button>

      {settingsOpen && (
        <SettingsModal
          settings={appSettings}
          onChange={onAppSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default AppShell
