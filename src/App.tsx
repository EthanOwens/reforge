import { useState } from 'react'
import LandingScreen from './LandingScreen'
import ResumeMakerScreen from './tools/resume/ResumeMakerScreen'
import SettingsModal from './settings/SettingsModal'
import { loadAppSettings } from './settings/settingsStore'
import type { AppSettings } from './settings/settingsStore'
import './settings/SettingsModal.css'

type ScreenId = 'landing' | 'resume'

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('landing')
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="app">
      {activeScreen === 'landing' && (
        <LandingScreen onSelectResumeMaker={() => setActiveScreen('resume')} />
      )}
      {activeScreen === 'resume' && (
        <ResumeMakerScreen
          appSettings={settings}
          onAppSettingsChange={setSettings}
          onExit={() => setActiveScreen('landing')}
        />
      )}

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
