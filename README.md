# DoseMatch

**From SIG to shelf—perfect fills, every time.**

AI-accelerated NDC (National Drug Code) packaging and quantity calculator for pharmacy systems.

## Project Status

Phase 0: Foundation Setup - ✅ COMPLETE

## Quick Start

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- OpenAI API key

### Setup

1. **Install frontend dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Install functions dependencies:**

   ```bash
   cd functions
   npm install
   ```

3. **Configure environment:**

   - Copy `functions/.env.example` to `functions/.env`
   - Add your OpenAI API key

4. **Run development servers:**

   Terminal 1 (Frontend):

   ```bash
   cd frontend
   npm run dev
   ```

   Terminal 2 (Firebase Emulators):

   ```bash
   firebase emulators:start
   ```

## Project Structure

```
DoseMatch/
├── frontend/          # SvelteKit application
│   ├── src/
│   │   ├── lib/       # Core logic
│   │   │   ├── adapters/    # RxNorm, FDA API adapters
│   │   │   ├── sig/         # SIG parsing (rules + LLM)
│   │   │   ├── engines/     # Quantity & pack selection
│   │   │   └── cache/       # localStorage caching
│   │   ├── routes/    # Svelte pages
│   │   └── styles/    # Foundation Health theme
│   └── package.json
├── functions/         # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   └── parseSig.ts     # OpenAI SIG parsing
│   └── package.json
├── Docs/              # Documentation
└── memory-bank/       # Project memory files
```

## Tech Stack

- **Frontend:** SvelteKit, TypeScript, Tailwind CSS
- **Backend:** Firebase Cloud Functions (Node.js 18)
- **Hosting:** Firebase Hosting
- **APIs:** RxNorm, FDA NDC Directory, OpenAI GPT-4o-mini

## Development

- Frontend dev server: `http://localhost:5173`
- Firebase emulators: `http://localhost:4000` (UI)
- Functions emulator: `http://localhost:5001`

## Deployment

```bash
# Build frontend
cd frontend && npm run build

# Build functions
cd functions && npm run build

# Deploy to Firebase
firebase deploy
```

## License

MIT

---

Built for Foundation Health • Portfolio Project
