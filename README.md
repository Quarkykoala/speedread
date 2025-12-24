 # HyperRead AI

  HyperRead AI is a focused speed-reading workspace for technical papers. It combines RSVP reading, adaptive pacing,
  document mapping, synced PDF context, and Gemini-powered analysis so you can learn a paper fast without losing
  comprehension.

  ## Highlights

  - **RSVP reader** with adjustable speed (60-1000 WPM)
  - **Technical mode** that adapts pacing for equations, numbers, and dense terms
  - **Difficulty signal** to show when content is cognitively heavy
  - **Document map** that auto-detects headings, figures, and tables
  - **Figure sync** that jumps to referenced figures/tables as you read
  - **AI brief + chat** to summarize and answer questions about the paper
  - **PDF support** via `pdf.js` for text extraction and rendering

  ## Tech Stack

  - React 19 + TypeScript
  - Vite 6
  - Tailwind CSS (CDN)
  - PDF.js
  - Google Gemini (`@google/genai`)

  ## Getting Started

  ### Prerequisites

  - Node.js v18+
  - npm
  - Gemini API key

  ### Install

  ```bash
  npm install

  ### Configure Environment

  Create .env.local in the project root:

  GEMINI_API_KEY=your_api_key_here

  ### Run Locally

  npm run dev

  ### Build

  npm run build

  ## Usage

  1. Upload a PDF from the Upload tab.
  2. Use Map to skim headings and figures before reading.
  3. Press Play to start the RSVP reader.
  4. Switch Normal vs Technical mode based on content type.
  5. Use AI Brief to generate a summary or ask questions.
  6. Keep Doc View open to see the synced PDF page.

  ## Deployment (Render)

  - Build command: npm run build
  - Publish directory: dist
  - Environment variable: GEMINI_API_KEY

  ## Notes

  - The AI chat uses a truncated excerpt to stay within token limits.
  - Figure sync depends on explicit caption text like "Figure 2" or "Table 1".

  ## License

  MIT
