package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	// Global flags
	verbose  bool
	basePath string
	cfgFile  string
)

const (
	defaultBasePath    = "./network-config"
	defaultChannelName = "pm3"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "fabric-config",
	Short: "Hyperledger Fabric network configuration tool",
	Long: `Fabric Network Configuration Tool

A CLI tool for configuring and managing Hyperledger Fabric networks with
dynamic peer and orderer deployment. Inspired by fabric-samples/test-network.

Features:
  - Single root organization (Root CA) that signs all certificates
  - PM3 channel configuration similar to test-network
  - Variable number of peers and orderers
  - Complete Docker orchestration support
  - Automated configuration file generation`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() error {
	// Add persistent flags
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose log output")
	rootCmd.PersistentFlags().StringVar(&basePath, "base-path", defaultBasePath, "base path for network configuration")
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.fabric-config.yaml)")

	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error finding home directory: %v\n", err)
			os.Exit(1)
		}

		// Search config in home directory with name ".fabric-config" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigType("yaml")
		viper.SetConfigName(".fabric-config")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		if verbose {
			fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
		}
	}
}

// GetBasePath returns the configured base path
func GetBasePath(cmd *cobra.Command) string {
	if cmd.Flags().Changed("base-path") {
		path, err := cmd.Flags().GetString("base-path")
		if err != nil {
			// Fall back to package-level basePath if flag reading fails
			return basePath
		}
		return path
	}
	return basePath
}

// IsVerbose returns whether verbose logging is enabled
func IsVerbose() bool {
	return verbose
}
