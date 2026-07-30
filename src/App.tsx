import { useState } from 'react'
import ResumeTool from './tools/resume/ResumeTool'

// Each entry is a self-contained tool screen. Add new tools here as they're
// built, without teaching the shell anything about what a given tool does.
const screens = {
  resume: { label: 'Resume', component: ResumeTool },
} as const

type ScreenId = keyof typeof screens

function App() {
  const [activeScreen] = useState<ScreenId>('resume')

  const ActiveScreen = screens[activeScreen].component

  return (
    <div className="app">
      <ActiveScreen />
    </div>
  )
}

export default App
