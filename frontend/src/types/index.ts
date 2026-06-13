export interface CPUCoreStats {
  coreId: number;
  percent: number;
}

export interface CPUStats {
  overall: number;
  cores: CPUCoreStats[];
  load1m: number;
  load5m: number;
  load15m: number;
}

export interface MemoryStats {
  total: number;
  used: number;
  free: number;
  percent: number;
  swapTotal: number;
  swapUsed: number;
  swapPercent: number;
}

export interface DiskPartitionStats {
  device: string;
  mount: string;
  total: number;
  used: number;
  percent: number;
}

export interface NetworkStats {
  bytesSent: number;
  bytesRecv: number;
  packetsSent: number;
  packetsRecv: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryPercent: number;
}

export interface CPUHistoryPoint {
  timestamp: string;
  cpuUsage: number;
  ramUsage: number;
}

export interface SystemSnapshot {
  cpu: CPUStats;
  memory: MemoryStats;
  disks: DiskPartitionStats[];
  network: NetworkStats;
  temperature: number;
  uptime: number;
}