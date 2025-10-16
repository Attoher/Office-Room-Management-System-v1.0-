# Office Room Management System v1.0

Sistem manajemen ruangan kantor cerdas dengan fitur monitoring occupancy real-time dan algoritma pathfinding untuk optimasi jalur tamu.

![Office Room Management](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Node.js-16+-339933.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791.svg)

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
- **Algoritma BFS**: Cari jalur optimal menuju ruangan tujuan
- **Smart Decision Making**: Cek kapasitas sepanjang jalur
- **Visualisasi Graph**: Tampilan visual koneksi ruangan

### 🎨 Modern UI/UX
- **Responsive Design**: Optimal di desktop, tablet, dan mobile
- **Tailwind CSS**: Design system yang konsisten
- **Loading Animation**: Pengalaman loading yang smooth
- **Error Handling**: Notifikasi error yang informatif

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
  Backend :
    DB_URL=postgresql://user:pass@localhost:5432/office_rooms
    PORT=3000
    NODE_ENV=development

  Frontend :
    VITE_API_URL=http://localhost:3000/api

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

## 📁 Struktur Project

```
office-room-management/
├── 📂 backend/                 # Express.js API Server
│   ├── 📂 controllers/         # Business logic
│   ├── 📂 routes/             # API endpoints
│   ├── 📄 server.js           # Main server file
│   └── 📄 package.json
├── 📂 frontend/               # React.js Application
│   ├── 📂 src/
│   │   ├── 📂 components/     # React components
│   │   ├── 📂 services/       # API services
│   │   └── 📄 App.jsx         # Main component
│   └── 📄 package.json
├── 📂 database/               # Database scripts
│   ├── 📄 schema.sql          # Database schema
│   └── 📄 sample_data.sql     # Sample data
└── 📄 README.md
```

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - UI Library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client

### Development Tools
- **Postman** - API testing
- **pgAdmin** - Database management

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
| `POST` | `/rooms` | Create new room |
| `GET` | `/rooms/:id` | Get room by ID |
| `PUT` | `/rooms/:id` | Update room |
| `DELETE` | `/rooms/:id` | Delete room |
| `PUT` | `/rooms/:id/occupancy` | Update occupancy |

#### 🔗 Connections Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/connections` | Get all connections |
| `POST` | `/connections` | Create connection |
| `DELETE` | `/connections/:id` | Delete connection |

#### 🧭 Pathfinding
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pathfinding` | Find optimal path |

### Example Usage

```javascript
// Create room
const roomData = {
  nama_ruangan: "Meeting Room A",
  luas: 30.5,
  kapasitas_max: 15
};

// Update occupancy
const occupancyData = {
  occupancy: 10
};

// Pathfinding request
const pathfindingData = {
  tujuan: "Meeting Room A"
};
```

## 🎯 Cara Penggunaan

### 1. Tambah Ruangan
1. Buka tab **"Manajemen Data"**
2. Isi form "Tambah Ruangan Baru"
3. Klik "Tambah Ruangan"

### 2. Buat Koneksi
1. Di tab **"Manajemen Data"**, pilih "Manajemen Koneksi"
2. Pilih ruangan asal dan tujuan
3. Klik "Tambah Koneksi"

### 3. Monitoring Real-time
1. Buka tab **"Monitoring Ruangan"**
2. Pantau status warna setiap ruangan
3. Gunakan dropdown untuk ubah occupancy

### 4. Cek Jalur Tamu
1. Buka tab **"Cek Jalur Tamu"**
2. Pilih ruangan tujuan
3. Sistem akan tampilkan jalur optimal dan status kapasitas

## 🎨 UI Components

### Room Card
```jsx
<RoomCard 
  room={room}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onUpdateOccupancy={handleUpdate}
/>
```

### Status Indicator
- 🟢 **Hijau**: Occupancy < 70% - Aman
- 🟡 **Kuning**: Occupancy 70-90% - Hati-hati  
- 🔴 **Merah**: Occupancy ≥ 90% - Penuh

### Statistics Dashboard
- Total ruangan aktif
- Rata-rata occupancy
- Jumlah koneksi
- Breakdown status ruangan

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
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
    occupancy INTEGER DEFAULT 0
);

CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    room_from INTEGER REFERENCES rooms(id),
    room_to INTEGER REFERENCES rooms(id)
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

### Docker (Optional)

```dockerfile
# Dockerfile example
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

2. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

3. **CORS Errors**
   - Pastikan backend CORS configuration benar
   - Check environment variables

4. **Frontend-Backend Connection**
   ```bash
   # Test backend health
   curl http://localhost:3000/api/health
   ```

### Debug Mode

Aktifkan debug mode dengan environment variable:
```env
NODE_ENV=development
DEBUG=app:*
```

## 📝 Changelog

### v1.0.0
- ✅ CRUD operations untuk ruangan
- ✅ Graph connections management
- ✅ Real-time occupancy monitoring
- ✅ BFS pathfinding algorithm
- ✅ Responsive React.js frontend
- ✅ RESTful API dengan Express.js
