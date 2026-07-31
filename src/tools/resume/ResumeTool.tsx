import { useState } from 'react'
import { defaultResume } from './defaultResume'
import ResumePreview from './ResumePreview'
import type { Resume } from './types'

function ResumeTool() {
  const [resume, setResume] = useState<Resume>(defaultResume)

  return <ResumePreview resume={resume} onChange={setResume} />
}

export default ResumeTool
