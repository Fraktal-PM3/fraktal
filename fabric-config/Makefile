.PHONY: build clean test install run-example help

# Variables
BINARY_NAME=fabric-config
BUILD_DIR=build
NETWORK_DIR=./network

# Default target
all: build

# Build the binary
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/fabric-config
	@echo "✓ Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy
	@echo "✓ Dependencies installed"

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Clean build artifacts and network directory
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@echo "Cleaning network directory..."
	@rm -rf $(NETWORK_DIR)
	@echo "✓ Clean complete"

# Install the binary to GOPATH/bin
install: build
	@echo "Installing $(BINARY_NAME)..."
	@cp $(BUILD_DIR)/$(BINARY_NAME) $(GOPATH)/bin/
	@echo "✓ Installed to $(GOPATH)/bin/$(BINARY_NAME)"

# Run a simple example
run-example: build
	@echo "Running example network setup..."
	@$(BUILD_DIR)/$(BINARY_NAME) init --peers 2 --orderers 1 -v

# Run init only
init: build
	@echo "Initializing network..."
	@$(BUILD_DIR)/$(BINARY_NAME) init

# Add peers
add-peers: build
	@echo "Adding 2 peers..."
	@$(BUILD_DIR)/$(BINARY_NAME) add-peer --count 2

# Add orderers
add-orderers: build
	@echo "Adding 1 orderer..."
	@$(BUILD_DIR)/$(BINARY_NAME) add-orderer --count 1

# Create channel
create-channel: build
	@echo "Creating channel..."
	@$(BUILD_DIR)/$(BINARY_NAME) create-channel --channel pm3

# Show network summary
summary: build
	@$(BUILD_DIR)/$(BINARY_NAME) summary

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...
	@echo "✓ Code formatted"

# Run linter
lint:
	@echo "Running linter..."
	@golangci-lint run ./...

# Help target
help:
	@echo "Fabric Network Configuration Tool - Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build          Build the binary"
	@echo "  deps           Install dependencies"
	@echo "  test           Run tests"
	@echo "  clean          Clean build artifacts and network directory"
	@echo "  install        Install binary to GOPATH/bin"
	@echo "  run-example    Run a complete network setup example"
	@echo "  init           Initialize network with root org"
	@echo "  add-peers      Add peers to network"
	@echo "  add-orderers   Add orderers to network"
	@echo "  create-channel Create and join channel"
	@echo "  summary        Show network summary"
	@echo "  fmt            Format code"
	@echo "  lint           Run linter"
	@echo "  help           Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make build"
	@echo "  make run-example"
	@echo "  make clean && make build"
