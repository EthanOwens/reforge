import { defaultResume } from './defaultResume'

function ResumeTool() {
  return (
    <div>
      <h1>Resume</h1>
      <p>
        {defaultResume.header.name} — {defaultResume.header.tagline}
      </p>
    </div>
  )
}

export default ResumeTool
