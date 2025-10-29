package logger

import (
	"log/slog"
	"os"
	"sync"
)

var (
	// Global logger instance
	globalLogger *slog.Logger
	mu           sync.Mutex
)

// InitLogger initializes the global logger with the specified level and verbose flag
func InitLogger(verbose bool) {
	mu.Lock()
	defer mu.Unlock()

	var logLevel slog.Level
	if verbose {
		logLevel = slog.LevelDebug
	} else {
		logLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: logLevel,
	}

	handler := slog.NewTextHandler(os.Stdout, opts)
	globalLogger = slog.New(handler)
	slog.SetDefault(globalLogger)
}

// GetLogger returns the global logger instance
func GetLogger() *slog.Logger {
	if globalLogger == nil {
		// Initialize with default level if not yet initialized
		InitLogger(false)
	}
	return globalLogger
}

// Debug logs a debug message with attributes
func Debug(msg string, args ...any) {
	GetLogger().Debug(msg, args...)
}

// Info logs an info message with attributes
func Info(msg string, args ...any) {
	GetLogger().Info(msg, args...)
}

// Warn logs a warning message with attributes
func Warn(msg string, args ...any) {
	GetLogger().Warn(msg, args...)
}

// Error logs an error message with attributes
func Error(msg string, args ...any) {
	GetLogger().Error(msg, args...)
}

// DebugGroup logs a debug message with a group of attributes
func DebugGroup(msg string, groupName string, attrs ...any) {
	GetLogger().LogAttrs(nil, slog.LevelDebug, msg, slog.Group(groupName, attrs...))
}

// InfoGroup logs an info message with a group of attributes
func InfoGroup(msg string, groupName string, attrs ...any) {
	GetLogger().LogAttrs(nil, slog.LevelInfo, msg, slog.Group(groupName, attrs...))
}
