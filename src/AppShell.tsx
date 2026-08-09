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

// Persistent app chrome: a left nav rail (settings entry point today, plus
// room for later per-selection contextual actions), a top ribbon of tool
// tabs, and a center content area showing whatever the active tool renders.
// Replaces the old LandingScreen + per-screen App.tsx switching.
function AppShell({ appSettings, onAppSettingsChange }: AppShellProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleToolClick = (tool: ToolDefinition) => {
    if (!tool.enabled) return
    // Re-selecting the already-active tool is a no-op at the shell level;
    // once a tool owns its own "how deep am I" state, it can reset that
    // state itself when it detects this re-selection (later subtask).
    setActiveTool(tool.id)
  }

  return (
    <div className="app-shell">
      <nav className="app-shell-nav">
        <span className="app-shell-nav-heading">Navigation</span>
        <button type="button" className="app-shell-nav-entry" onClick={() => setSettingsOpen(true)}>
          Configurations
        </button>
        <div className="app-shell-nav-context" />
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
              appSettings={appSettings}
              onAppSettingsChange={onAppSettingsChange}
              onExit={() => setActiveTool(null)}
            />
          )}
        </div>
      </div>

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
