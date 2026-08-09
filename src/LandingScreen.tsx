import './LandingScreen.css'

interface LandingScreenProps {
  onSelectResumeMaker: () => void
}

// Top-level entry point for the app: pick which tool to use. Currently only
// the resume maker is functional; other utilities are a visible placeholder
// for future tools.
function LandingScreen({ onSelectResumeMaker }: LandingScreenProps) {
  return (
    <div className="landing-screen">
      <h1 className="landing-title">Reforge</h1>
      <div className="landing-tiles">
        <button type="button" className="landing-tile" onClick={onSelectResumeMaker}>
          <span className="landing-tile-title">Resume Maker</span>
          <span className="landing-tile-desc">Build and tailor resume variations</span>
        </button>

        <button type="button" className="landing-tile" disabled aria-disabled="true">
          <span className="landing-tile-title">Other Utilities</span>
          <span className="landing-tile-desc">Coming soon</span>
        </button>
      </div>
    </div>
  )
}

export default LandingScreen
