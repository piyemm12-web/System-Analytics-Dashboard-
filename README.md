# System Analytics Dashboard (`sysmon`)

[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](https://vitejs.dev)

A real-time, low-overhead system telemetry dashboard built to monitor, analyze, and visualize host infrastructure performance. The application couples a high-performance **Go** kernel with a responsive **React & TypeScript** frontend to deliver live hardware metrics, process distributions, and historical trends with minimal CPU footprint.

---

## Key Features

- **Real-Time Hardware Telemetry:**
  - **Multi-Core CPU:** Tracks overall usage, per-core utilization vectors, and 1m/5m/15m system load averages.
  - **Memory & Swap:** Real-time RAM breakdown (Total, Used, Free, Cache/Buffers) and Virtual Swap commit tracking.
  - **Storage & Disk Partitions:** Mount point discovery, capacity utilization, and storage percentages.
  - **Network I/O:** Aggregate ingress/egress bytes and transmitted/received packet counts.
  - **Hardware Thermal Sensors:** Motherboard and CPU thermal profiling with virtualization fallbacks.
- **Concurrent Live Process Manager:**
  - Profiles active host processes and ranks top resource consumers dynamically.
  - Client-side real-time filtering, fuzzy searching, and multi-column sorting (PID, Name, CPU%, Memory%).
  - Safe process termination interface with validation and OS kernel signal dispatch.
- **24-Hour Historical Trend Waveforms:**
  - Rolling time-series data pipeline maintaining 288 historical data points (5-minute intervals).
- **Custom SVG Vector Graphing Engine:**
  - Zero heavy third-party graphing library dependencies (no Chart.js or Recharts bundle bloat).
  - Mathematical SVG path generation with hardware-accelerated linear gradient fills running at 60 FPS.
- **Ultra-Lean Resource Overhead:**
  - Backend runs as a native compiled Go binary consuming **<15 MB RAM** and **<1% CPU**.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Host OS / Kernel      |
                      |  (Syscalls, PDH, /proc)     |
                      +--------------+--------------+
                                     |
                                     | (gopsutil low-level bindings)
                                     v
+-------------------------------------------------------------------------+
|                               GO BACKEND                                |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  | Hardware Metrics Ticker   |       | Concurrent Process Scanner    |  |
|  | (10s sampling cycle)      |       | (16-Worker Semaphore Pool)    |  |
|  +-------------+-------------+       +---------------+---------------+  |
|                |                                     |                  |
|                v                                     v                  |
|  +-------------------------------------------------------------------+  |
|  |      In-Memory Telemetry State (Guarded by sync.RWMutex)          |  |
|  +-----------------------------------+-------------------------------+  |
|                                      |                                  |
|                                      | (JSON REST Endpoints)            |
|                                      v                                  |
|  +-------------------------------------------------------------------+  |
|  | HTTP Router & Handlers (/api/stats, /api/processes, etc.)         |  |
|  +-------------------------------------------------------------------+  |
+--------------------------------------+----------------------------------+
                                       |
                                       | (HTTP / Proxy on :3000 -> :8080)
                                       v
+-------------------------------------------------------------------------+
|                      REACT + TYPESCRIPT FRONTEND                        |
|                                                                         |
|  - Custom useStats Hook (Polling & State Synchronization)               |
|  - High-Performance SVG Area Graph Renderer (M x,y L x,y Z)            |
|  - Responsive Dashboard Layout, Tab Navigation & Process Controls       |
+-------------------------------------------------------------------------+
```

---

## How Metrics Are Retrieved Under the Hood

The Go backend avoids running slow shell commands (like `top`, `ps`, or `tasklist`) which waste CPU by repeatedly spawning new processes. Instead, it reads directly from the OS kernel:

| Metric | Under Windows | Under Linux / Unix | Derivation Formula |
| :--- | :--- | :--- | :--- |
| **CPU Usage** | Windows Performance Data Helper (PDH) Counters & WMI | Reads `/proc/stat` CPU execution jiffies | $\text{Usage \%} = \left(1 - \frac{\Delta \text{Idle}}{\Delta \text{Total}}\right) \times 100$ |
| **RAM & Swap** | `GlobalMemoryStatusEx` Win32 API | Reads `/proc/meminfo` | $\text{Used RAM} = \text{Total} - (\text{Free} + \text{Buffers} + \text{Cached})$ |
| **Disks** | `GetLogicalDriveStringsW` & `GetDiskFreeSpaceExW` | `statvfs` syscall & `/proc/mounts` | $\text{Used Space} = \text{Total Blocks} - \text{Free Blocks}$ |
| **Network I/O** | `GetIfTable2` via IP Helper API (`IPHlpAPI.dll`) | Reads `/proc/net/dev` interface counters | Ingress/Egress Bytes & Total Packets |
| **Temperature**| WMI ACPI Thermal Zone (`MSAcpi_ThermalZoneTemperature`) | `/sys/class/thermal/` or `/sys/class/hwmon` | Converted from Kelvin/millidegrees to Celsius |
| **Processes** | `CreateToolhelp32Snapshot` & `OpenProcess` | Parses `/proc/[pid]/stat` & `/proc/[pid]/status` | CPU delta against system uptime delta |

---

## Tech Stack & Design Decisions

### Backend
- **Go (Golang):** Chosen over Python and Node.js for its native compiled execution, sub-15MB memory footprint, lack of a Global Interpreter Lock (GIL), and built-in concurrency primitives.
- **`sync.RWMutex`:** Protects shared telemetry state from data races. Permits unlimited concurrent read requests (`RLock`) while ensuring exclusive locks (`Lock`) only during brief metric writes.
- **Bounded Worker Pool:** Caps process inspection to 16 concurrent goroutines using a buffered channel semaphore (`chan struct{}, 16`), preventing OS thread thrashing.
- **Process Pointer Cache:** Retains in-memory process handles across scan intervals, minimizing Garbage Collection (GC) allocations.
- **Context Deadlines:** Wraps process batches in a 1500ms timeout context (`context.WithTimeout`) to drop hung system calls.

### Frontend
- **React 18 + TypeScript:** Strict typing for nested telemetry models (cores, partitions, network adapters), eliminating runtime undefined errors.
- **Vite with SWC:** Rust-based compilation enabling cold starts in under 300ms and instant Hot Module Replacement (HMR).
- **Custom SVG Graphs:** Eliminates 300KB+ of external chart libraries. Renders math-based vector curves with GPU hardware acceleration at 60 FPS.

---

## Project Structure

```text
sysmon/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # Server entrypoint, CORS middleware & routes
│   ├── internal/
│   │   ├── handler/
│   │   │   └── handler.go           # REST API endpoints & PID termination logic
│   │   ├── metrics/
│   │   │   └── collector.go         # Low-level OS telemetry kernel & worker pool
│   │   └── model/
│   │       └── stats.go             # Data models (CPU, RAM, Disks, Network, Processes)
│   ├── go.mod                       # Go module dependencies
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useStats.ts          # Telemetry polling & hook state manager
│   │   ├── types/                   # TypeScript interfaces matching backend models
│   │   ├── App.tsx                  # Main dashboard, tab navigation & custom SVG graphs
│   │   ├── main.tsx                 # React DOM mount point
│   │   ├── index.css                # Dark theme & responsive layout styles
│   │   └── utils.ts                 # Byte and uptime formatting utilities
│   ├── index.html                   # HTML host template
│   ├── package.json                 # Frontend dependencies & scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   └── vite.config.ts               # Vite configuration & /api reverse proxy
└── README.md                        # Project documentation
```

---

## API Reference

| Endpoint | Method | Description | Sample Output / Payload |
| :--- | :---: | :--- | :--- |
| `/health` | `GET` | Health check endpoint | `{"status":"healthy"}` |
| `/api/stats` | `GET` | Complete hardware snapshot (CPU, RAM, Disk, Net, Temp) | JSON `SystemSnapshot` object |
| `/api/cpu-history` | `GET` | Rolling 24-hour historical points | Array of `SystemHistoryPoint` (timestamp, CPU%, RAM%) |
| `/api/processes` | `GET` | Top 50 ranked processes by CPU consumption | Array of `ProcessInfo` (PID, Name, CPU%, Memory%) |
| `/api/processes/kill` | `POST` | Safely terminates a process by PID | Request: `{"pid": 1234}` $\rightarrow$ Response: `{"success":true}` |

---

## Getting Started

### Prerequisites
- **Go:** Version 1.22 or higher installed ([Download Go](https://golang.org/dl/))
- **Node.js:** Version 18.0 or higher installed ([Download Node.js](https://nodejs.org/))

---

### Step 1: Start the Backend (Go Server)

Open a terminal and navigate to the `backend` folder:

```powershell
cd backend
go run ./cmd/server/main.go
```

The telemetry kernel will start on port `8080`:
```text
🚀 Modular Telemetry Kernel online mapping infrastructure to port :8080
```

> **Verify backend:** Visit `http://localhost:8080/health` or `http://localhost:8080/api/stats` in your browser.

---

### Step 2: Start the Frontend (React + Vite)

Open a **second terminal** and navigate to the `frontend` folder:

```powershell
cd frontend
npm.cmd run dev
```

*(Note for Windows PowerShell: Use `npm.cmd run dev` to bypass PowerShell script execution restrictions).*

The Vite dev server will start on port `3000`:
```text
  VITE v5.2.11  ready in 280 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

### Step 3: Open the Dashboard

Navigate to **`http://localhost:3000`** in your browser.  
The Vite frontend proxies all `/api` requests directly to the Go backend on `http://localhost:8080`.

---

### Quick Start Shortcut (Windows PowerShell)

To launch both backend and frontend simultaneously in separate background windows:

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; go run ./cmd/server/main.go"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev"
```

---

## Production Build

To compile both services for production deployment:

### Backend Binary
```bash
cd backend
go build -ldflags="-s -w" -o sysmon-server.exe ./cmd/server/main.go
```

### Frontend Static Bundle
```bash
cd frontend
npm.cmd run build
```
Production assets are generated in `frontend/dist/` ready to be served via Nginx or embedded into the Go binary.
