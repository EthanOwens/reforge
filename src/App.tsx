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

  useEffect(() => {
    document.documentElement.dataset.appLayout = settings.layoutMode
    const clampedBoxScale = Math.min(1, Math.max(0.6, settings.floatingBoxScale))
    document.documentElement.style.setProperty('--app-box-scale', String(clampedBoxScale))
  }, [settings.layoutMode, settings.floatingBoxScale])

  return (
    <div className="app">
      <AppShell appSettings={settings} onAppSettingsChange={setSettings} />
    </div>
  )
}

export default App
