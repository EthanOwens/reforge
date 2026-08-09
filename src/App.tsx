import { useEffect, useState } from 'react'
import AppShell from './AppShell'
import { loadAppSettings } from './settings/settingsStore'
import type { AppSettings } from './settings/settingsStore'
import './settings/SettingsModal.css'
import './appTheme.css'

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings())

  useEffect(() => {
    document.documentElement.dataset.appTheme = settings.appTheme
  }, [settings.appTheme])

  return (
    <div className="app">
      <AppShell appSettings={settings} onAppSettingsChange={setSettings} />
    </div>
  )
}

export default App
