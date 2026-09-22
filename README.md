## Installation
```sh
npm create vite@latest . -- --template react
npm i tailwindcss @tailwindcss/vite
npm i @fortawesome/fontawesome-free
npm i konva react-konva
```

Fix `vite.config.js`
```sh
import tailwindcss from '@tailwincss/vite'

plugins:[
  react(),
  tailwindcss(),
]
```

In `src/index.css`: `@import "tailwindcss";`
In `main.jsx`:
```sh
import '@fortawesome/font-awesome-free/css/all.min.css
```

To run: `npm run dev`