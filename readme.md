# Office Room Management System v1.0

Sistem manajemen ruangan kantor cerdas dengan fitur monitoring occupancy real-time dan algoritma pathfinding untuk optimasi jalur tamu.

![Office Room Management](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Node.js-16+-339933.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000.svg)

## 🚀 What's New in v1.0

### 🎯 Enhanced Architecture
- **Controller-based Architecture** - Better separation of concerns
- **Standardized API Responses** - Consistent response format across all endpoints
- **Enhanced Error Handling** - Comprehensive error management with detailed logging

### 🔧 Technical Improvements
- **Modular Route Management** - Organized route structure with dedicated route files
- **Advanced Pathfinding Algorithm** - Multiple route analysis with efficiency scoring
- **Real-time Capacity Monitoring** - Smart occupancy tracking with color-coded status

### 🎨 UI/UX Enhancements
- **Interactive Graph Visualization** - Drag-and-drop room network with path highlighting
- **Responsive Dashboard** - Mobile-friendly interface with comprehensive statistics
- **Smart Decision Making** - Route optimization based on occupancy and distance

## 🌟 Fitur Utama

### 📊 Real-time Monitoring
- **Sistem Warna Occupancy**: Hijau (<70%), Kuning (70-90%), Merah (≥90%)
- **Update Real-time**: Perubahan occupancy langsung terlihat
- **Dashboard Statistics**: Ringkasan kondisi ruangan keseluruhan

### 🏢 Manajemen Ruangan Lengkap (CRUD)
- **Tambah Ruangan**: Input nama, luas, kapasitas maksimum
- **Edit Data**: Update informasi ruangan kapan saja
- **Hapus Ruangan**: Hapus dengan konfirmasi
- **Atur Occupancy**: Dropdown praktis untuk jumlah orang

### 🗺️ Graph & Pathfinding
- **Koneksi Antar Ruangan**: Buat hubungan seperti graph
- **Algoritma BFS Enhanced**: Cari semua kemungkinan jalur dengan efisiensi scoring
- **Smart Decision Making**: Analisis kapasitas sepanjang jalur
- **Visualisasi Graph Interaktif**: Tampilan visual koneksi ruangan dengan drag & drop

### 🎨 Modern UI/UX
- **Responsive Design**: Optimal di desktop, tablet, dan mobile
- **Tailwind CSS**: Design system yang konsisten
- **Loading Animation**: Pengalaman loading yang smooth
- **Error Handling**: Notifikasi error yang informatif

## 🏗️ System Architecture

```
office-room-management/
├── 📂 frontend/                 # React.js Application
│   ├── 📂 src/
│   │   ├── 📂 components/       # React components
│   │   │   ├── RoomForm.jsx
│   │   │   ├── RoomList.jsx
│   │   │   ├── ConnectionForm.jsx
│   │   │   ├── ConnectionList.jsx
│   │   │   ├── PathfindingForm.jsx
│   │   │   ├── GraphVisualization.jsx
│   │   │   └── RoomEditModal.jsx
│   │   ├── 📂 services/         # API services
│   │   │   └── api.js
│   │   └── 📄 App.jsx
│   └── 📄 package.json
├── 📂 backend/                  # Express.js API Server
│   ├── 📂 controllers/          # Business logic
│   │   ├── roomController.js
│   │   ├── connectionController.js
│   │   └── pathfindingController.js
│   ├── 📂 routes/               # API endpoints
│   │   ├── roomRoutes.js
│   │   ├── connectionRoutes.js
│   │   └── pathfindingRoutes.js
│   ├── 📄 server.js             # Main server file
│   └── 📄 package.json
├── 📂 database/                 # Database scripts
│   ├── 📄 schema.sql            # Database schema
│   └── 📄 sample_data.sql       # Sample data
└── 📄 README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm atau yarn

### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd office-room-management
```

2. **Setup Database**
```bash
# Buat database
createdb office_rooms

# Import schema
psql office_rooms -f database/schema.sql

# Import sample data (optional)
psql office_rooms -f database/sample_data.sql
```

3. **Setup Backend**
```bash
cd backend
npm install

# Konfigurasi environment
cp .env.example .env
# Edit .env dengan kredensial database Anda

# Jalankan backend
npm run dev
```

4. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

5. **Akses Aplikasi**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 🏢 Rooms Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rooms` | Get all rooms |
| `GET` | `/rooms/stats` | Get room statistics |
| `GET` | `/rooms/:id` | Get room by ID |
| `POST` | `/rooms` | Create new room |
| `PUT` | `/rooms/:id` | Update room |
| `DELETE` | `/rooms/:id` | Delete room |
| `PUT` | `/rooms/:id/occupancy` | Update occupancy |

#### 🔗 Connections Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/connections` | Get all connections |
| `GET` | `/connections/debug` | Debug connections data |
| `GET` | `/connections/room/:roomId` | Get connections for specific room |
| `POST` | `/connections` | Create connection |
| `DELETE` | `/connections/:id` | Delete connection |

#### 🧭 Pathfinding & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pathfinding` | Find optimal path with efficiency analysis |
| `GET` | `/pathfinding/health` | Pathfinding service health check |
| `GET` | `/pathfinding/graph` | Get graph structure for visualization |
| `POST` | `/pathfinding/legacy` | Legacy pathfinding endpoint |

#### 🔧 System Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | API health check |
| `GET` | `/db-test` | Database connection test |
| `GET` | `/` | API documentation |

### Example API Usage

```javascript
// Create room
const roomData = {
  nama_ruangan: "Meeting Room A",
  luas: 30.5,
  kapasitas_max: 15,
  occupancy: 0
};

// Update occupancy
const occupancyData = {
  occupancy: 10
};

// Create connection
const connectionData = {
  room_from: 1,
  room_to: 2
};

// Pathfinding request
const pathfindingData = {
  tujuan: "Meeting Room A",
  start: 1
};
```

## 🎯 Cara Penggunaan

### 1. Tambah Ruangan
1. Buka tab **"Manajemen Data"**
2. Isi form "Tambah Ruangan Baru"
3. Klik "Tambah Ruangan"

### 2. Buat Koneksi
1. Di tab **"Manajemen Data"**, pilih "Manajemen Koneksi"
2. Pilih 2 ruangan untuk dihubungkan
3. Klik "Buat Koneksi"

### 3. Monitoring Real-time
1. Buka tab **"Monitoring Ruangan"**
2. Pantau status warna setiap ruangan
3. Gunakan dropdown atau tombol +/- untuk ubah occupancy

### 4. Cek Jalur Tamu
1. Buka tab **"Cek Jalur Tamu"**
2. Pilih ruangan asal dan tujuan
3. Sistem akan tampilkan jalur optimal dan analisis efisiensi

## 🔧 Advanced Features

### Pathfinding Algorithm
Sistem menggunakan enhanced BFS algorithm dengan:
- **Multiple Route Discovery**: Menemukan semua kemungkinan rute
- **Efficiency Scoring**: Skor berdasarkan panjang rute (40%) dan occupancy (60%)
- **Capacity Analysis**: Deteksi ruangan penuh di sepanjang jalur
- **Route Comparison**: Perbandingan semua rute dengan yang optimal

### Graph Visualization
- **Interactive Nodes**: Klik, drag, dan zoom nodes
- **Path Highlighting**: Jalur optimal ditandai dengan warna kuning
- **Room Status**: Warna node berdasarkan occupancy rate
- **Tooltip Information**: Detail ruangan pada hover

### Real-time Statistics
- Total ruangan aktif dan average occupancy
- Status breakdown (hijau, kuning, merah)
- Total koneksi dan graph connectivity

## 🛠️ Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/office_rooms
DB_URL=postgresql://username:password@localhost:5432/office_rooms
PORT=3000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

### Database Schema

```sql
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    nama_ruangan VARCHAR(100) NOT NULL UNIQUE,
    luas DECIMAL(10,2) NOT NULL,
    kapasitas_max INTEGER NOT NULL,
    occupancy INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    room_from INTEGER REFERENCES rooms(id),
    room_to INTEGER REFERENCES rooms(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

### Environment Setup for Production
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
PORT=3000
```

### Docker (Optional)

```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Test database connection
   psql -U postgres -h localhost -p 5432 -d office_rooms
   ```

2. **CORS Errors**
   - Pastikan frontend URL ada di allowedOrigins di server.js
   - Check environment variables

3. **Frontend-Backend Connection**
   ```bash
   # Test backend health
   curl http://localhost:3000/api/health
   ```

4. **Pathfinding Not Working**
   - Pastikan ada koneksi antara ruangan
   - Check console untuk debug information
   - Verifikasi nama ruangan match

### Debug Mode

Aktifkan debug mode dengan environment variable:
```env
NODE_ENV=development
```

## 📝 Changelog

### v1.0.0
- ✅ **Enhanced Controller Architecture** - Better code organization
- ✅ **Advanced Pathfinding Algorithm** - Multiple route analysis with efficiency scoring
- ✅ **Interactive Graph Visualization** - Drag-and-drop network visualization
- ✅ **Standardized API Responses** - Consistent response format
- ✅ **Comprehensive Error Handling** - Enhanced error management
- ✅ **Real-time Statistics Dashboard** - Advanced monitoring features
- ✅ **Responsive UI/UX** - Mobile-friendly interface
- ✅ **Production Ready** - Optimized for deployment
