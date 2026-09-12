# 3D Resume Portfolio

> An interactive 3D resume where you drive a car to explore different sections of my professional journey.

**Live Demo:** [mahammadali.me](https://mahammadali.me)

---

## Overview

This is a gamified 3D resume built with Three.js. Instead of scrolling through a traditional resume, visitors drive a car around a 3D world, visiting interactive sections that showcase profile, education, experience, projects, and skills. Each section features floating 3D models and opens detailed info panels on interaction.

## Features

- **3D Interactive World** — Drive freely across a stylized environment with physics-based car movement
- **5 Resume Sections** — Profile, Education, Experience, Projects, and Skills, each with unique 3D models and colors
- **Projects World** — A dedicated area with animated garages that open to reveal project artifacts and trophy plaques
- **Dual Controls** — WASD keyboard controls on desktop, circular joystick on mobile
- **Car Physics** — Acceleration, braking, drifting with handbrake, momentum, and collision detection
- **Visual Effects** — Dust particles, drift trails, floating objects, and camera shake
- **Sound Effects** — Engine sounds with fade-out, interaction feedback
- **Responsive Design** — Auto-detects mobile devices and adjusts UI/controls accordingly
- **Downloadable Resume** — PDF download button in the info panel

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Three.js](https://threejs.org/) | 3D rendering engine |
| JavaScript ES6 Modules | Application logic |
| HTML5 | Structure |
| CSS3 | Styling and animations |

No build tools required — runs directly in the browser via ES6 import maps.

## Project Structure

```
Portfolio/
├── index.html              # Entry point
├── css/
│   └── styles.css          # All styles
├── js/
│   ├── main.js             # Application bootstrap
│   ├── config.js           # Configuration constants
│   ├── scene.js            # Three.js scene setup
│   ├── car.js              # Car model & physics
│   ├── controls.js         # Desktop & mobile input
│   ├── ui.js               # UI panels & HUD
│   ├── effects.js          # Particles & visual effects
│   ├── sound.js            # Audio management
│   ├── sections.js         # Resume section data
│   ├── projects.js         # Project data
│   └── projectsWorld.js    # Projects World manager
├── assets/
│   ├── models/             # 3D models (.glb)
│   ├── sound/              # Audio files
│   ├── profile.jpg         # Profile photo
│   └── resume.pdf          # Downloadable resume
├── CNAME                   # Custom domain
└── README.md
```

## Controls

### Desktop
| Key | Action |
|-----|--------|
| W / ↑ | Accelerate forward |
| S / ↓ | Reverse |
| A / ← | Steer left |
| D / → | Steer right |
| Space | Handbrake (drift) |
| F | Interact with section / garage |

### Mobile
| Gesture | Action |
|---------|--------|
| Drag circle | Steer & accelerate |
| F button | Interact |

## Sections

| Section | 3D Model | Color |
|---------|----------|-------|
| Profile | SWAT | `#ff7251` |
| Education | Book | `#9b2948` |
| Experience | Briefcase | `#ffca7b` |
| Projects | Mech | `#ffcd74` |
| Skills | Tank | `#ffedbf` |

## Projects World

The Projects section contains a dedicated 3D area with:
- **Garages** — Animated doors that open when approached, revealing 3D artifacts (server racks, API nodes, database cores)
- **Trophy Plaques** — Key metrics displayed on garage walls
- **Exit Portal** — Teleport back to the main world

## Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local HTTP server (ES6 modules require one)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Mahammadali12/Portfolio.git
cd Portfolio

# Start a local server (choose one)
python -m http.server 8000
# or
npx serve .
# or
npx http-server .

# Open in browser
open http://localhost:8000
```

### Deploy to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages**
3. Select source branch (`main`)
4. Site will be live at `https://mahammadali.me`

## Browser Support

- Chrome 80+
- Firefox 78+
- Safari 14+
- Edge 80+

Requires ES6 module support and WebGL.

## License

MIT

## Author

**Mahammadali Zamani**
- Website: [mahammadali.me](https://mahammadali.me)
- GitHub: [Mahammadali12](https://github.com/Mahammadali12)
