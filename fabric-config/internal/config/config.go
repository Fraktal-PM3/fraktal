package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func LoadStack(basePath string) (*NetworkConfig, error) {
	stackFileData, err := os.ReadFile(filepath.Join(basePath, "stack.json"))
	if err != nil {
		return nil, err
	}
	config := &NetworkConfig{}

	if err := json.Unmarshal(stackFileData, config); err != nil {
		return nil, err
	}

	return config, nil
}

func WriteStack(config NetworkConfig) error {
	stackConfig, err := json.Marshal(config)
	if err != nil {
		return err
	}

	stackPath := filepath.Join(config.BasePath, "stack.json")
	if err := os.WriteFile(stackPath, stackConfig, 0o755); err != nil {
		return err
	}

	return nil
}
