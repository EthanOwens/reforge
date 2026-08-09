import { useState } from 'react'
import AppShell from './AppShell'
import { loadAppSettings } from './settings/settingsStore'
import type { AppSettings } from './settings/settingsStore'
import './settings/SettingsModal.css'

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings())

  return (
    <div className="app">
      <AppShell appSettings={settings} onAppSettingsChange={setSettings} />
    </div>
  )
}

export default App
