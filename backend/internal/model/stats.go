package model

type CPUCoreStats struct {
	CoreID  int     `json:"coreId"`
	Percent float64 `json:"percent"`
}

type CPUStats struct {
	Overall   float64        `json:"overall"`
	Cores     []CPUCoreStats `json:"cores"`
	Load1Min  float64        `json:"load1m"`
	Load5Min  float64        `json:"load5m"`
	Load15Min float64        `json:"load15m"`
}

type MemoryStats struct {
	Total          uint64  `json:"total"`
	Used           uint64  `json:"used"`
	Free           uint64  `json:"free"`
	Percent        float64 `json:"percent"`
	SwapTotal      uint64  `json:"swapTotal"`
	SwapUsed       uint64  `json:"swapUsed"`
	SwapPercent    float64 `json:"swapPercent"`
}

type DiskPartitionStats struct {
	Device  string  `json:"device"`
	Mount   string  `json:"mount"`
	Total   uint64  `json:"total"`
	Used    uint64  `json:"used"`
	Percent float64 `json:"percent"`
}

type NetworkStats struct {
	BytesSent   uint64 `json:"bytesSent"`
	BytesRecv   uint64 `json:"bytesRecv"`
	PacketsSent uint64 `json:"packetsSent"`
	PacketsRecv uint64 `json:"packetsRecv"`
}

type ProcessInfo struct {
	PID           int32   `json:"pid"`
	Name          string  `json:"name"`
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryPercent float32 `json:"memoryPercent"`
}

type SystemHistoryPoint struct {
	Timestamp string  `json:"timestamp"`
	CPUUsage  float64 `json:"cpuUsage"`
	RAMUsage  float64 `json:"ramUsage"`
}

type SystemSnapshot struct {
	CPU         CPUStats             `json:"cpu"`
	Memory      MemoryStats          `json:"memory"`
	Disks       []DiskPartitionStats `json:"disks"`
	Network     NetworkStats         `json:"network"`
	Temperature float64              `json:"temperature"`
	Uptime      uint64               `json:"uptime"`
}