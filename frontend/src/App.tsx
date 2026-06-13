import { useState } from 'react';
import { useStats } from './hooks/useStats';
import { formatBytes, formatUptime } from './utils';

type TabType = 'overview' | 'cpu' | 'ram' | 'partitions' | 'network' | 'tasks';

export default function App() {
  const { snapshot, history, processes, loading, error } = useStats();
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [sortKey, setSortKey] = useState<'pid' | 'name' | 'cpuPercent' | 'memoryPercent'>('cpuPercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (key: 'pid' | 'name' | 'cpuPercent' | 'memoryPercent') => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="laptop-shell">
        <div className="laptop-screen">
          <div className="browser-window">
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="laptop-shell">
        <div className="laptop-screen">
          <div className="browser-window">
            <div className="error-fallback">
              <h3>🚨 TELEMETRY BRIDGE DISRUPTED</h3>
              <p>{error || "Fatal connection loss: Host bridge offline."}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  const avgDiskPercent = snapshot.disks && snapshot.disks.length > 0
    ? snapshot.disks.reduce((acc, d) => acc + d.percent, 0) / snapshot.disks.length
    : 0;

  
  const filteredProcesses = processes.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  
  const renderHistoryChart = () => {
    if (history.length < 2) return <div className="no-data">Buffering metric vectors...</div>;
    const width = 1000;
    const height = 140;
    const maxIndex = history.length - 1;
    
    const points = history.map((pt, i) => {
      const x = (i / maxIndex) * width;
      const y = height - (pt.cpuUsage / 100) * (height - 20) - 10;
      return `${x},${y}`;
    });

    const pathData = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
    const lineData = `M ${points.join(' L ')}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="history-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.00"/>
          </linearGradient>
        </defs>
        <path d={pathData} fill="url(#curveGrad)" />
        <path d={lineData} fill="none" stroke="#10b981" strokeWidth="2.5" />
      </svg>
    );
  };

  
  const getDisplayUrl = () => {
    switch (currentTab) {
      case 'overview': return 'https://sysmon.local/dashboard';
      case 'cpu': return 'https://sysmon.local/cpu-core';
      case 'ram': return 'https://sysmon.local/ram-space';
      case 'partitions': return 'https://sysmon.local/partitions';
      case 'network': return 'https://sysmon.local/network-io';
      case 'tasks': return 'https://sysmon.local/tasks';
      default: return 'https://sysmon.local/dashboard';
    }
  };

  return (
    <div className="laptop-shell">
      <div className="laptop-screen">
        <div className="browser-window">
          
          {/* Browser Header Section */}
          <header className="browser-titlebar">
            <div className="window-controls">
              <span className="dot dot-close"></span>
              <span className="dot dot-min"></span>
              <span className="dot dot-max"></span>
            </div>
            
            <nav className="browser-tabs">
              <button 
                className={`browser-tab ${currentTab === 'overview' ? 'active' : ''}`}
                onClick={() => setCurrentTab('overview')}
              >
                <span className="tab-icon">📊</span> Overview
              </button>
              <button 
                className={`browser-tab ${currentTab === 'cpu' ? 'active' : ''}`}
                onClick={() => setCurrentTab('cpu')}
              >
                <span className="tab-icon">🧠</span> CPU Core
              </button>
              <button 
                className={`browser-tab ${currentTab === 'ram' ? 'active' : ''}`}
                onClick={() => setCurrentTab('ram')}
              >
                <span className="tab-icon">💾</span> RAM Space
              </button>
              <button 
                className={`browser-tab ${currentTab === 'partitions' ? 'active' : ''}`}
                onClick={() => setCurrentTab('partitions')}
              >
                <span className="tab-icon">🗂️</span> Partitions
              </button>
              <button 
                className={`browser-tab ${currentTab === 'network' ? 'active' : ''}`}
                onClick={() => setCurrentTab('network')}
              >
                <span className="tab-icon">🌐</span> Network IO
              </button>
              <button 
                className={`browser-tab ${currentTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setCurrentTab('tasks')}
              >
                <span className="tab-icon">⚙️</span> Tasks
              </button>
            </nav>

            <div className="browser-status">
              <span className="status-temp">CPU Temp: {snapshot.temperature.toFixed(1)}°C</span>
              <span className="status-live">
                <span className="status-live-dot"></span> Live Telemetry
              </span>
            </div>
          </header>

          {/* Browser Address bar */}
          <div className="browser-addressbar">
            <div className="address-input-wrapper">
              <span className="lock-icon">🔒</span>
              <span className="address-url">{getDisplayUrl()}</span>
            </div>
            <div className="system-uptime">
              Uptime: {formatUptime(snapshot.uptime)}
            </div>
          </div>

          {/* Page content window viewport */}
          <main className="window-content">
            
            {/* VIEW 1: OVERVIEW */}
            {currentTab === 'overview' && (
              <div className="tab-panel">
                <div className="sysmon-header">
                  <h1>SysMon Dashboard</h1>
                  <p>Aggregated hardware metrics, network latency, and activity baseline.</p>
                </div>

                <div className="metrics-grid">
                  {/* Card 1: CPU Core Load */}
                  <div className="card">
                    <div className="card-title">CPU Core Load</div>
                    <div className="card-value">{snapshot.cpu.overall.toFixed(1)} %</div>
                    <div className="meter-track">
                      <div className="meter-fill fill-cpu" style={{ width: `${snapshot.cpu.overall}%` }}></div>
                    </div>
                    <div className="card-subtext">
                      Load: {snapshot.cpu.load1m.toFixed(2)} / {snapshot.cpu.load5m.toFixed(2)} / {snapshot.cpu.load15m.toFixed(2)}
                    </div>
                  </div>

                  {/* Card 2: RAM Saturation */}
                  <div className="card">
                    <div className="card-title">RAM Saturation</div>
                    <div className="card-value">{snapshot.memory.percent.toFixed(1)} %</div>
                    <div className="meter-track">
                      <div className="meter-fill fill-ram" style={{ width: `${snapshot.memory.percent}%` }}></div>
                    </div>
                    <div className="card-subtext">
                      Used: {formatBytes(snapshot.memory.used)} / {formatBytes(snapshot.memory.total)}
                    </div>
                  </div>

                  {/* Card 3: Storage Volume */}
                  <div className="card">
                    <div className="card-title">Storage Volume</div>
                    <div className="card-value">{avgDiskPercent.toFixed(1)} %</div>
                    <div className="meter-track">
                      <div className="meter-fill fill-disk" style={{ width: `${avgDiskPercent}%` }}></div>
                    </div>
                    <div className="card-subtext">
                      Partitions: {snapshot.disks?.length || 0} active
                    </div>
                  </div>

                  {/* Card 4: Network Outbound */}
                  <div className="card">
                    <div className="card-title">Network Outbound</div>
                    <div className="card-value">{formatBytes(snapshot.network.bytesSent)}</div>
                    <div className="meter-track">
                      <div className="meter-fill fill-net" style={{ width: '35%' }}></div>
                    </div>
                    <div className="card-subtext">
                      TX: {snapshot.network.packetsSent.toLocaleString()} packets
                    </div>
                  </div>
                </div>

                {/* SVG Chart Section */}
                <div className="card chart-card">
                  <div className="card-title">PROCESSOR ACTIVITY BASELINE (CONTINUOUS 10S SAMPLING)</div>
                  <div className="chart-container">
                    {renderHistoryChart()}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: CPU CORE DETAIL */}
            {currentTab === 'cpu' && (
              <div className="tab-panel">
                <div className="sysmon-header">
                  <h1>CPU Core Performance</h1>
                  <p>Individual logical core utilization graphs and task scheduling averages.</p>
                </div>

                <div className="card">
                  <div className="card-title">Cores Utilization Matrix</div>
                  <div className="cores-grid">
                    {snapshot.cpu.cores?.map((core) => (
                      <div key={core.coreId} className="core-cell">
                        <span className="core-lbl">C{core.coreId}</span>
                        <div className="core-bar-track">
                          <div className="core-bar-fill" style={{ height: `${core.percent}%` }}></div>
                        </div>
                        <span className="core-pct">{Math.round(core.percent)}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="load-averages-layout">
                    <div className="load-avg-item">
                      <p>Load 1m</p>
                      <strong>{snapshot.cpu.load1m.toFixed(2)}</strong>
                    </div>
                    <div className="load-avg-item">
                      <p>Load 5m</p>
                      <strong>{snapshot.cpu.load5m.toFixed(2)}</strong>
                    </div>
                    <div className="load-avg-item">
                      <p>Load 15m</p>
                      <strong>{snapshot.cpu.load15m.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: RAM SPACE */}
            {currentTab === 'ram' && (
              <div className="tab-panel">
                <div className="sysmon-header">
                  <h1>Volatile RAM Memory</h1>
                  <p>Installed hardware memory space breakdown and virtual swap mapping.</p>
                </div>

                <div className="card ram-layout">
                  <div className="ram-row">
                    <div className="ram-meta">
                      <span className="card-title" style={{ marginBottom: 0 }}>Active System RAM</span>
                      <span className="ram-bytes">{formatBytes(snapshot.memory.used)} used / {formatBytes(snapshot.memory.total)}</span>
                    </div>
                    <div className="ram-pct">{snapshot.memory.percent.toFixed(1)} %</div>
                    <div className="meter-track" style={{ height: '6px', marginTop: '10px' }}>
                      <div className="meter-fill fill-ram" style={{ width: `${snapshot.memory.percent}%` }}></div>
                    </div>
                  </div>

                  <div className="ram-row">
                    <div className="ram-meta">
                      <span className="card-title" style={{ marginBottom: 0 }}>Virtual Swap Page</span>
                      <span className="ram-bytes">{formatBytes(snapshot.memory.swapUsed)} used / {formatBytes(snapshot.memory.swapTotal)}</span>
                    </div>
                    <div className="ram-pct">{snapshot.memory.swapPercent.toFixed(1)} %</div>
                    <div className="meter-track" style={{ height: '6px', marginTop: '10px' }}>
                      <div className="meter-fill fill-swap" style={{ width: `${snapshot.memory.swapPercent}%`, background: 'var(--color-purple)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: PARTITIONS */}
            {currentTab === 'partitions' && (
              <div className="tab-panel">
                <div className="sysmon-header">
                  <h1>Active Storage Partitions</h1>
                  <p>Local filesystem mounts, partition details, and capacity analysis.</p>
                </div>

                <div className="card disks-stack">
                  {snapshot.disks?.map((disk, idx) => (
                    <div key={idx} className="disk-row">
                      <div className="disk-meta">
                        <span className="disk-mount">{disk.mount} ({disk.device})</span>
                        <span className="disk-percent">{disk.percent.toFixed(1)}%</span>
                      </div>
                      <div className="meter-track">
                        <div className="meter-fill fill-disk" style={{ width: `${disk.percent}%` }}></div>
                      </div>
                      <p className="disk-bytes">{formatBytes(disk.used)} used out of {formatBytes(disk.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 5: NETWORK IO */}
            {currentTab === 'network' && (
              <div className="tab-panel">
                <div className="sysmon-header">
                  <h1>Network Interface Link</h1>
                  <p>Inbound and outbound data interface bandwidth indicators.</p>
                </div>

                <div className="net-grid">
                  <div className="net-card">
                    <span className="net-lbl">Total Bytes Sent</span>
                    <span className="net-val" style={{ color: 'var(--color-green)' }}>🔺 {formatBytes(snapshot.network.bytesSent)}</span>
                  </div>

                  <div className="net-card">
                    <span className="net-lbl">Total Bytes Received</span>
                    <span className="net-val" style={{ color: 'var(--color-cyan)' }}>🔻 {formatBytes(snapshot.network.bytesRecv)}</span>
                  </div>
                </div>

                <div className="net-counters">
                  <span className="card-title">Network Packet Matrix: </span>
                  <span className="mono bold">TX: {snapshot.network.packetsSent.toLocaleString()} packets / RX: {snapshot.network.packetsRecv.toLocaleString()} packets</span>
                </div>
              </div>
            )}

            {/* VIEW 6: TASKS */}
            {currentTab === 'tasks' && (
              <div className="tab-panel">
                <div className="sysmon-header">
                  <h1>Active Scheduling Tasks</h1>
                  <p>List of currently running thread tasks sorted by resource metrics.</p>
                </div>

                <div className="tasks-control-bar">
                  <div className="search-wrapper">
                    <span className="search-ico">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Filter processes..." 
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="tasks-stats">
                    Active Tasks: <strong>{filteredProcesses.length}</strong>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('pid')}>PID {sortKey === 'pid' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('name')}>Image Name {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('cpuPercent')}>CPU Usage {sortKey === 'cpuPercent' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th onClick={() => handleSort('memoryPercent')}>Memory Usage {sortKey === 'memoryPercent' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProcesses.map((proc) => (
                        <tr key={proc.pid}>
                          <td className="mono">{proc.pid}</td>
                          <td className="bold text-accent">{proc.name}</td>
                          <td className="mono text-warn">{proc.cpuPercent.toFixed(2)}%</td>
                          <td className="mono">{proc.memoryPercent.toFixed(2)}%</td>
                          <td>
                            <button 
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '9px',
                                fontWeight: '600'
                              }}
                              onClick={() => triggerToast(`⚠️ DISPATCHED SIGKILL SIGNAL TO PID ${proc.pid} [${proc.name}]`)}
                            >
                              Kill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Toast popup */}
      {toast && (
        <div className="toast-notif">
          <span>🔔</span>
          <span className="mono">{toast}</span>
        </div>
      )}
    </div>
  );
}
