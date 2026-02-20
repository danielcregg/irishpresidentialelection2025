# Irish Presidential Election 2025

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

An interactive Single Transferable Vote (STV) election simulator for the 2025 Irish Presidential Election, built with React, TypeScript, and Tailwind CSS.

**Live Demo:** [https://www.irishpresidentialelection2025.tech/](https://www.irishpresidentialelection2025.tech/)

## Overview

This zero-backend web application lets users explore how Ireland's STV voting system works in a presidential election context. Users can adjust first-preference votes, modify transfer preferences, set turnout levels, and watch the STV counting process determine a winner in real time. The app features candidate profiles, live odds, and a detailed round-by-round breakdown.

## Features

- **STV Simulation** -- full Single Transferable Vote counting with elimination rounds and transfers
- **Interactive Sliders** -- adjust first-preference percentages and transfer preferences dynamically
- **Candidate Profiles** -- view background, policies, and experience for each candidate
- **Live Odds Display** -- real-time implied probability based on current slider settings
- **Turnout Control** -- adjust voter turnout to see its impact on absolute vote counts
- **Lock Mechanism** -- lock individual candidate percentages while adjusting others
- **Responsive UI** -- mobile-friendly layout with Tailwind CSS
- **GitHub Pages Deployment** -- automated CI/CD via GitHub Actions

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/)

## Getting Started

### Installation

```bash
git clone https://github.com/danielcregg/irishpresidentialelection2025.git
cd irishpresidentialelection2025
npm install
```

### Usage

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Tech Stack

- **UI Library:** [React 18](https://react.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Build Tool:** [Vite 5](https://vitejs.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** GitHub Pages via GitHub Actions

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
