import type { Resume } from './types'
import StaticResumeView from './StaticResumeView'
import './ResumeThumbnail.css'

interface ResumeThumbnailProps {
  resume: Resume
}

// A live, scaled-down preview of a Resume for use inside grid tiles (schema
// and variation pickers). Renders the full-size StaticResumeView and shrinks
// it with a CSS transform, so the thumbnail is always in sync with the real
// resume data — no image generation or caching involved.
function ResumeThumbnail({ resume }: ResumeThumbnailProps) {
  return (
    <div className="resume-thumbnail">
      <div className="resume-thumbnail-scale">
        <StaticResumeView resume={resume} />
      </div>
    </div>
  )
}

export default ResumeThumbnail
