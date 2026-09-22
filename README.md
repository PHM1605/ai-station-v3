## Installation
Install MongoDB
```sh
brew tap mongodb/brew
brew trust mongodb/brew
brew install mongodb-community
brew services start mongodb-community
brew install --cask mongodb-compass
```


```sh
npm create vite@latest . -- --template react
npm i tailwindcss @tailwindcss/vite
npm i @fortawesome/fontawesome-free
npm i konva react-konva
```

Setup Go server and DB
```sh 
go mod init github.com/PHM1605/ai-station-v3/server
get get github.com/gin-gonic/gin
go get github.com/joho/godotenv
go get github.com/gin-contrib/cors
go get github.com/golang-jwt/jwt/v5
```
Verify
```sh
brew services list 
mongosh --version
```
Open `Mongodb Compass`, enter connection string: `mongodb://127.0.0.1:27017`

In the place of our `go.mod` i.e. `MagicStreamMoviesServer` folder:
- Install Go web framework: `go get -u github.com/gin-gonic/gin`
- Install MongoDB Go driver: `go get go.mongodb.org/mongo-driver/v2/mongo`
- Install `dotenv`: `go get github.com/joho/godotenv`
- Install `Go Playground` (to validate Model - like `validate:required` tag): `go get github.com/go-playground/validator/v10`
- Install `bcrypt` to hass password: `go get golang.org/x/crypto/bcrypt`
- Install JWT library: `go get github.com/golang-jwt/jwt/v5`
- Install CORS: `go get github.com/gin-contrib/cors`

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