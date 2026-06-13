package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sysmon-backend/internal/metrics"
)

type Handler struct {
	collector *metrics.Collector
}

func NewHandler(c *metrics.Collector) *Handler {
	return &Handler{collector: c}
}

func (h *Handler) HandleStats(w http.ResponseWriter, r *http.Request) {
	snap, err := h.collector.GetSystemSnapshot()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(snap)
}

func (h *Handler) HandleCPUHistory(w http.ResponseWriter, r *http.Request) {
	history := h.collector.GetHistory()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func (h *Handler) HandleProcesses(w http.ResponseWriter, r *http.Request) {
	procs, err := h.collector.GetTopProcesses()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(procs)
}

func (h *Handler) HandleKillProcess(w http.ResponseWriter, r *http.Request) {
	pidStr := r.URL.Query().Get("pid")
	if pidStr == "" {
		type killReq struct {
			PID int32 `json:"pid"`
		}
		var req killReq
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.PID > 0 {
			pidStr = strconv.Itoa(int(req.PID))
		}
	}

	if pidStr == "" {
		http.Error(w, "Parameter 'pid' is required", http.StatusBadRequest)
		return
	}

	pid, err := strconv.Atoi(pidStr)
	if err != nil {
		http.Error(w, "Invalid 'pid' parameter", http.StatusBadRequest)
		return
	}

	err = h.collector.KillProcess(int32(pid))
	if err != nil {
		http.Error(w, "Failed to terminate process: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true,"message":"Process terminated"}`))
}

func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}