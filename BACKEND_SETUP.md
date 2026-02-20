# BACKEND SETUP - KOPERASI MERAH PUTIH

## 🚀 TECH STACK

- Node.js + Express + TypeScript
- PostgreSQL (pg library)
- CORS (untuk connect dengan React)
- dotenv (environment variables)

## 📁 STRUKTUR FOLDER

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Konfigurasi PostgreSQL
│   ├── controllers/
│   │   └── dusunController.ts   # Logic untuk dusun & RT
│   ├── routes/
│   │   └── dusunRoutes.ts       # API routes
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── server.ts                # Entry point
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── tsconfig.json
```

## 📦 INSTALL DEPENDENCIES

```bash
# Buat folder backend
mkdir backend
cd backend

# Init npm
npm init -y

# Install dependencies
npm install express pg cors dotenv
npm install -D typescript @types/express @types/node @types/pg @types/cors ts-node nodemon

# Init TypeScript
npx tsc --init
```

## ⚙️ KONFIGURASI

### **tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### **package.json** (tambahkan scripts)
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### **.env**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=koperasi_merah_putih
```

### **.gitignore**
```
node_modules/
dist/
.env
```

## 🔧 API ENDPOINTS

### **Dusun**
- `GET /api/dusun` - Get all dusun
- `GET /api/dusun/:id` - Get dusun by ID
- `POST /api/dusun` - Create dusun
- `PUT /api/dusun/:id` - Update dusun
- `DELETE /api/dusun/:id` - Delete dusun

### **RT**
- `GET /api/dusun/:dusunId/rt` - Get RT by dusun
- `POST /api/rt` - Create RT
- `PUT /api/rt/:id` - Update RT
- `DELETE /api/rt/:id` - Delete RT

## 🚀 RUN BACKEND

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Backend akan jalan di: http://localhost:5000
