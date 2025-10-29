package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/network"
	"github.com/spf13/cobra"
)

var addOrgOptions struct {
	count        int
	orgName      string
	orgDomain    string
	peerCount    int
	ordererCount int
}

var addOrgCmd = &cobra.Command{
	Use:   "add-org",
	Short: "Add organization to the network",
	Long: `Add one or more organizations to the existing Fabric network.

Each organization will be configured with:
  - It's own TLS certificates signed with the root org
  - Signed identities for peers and orderers if you add any.
	- Base admin identities`,
	RunE: func(cmd *cobra.Command, args []string) error {
		basePath := GetBasePath(cmd)

		// Ensure that basePath exists
		if _, err := os.Stat(basePath); os.IsNotExist(err) {
			return fmt.Errorf("the provided basepath does not exist : %w", err)
		}
		config, err := config.LoadStack(basePath)
		if err != nil {
			return err
		}
		net := network.Network{
			Config: config,
		}

		// Ensure that fabric root ca server is running

		ctx := context.Background()

		org := network.OrgDefinition{
			Name:       addOrgOptions.orgName,
			Domain:     addOrgOptions.orgDomain,
			Identifier: addOrgOptions.orgName + "ca",
		}

		if err := net.AddOrganization(ctx, net.Config.Orgs[0], org); err != nil {
			return fmt.Errorf("failed to add orderers: %w", err)
		}

		// TODO: ADD PEERS AND ORDERERS

		fmt.Printf("\n✓ Successfully added %d orgs(s)!\n", addOrdererOptions.count)

		return nil
	},
}

func init() {
	addOrgCmd.Flags().IntVar(&addOrgOptions.count, "count", 1, "number of orderers to add, default = 1")
	addOrgCmd.Flags().StringVarP(&addOrgOptions.orgName, "name", "n", "", "name of the org to add (*)")
	addOrgCmd.Flags().StringVarP(&addOrgOptions.orgDomain, "domain", "d", "", "domain of the org to add (*)")
	addOrgCmd.Flags().IntVar(&addOrgOptions.peerCount, "peers", 0, "number of peers to add, default = 0")
	addOrgCmd.Flags().IntVar(&addOrgOptions.ordererCount, "orderers", 0, "number of orderers to add, default = 0")
	addOrgCmd.MarkFlagRequired("name")
	addOrgCmd.MarkFlagRequired("domain")
	addOrgCmd.MarkFlagsRequiredTogether("name", "domain")
	rootCmd.AddCommand(addOrgCmd)
}
