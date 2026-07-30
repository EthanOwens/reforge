# Reforge

A general-purpose, web-based tool for modifying files. Upload something, do something to it, get a new file back — without needing separate tools for each task.

## Planned functionality

- **Convert** — change a file from one format to another (e.g. document, image, or data formats).
- **Edit** — modify documents directly (started from an earlier resume-editing template experiment).
- Resume tool suite - In the modern day with ATS focused applications, the need to tailor your resume for each job is critical. I want to have the following functionality:
  - Upload templates based on .html document (or .txt with html formatting)
  - Ability to edit sections easily with clean formatting like the resume template detailed in the current project files
  - ability to save multiple variations of the same document/resume so tailoring many variations to the specific jobs is easy. These variations should be able to seamlessly swap between the versions in 1 webview. File should be tweaked based on the job title present, for instance (<firstName> <lastName> <fileType>- <jobTitle>.<fileFormat>) (EX: Ethan Owens Resume - Research Engineer)
  - Should be able to export the file as .pdf, .docx, .html, .txt (plaintext), or .md
  - Should be able to import any of those file types and will fill in the stylized doc in the webview with the respective information
  - (do this last) Should be able to pass in a link to an application or a job description + title and have tailored recommendations for how to modify the application, those changes should prompt the user for recommendations and let them pick and choose from those recommendations, then confirm the choices and have those auto applied to a new variation. 
- **Trim / restructure** — remove or reorder pages/sections from a file (e.g. dropping pages from a PDF).
- Add text to a gif
- Make a png background transparent
- **Extensible** — new file utilities get added over time as the need comes up; the tool isn't scoped to one file type or operation.

Reference for feature set and UI polish: [filesmith.io](https://filesmith.io/) — good example of clean formatting and a useful spread of file utilities in one place.

## Status

Scaffold only. This repo currently holds the bare minimum (`index.html`, `style.css`, `script.js`) to start from. Architecture, stack, and feature scope are being worked out via `/plan`.
