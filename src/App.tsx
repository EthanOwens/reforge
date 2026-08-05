import { useState } from 'react'
import ResumeTool from './tools/resume/ResumeTool'
import SettingsModal from './settings/SettingsModal'
import { loadAppSettings } from './settings/settingsStore'
import type { AppSettings } from './settings/settingsStore'
import './settings/SettingsModal.css'

// Each entry is a self-contained tool screen. Add new tools here as they're
// built, without teaching the shell anything about what a given tool does.
const screens = {
  resume: { label: 'Resume', component: ResumeTool },
} as const

type ScreenId = keyof typeof screens

function App() {
  const [activeScreen] = useState<ScreenId>('resume')
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)

  const ActiveScreen = screens[activeScreen].component

  return (
    <div className="app">
      <ActiveScreen appSettings={settings} onAppSettingsChange={setSettings} />

      <button
        type="button"
        className="settings-cog-button"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

export default App
