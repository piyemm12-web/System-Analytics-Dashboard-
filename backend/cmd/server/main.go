package main

import (
	"log"
	"net/http"
	"sysmon-backend/internal/handler"
	"sysmon-backend/internal/metrics"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func main() {
	collector := metrics.NewCollector()
	h := handler.NewHandler(collector)

	http.HandleFunc("/api/stats", corsMiddleware(h.HandleStats))
	http.HandleFunc("/api/cpu-history", corsMiddleware(h.HandleCPUHistory))
	http.HandleFunc("/api/processes", corsMiddleware(h.HandleProcesses))
	http.HandleFunc("/api/processes/kill", corsMiddleware(h.HandleKillProcess))
	http.HandleFunc("/health", h.HandleHealth)

	log.Println("🚀 Modular Telemetry Kernel online mapping infrastructure to port :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server connection drop: %v", err)
	}
}