package ca

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/ltu/fraktal/fabric-config/internal/config"
	"github.com/ltu/fraktal/fabric-config/internal/utils"
	"gopkg.in/yaml.v2"
)

// CAServer represents a Fabric CA server configuration yaml configuration
type CAServer struct {
	Version      string                 `yaml:"version"`
	Port         int                    `yaml:"port"`
	Debug        bool                   `yaml:"debug"`
	TLS          TLSConfig              `yaml:"tls"`
	CA           CASection              `yaml:"ca"`
	Operations   Operations             `yaml:"operations"`
	CSR          CSRSection             `yaml:"csr"`
	CLR          CLRSection             `yaml:"clr"`
	Registry     RegistrySection        `yaml:"registry"`
	DB           DBSection              `yaml:"db"`
	Affiliations map[string]interface{} `yaml:"affiliations"`
	Signing      SigningSection         `yaml:"signing"`
}

type Operations struct {
	ListenAddress int `yaml:"listenAddress,omitempty"`
}

// TLSConfig represents TLS configuration
type TLSConfig struct {
	Enabled    bool             `yaml:"enabled"`
	CertFile   string           `yaml:"certfile,omitempty"`
	KeyFile    string           `yaml:"keyfile,omitempty"`
	ClientAuth ClientAuthConfig `yaml:"clientauth,omitempty"`
}

// ClientAuthConfig represents client authentication configuration
type ClientAuthConfig struct {
	Type      string   `yaml:"type"`
	CertFiles []string `yaml:"certfiles,omitempty"`
}

// CASection represents the CA section of the config
type CASection struct {
	Name      string `yaml:"name"`
	KeyFile   string `yaml:"keyfile,omitempty"`
	CertFile  string `yaml:"certfile,omitempty"`
	ChainFile string `yaml:"chainfile,omitempty"`
}

// CSRSection represents the Certificate Signing Request configuration
type CSRSection struct {
	CN    string      `yaml:"cn"`
	Names []NameField `yaml:"names"`
	Hosts []string    `yaml:"hosts"`
	CA    CSRCAField  `yaml:"ca"`
}

// CLRSection represents configuration for genclr request processing
type CLRSection struct {
	expiry string `yaml:"expiry"`
}

// NameField represents a name field in the CSR
type NameField struct {
	C  string `yaml:"C,omitempty"`
	ST string `yaml:"ST,omitempty"`
	L  string `yaml:"L,omitempty"`
	O  string `yaml:"O,omitempty"`
	OU string `yaml:"OU,omitempty"`
}

// CSRCAField represents CA-specific CSR fields
type CSRCAField struct {
	Expiry     string `yaml:"expiry"`
	PathLength int    `yaml:"pathlength"`
}

// RegistrySection represents the registry configuration
type RegistrySection struct {
	MaxEnrollments int             `yaml:"maxenrollments"`
	Identities     []IdentityField `yaml:"identities"`
}

// IdentityField represents an identity in the registry
type IdentityField struct {
	Name           string            `yaml:"name"`
	Pass           string            `yaml:"pass"`
	Type           string            `yaml:"type"`
	Affiliation    string            `yaml:"affiliation"`
	Attrs          map[string]string `yaml:"attrs,omitempty"`
	MaxEnrollments int               `yaml:"maxenrollments,omitempty"`
}

// DBSection represents database configuration
type DBSection struct {
	Type       string    `yaml:"type"`
	DataSource string    `yaml:"datasource"`
	TLS        TLSConfig `yaml:"tls"`
}

// SigningSection represents signing configuration
type SigningSection struct {
	Default  *SigningProfile            `yaml:"default"`
	Profiles map[string]*SigningProfile `yaml:"profiles"`
}

// SigningProfile represents a signing profile
type SigningProfile struct {
	Usage        []string           `yaml:"usage"`
	Expiry       string             `yaml:"expiry"`
	CAConstraint *CAConstraintField `yaml:"caconstraint,omitempty"`
}

// CAConstraintField represents CA constraints
type CAConstraintField struct {
	IsCA           bool `yaml:"isca"`
	MaxPathLen     int  `yaml:"maxpathlen,omitempty"`
	MaxPathLenZero bool `yaml:"maxpathlenzero,omitempty"`
}

type EnrollConfig struct {
	Name         string
	Password     string
	CertPath     string
	KeyStorePath string
}

func (ca *CAServer) NewCAConfig(caType config.CAType, name string, path string, domain string) *config.Organization {
	org := &config.Organization{
		Name:   name,
		Domain: domain,
		MSPID:  ca.CA.Name,
		Type:   caType,
		Path:   path,
		CA: &config.CAConfig{
			Name:         ca.CA.Name,
			Host:         "localhost", // WARNING: Change this if you are expecting to connect to the server from outside localhost!
			Port:         ca.Port,
			TLSEnabled:   ca.TLS.Enabled,
			DBDriver:     ca.DB.Type,
			DBDataSource: ca.DB.DataSource,
		},
	}

	if ca.Operations.ListenAddress > 0 {
		org.Operations = &config.OperationsConfig{
			ListenAddress: ca.Operations.ListenAddress,
		}
	}

	if ca.CSR.CN != "" {
		org.CA.CSR = &config.CSRConfig{
			CN:    ca.CSR.CN,
			Hosts: ca.CSR.Hosts,
		}

		if len(ca.CSR.Names) > 0 {
			org.CA.CSR.Names = make([]config.Name, len(ca.CSR.Names))
			for i, name := range ca.CSR.Names {
				org.CA.CSR.Names[i] = config.Name{
					C:  name.C,
					ST: name.ST,
					L:  name.L,
					O:  name.O,
					OU: name.OU,
				}
			}
		}

		org.CA.CSR.CA = &config.CSRCAConfig{
			Expiry:     ca.CSR.CA.Expiry,
			PathLength: ca.CSR.CA.PathLength,
		}
	}

	if ca.CLR.expiry != "" {
		org.CA.CLR = &config.CLRConfig{
			Expiry: ca.CLR.expiry,
		}
	}

	if ca.Signing.Profiles != nil {
		org.CA.SigningProfiles = make(map[string]*config.SigningProfile)
		for name, profile := range ca.Signing.Profiles {
			if profile == nil {
				continue
			}
			orgProfile := &config.SigningProfile{
				Usage:        profile.Usage,
				ExpiryString: profile.Expiry,
			}
			if profile.CAConstraint != nil {
				orgProfile.CAConstraint = &config.CAConstraint{
					IsCA:           profile.CAConstraint.IsCA,
					MaxPathLen:     profile.CAConstraint.MaxPathLen,
					MaxPathLenZero: profile.CAConstraint.MaxPathLenZero,
				}
			}
			org.CA.SigningProfiles[name] = orgProfile
		}
	}

	if ca.Affiliations != nil {
		org.CA.Affiliations = make(map[string][]string)
		for key, value := range ca.Affiliations {
			if valueMap, ok := value.(map[interface{}]interface{}); ok {
				affiliations := make([]string, 0, len(valueMap))
				for affKey := range valueMap {
					if strKey, ok := affKey.(string); ok {
						affiliations = append(affiliations, strKey)
					}
				}
				org.CA.Affiliations[key] = affiliations
			} else if valueMap, ok := value.(map[string]interface{}); ok {
				affiliations := make([]string, 0, len(valueMap))
				for affKey := range valueMap {
					affiliations = append(affiliations, affKey)
				}
				org.CA.Affiliations[key] = affiliations
			}
		}
	}

	if len(ca.Registry.Identities) > 0 {
		admin := ca.Registry.Identities[0]
		org.CA.AdminUser = admin.Name
		org.CA.AdminPassword = admin.Pass
		org.Admin = &config.Identity{
			Name:           admin.Name,
			Type:           admin.Type,
			Affiliation:    admin.Affiliation,
			Attributes:     admin.Attrs,
			MaxEnrollments: admin.MaxEnrollments,
		}

		if len(ca.Registry.Identities) > 1 {
			org.Users = make([]*config.Identity, len(ca.Registry.Identities)-1)
			for i, identity := range ca.Registry.Identities[1:] {
				org.Users[i] = &config.Identity{
					Name:           identity.Name,
					Type:           identity.Type,
					Affiliation:    identity.Affiliation,
					Attributes:     identity.Attrs,
					MaxEnrollments: identity.MaxEnrollments,
				}
			}
		}
	}

	return org
}

// WriteConfig writes the CA configuration to a file
func (ca *CAServer) WriteConfig(path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := yaml.Marshal(ca)
	if err != nil {
		return err
	}
	if err := os.WriteFile(path, data, 0o755); err != nil {
		return err
	}
	return nil
}

// CreateRootOrgTLSCA creates the root organization CA
func CreateRootOrgTLSCA(basePath string, fabricBinPath string) (*config.Organization, error) {
	adminPassword := os.Getenv("FABRIC_CA_ADMIN_PASSWORD")
	if adminPassword == "" {
		return nil, fmt.Errorf("FABRIC_CA_ADMIN_PASSWORD environment variable must be set (minimum 8 characters)")
	}
	if len(adminPassword) < 8 {
		return nil, fmt.Errorf("FABRIC_CA_ADMIN_PASSWORD must be at least 8 characters long")
	}

	caPath := filepath.Join(basePath, "organization", "root-ca-server", "tls-ca")
	if err := os.MkdirAll(caPath, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create base ca directory:\n %w", err)
	}

	adminID := "tls-admin"
	caServerCmd := "fabric-ca-server"
	if fabricBinPath != "" {
		caServerCmd = filepath.Join(fabricBinPath, "fabric-ca-server")
	}
	cmd := exec.Command(caServerCmd, "init",
		"-b",
		adminID+":"+adminPassword)
	cmd.Dir = caPath

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("failed to run fabric-ca-server init:\n %w", err)
	}

	// Unmarshal yaml file that it created
	configYaml := filepath.Join(caPath, "fabric-ca-server-config.yaml")

	yamlFile, err := os.ReadFile(configYaml)
	if err != nil {
		return nil, fmt.Errorf("error reading fabric-ca-server-config.yaml!\n %w", err)
	}

	caServer := &CAServer{}

	err = yaml.Unmarshal(yamlFile, caServer)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling fabric-ca-server-config.yaml! %w", err)
	}

	// Now we modify the CA server config
	caServer.Port = 9000
	caServer.TLS.Enabled = true
	caServer.CA.Name = "pm3-tls-ca"
	caServer.CSR.Hosts = append(caServer.CSR.Hosts, "localhost", "*.pm3.org")
	delete(caServer.Signing.Profiles, "ca")

	// Remove old ca-cert.pem file and msp to regenerate with new configs.
	if err := os.RemoveAll(filepath.Join(caPath, "msp")); err != nil {
		return nil, fmt.Errorf("could not remove msp path:\n %w", err)
	}

	if err := os.Remove(filepath.Join(caPath, "ca-cert.pem")); err != nil {
		return nil, fmt.Errorf("could not remove ca-cert.pem:\n %w", err)
	}

	if err := caServer.WriteConfig(caPath); err != nil {
		return nil, fmt.Errorf("could not write root tls ca config file:\n %w", err)
	}

	return caServer.NewCAConfig(config.TLS, "pm3_org_tls", caPath, "tls-ca.pm3.org"), nil
}

func EnrollBootstrapUserTLSCA(net *config.NetworkConfig, rootOrg *config.Organization) error {
	// Ensure paths are created
	tlsCAPath := filepath.Join(net.BasePath, "organizations", "client", "tls-ca")
	tlsRootPath := filepath.Join(net.BasePath, "organizations", "client", "tls-root-cert")

	if err := os.MkdirAll(tlsCAPath, 0o755); err != nil {
		return err
	}
	if err := os.MkdirAll(tlsRootPath, 0o755); err != nil {
		return err
	}

	// Copy ca-cert.pem from server
	if err := utils.CopyFile(filepath.Join(rootOrg.Path, "ca-cert.pem"), filepath.Join(tlsRootPath, "tls-ca-cert.pem")); err != nil {
		return err
	}

	cmd := exec.Command("fabric-ca-client", "enroll",
		"-d",
		"-u", fmt.Sprintf("https://%s:%s@%s:%d", rootOrg.CA.AdminUser, rootOrg.CA.AdminPassword, rootOrg.CA.Host, rootOrg.CA.Port),
		"--tls.certfiles", "tls-root-cert/tls-ca-cert.pem",
		"--enrollment.profile", "tls",
		"--csr.hosts", "localhost,*.pm3.org",
		"--mspdir", "tls-ca/tlsadmin/msp")
	cmd.Dir = filepath.Join(net.BasePath, "organizations", "client")
	cmd.Env = append(cmd.Env, "FABRIC_CA_CLIENT_HOME="+net.FabricBinPath)

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func RegAndEnrollOrgCABootrapID(net *config.NetworkConfig, rootOrg *config.Organization, orgIdentifier string) (*EnrollConfig, error) {
	tlsCAPath := filepath.Join(net.BasePath, "organizations", "client", "tls-ca")
	tlsRootPath := filepath.Join(net.BasePath, "organizations", "client", "tls-root-cert")

	if _, err := os.Stat(tlsCAPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("could not find organizations/client/tls-ca, have you created the TLS CA?\n %w", err)
	}
	if _, err := os.Stat(tlsRootPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("could not find organizations/client/tls-root-cert, have you created the TLS CA?\n %w", err)
	}

	enrollConfig := &EnrollConfig{
		Name:         orgIdentifier + "-admin",
		Password:     orgIdentifier + "-adminpw",
		CertPath:     "",
		KeyStorePath: "",
	}

	cmd := exec.Command("fabric-ca-client", "register",
		"-d",
		"--id.name", enrollConfig.Name,
		"--id.secret", enrollConfig.Password,
		"-u", fmt.Sprintf("https://%s:%s", rootOrg.CA.Host, rootOrg.CA.Port),
		"--tls.certfiles", "tls-root-cert/tls-ca-cert.pem",
		"--mspdir", "tls-ca/tlsadmin/msp")
	cmd.Dir = filepath.Join(net.BasePath, "organizations", "client")
	cmd.Env = append(cmd.Env, "FABRIC_CA_CLIENT_HOME="+net.FabricBinPath)

	if err := cmd.Run(); err != nil {
		return nil, err
	}

	enrollCmd := exec.Command("fabric-ca-client", "enroll",
		"-d",
		"-u", fmt.Sprintf("https://%s:%s@%s:%d", enrollConfig.Name, enrollConfig.Password, rootOrg.CA.Host, rootOrg.CA.Port),
		"--tls.certfiles", "tls-root-cert/tls-ca-cert.pem",
		"--enrollment.profile", "tls",
		"--csr.hosts", "localhost,*.pm3.org",
		"--mspdir", fmt.Sprintf("tls-ca/%s/msp", enrollConfig.Name))
	enrollCmd.Dir = filepath.Join(net.BasePath, "organizations", "client")
	enrollCmd.Env = append(cmd.Env, "FABRIC_CA_CLIENT_HOME="+net.FabricBinPath)

	if err := enrollCmd.Run(); err != nil {
		return nil, err
	}

	// Rename keystore key file for ease of reference
	keyStorePath := filepath.Join(net.BasePath, "organizations", "client", "tls-ca", enrollConfig.Name, "msp", "keystore")
	key, err := utils.FindFirstFile(keyStorePath)
	if err != nil {
		return nil, err
	}

	if err := os.Rename(key, filepath.Join(keyStorePath, "key.pem")); err != nil {
		return nil, err
	}

	enrollConfig.KeyStorePath = filepath.Join(keyStorePath, "key.pem")
	enrollConfig.CertPath = filepath.Join(net.BasePath, "organizations", "client", "tls-ca", enrollConfig.Name, "msp", "signcerts", "cert.pem")

	return enrollConfig, nil
}

func CreateOrgWithEnroll(net *config.NetworkConfig, enrollConfig *EnrollConfig, orgName string, domain string) (*config.Organization, error) {
	// Create directory structure
	orgPath := filepath.Join(net.BasePath, "organizations", orgName)
	if err := os.MkdirAll(orgPath, 0o755); err != nil {
		return nil, err
	}
	tlsPath := filepath.Join(orgPath, "tls")
	if err := os.MkdirAll(tlsPath, 0o755); err != nil {
		return nil, err
	}

	// Copy certificate and key
	if err := utils.CopyFile(enrollConfig.CertPath, filepath.Join(tlsPath, "cert.pem")); err != nil {
		return nil, err
	}
	if err := utils.CopyFile(enrollConfig.KeyStorePath, filepath.Join(tlsPath, "key.pem")); err != nil {
		return nil, err
	}

	// Init CA Server
	caServerCmd := "fabric-ca-server"
	if net.FabricBinPath != "" {
		caServerCmd = filepath.Join(net.FabricBinPath, "fabric-ca-server")
	}
	initCmd := exec.Command(caServerCmd, "init", "-b", fmt.Sprintf("%s:%s", enrollConfig.Name, enrollConfig.Password))
	initCmd.Dir = orgPath

	if err := initCmd.Run(); err != nil {
		return nil, fmt.Errorf("failed to run fabric-ca-server init:\n %w", err)
	}

	// Unmarshal yaml file that it created
	configYaml := filepath.Join(orgPath, "fabric-ca-server-config.yaml")

	yamlFile, err := os.ReadFile(configYaml)
	if err != nil {
		return nil, fmt.Errorf("error reading fabric-ca-server-config.yaml!\n %w", err)
	}

	caServer := &CAServer{}

	err = yaml.Unmarshal(yamlFile, caServer)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling fabric-ca-server-config.yaml! %w", err)
	}

	// Now we modify the CA server config
	caServer.Port = 9000 + len(net.Orgs)
	caServer.TLS.Enabled = true
	caServer.TLS.CertFile = "tls/cert.pem"
	caServer.TLS.KeyFile = "tls/key.pem"
	caServer.CA.Name = orgName
	caServer.CSR.Hosts = append(caServer.CSR.Hosts, "localhost", "*.pm3.org")
	caServer.CSR.CA.PathLength = 1                              // THIS SETS IT SO THAT WE CAN ONLY CREATE A CA ONE STEP DOWN, NOT ANY FURTHER.
	caServer.Signing.Profiles["ca"].CAConstraint.MaxPathLen = 0 // THIS ALSO ACCOMPLISHES THE SAME THING, SO UP IT IF YOU UP THE OTHER ONE!

	delete(caServer.Signing.Profiles, "ca")

	// Remove old ca-cert.pem file and msp to regenerate with new configs.
	if err := os.RemoveAll(filepath.Join(orgPath, "msp")); err != nil {
		return nil, fmt.Errorf("could not remove msp path:\n %w", err)
	}

	if err := os.Remove(filepath.Join(orgPath, "ca-cert.pem")); err != nil {
		return nil, fmt.Errorf("could not remove ca-cert.pem:\n %w", err)
	}

	if err := caServer.WriteConfig(orgPath); err != nil {
		return nil, fmt.Errorf("could not write root tls ca config file:\n %w", err)
	}

	return caServer.NewCAConfig(config.TLS, orgName, orgPath,
		orgName+"."+domain), nil
}

func EnrollOrgAdmin(net *config.NetworkConfig, org *config.Organization) error {
	// Create org client directory
	orgClientPath := filepath.Join(net.BasePath, "organizations", "client", org.Name)
	if err := os.MkdirAll(orgClientPath, 0o755); err != nil {
		return err
	}

	cmd := exec.Command("fabric-ca-client", "enroll",
		"-d",
		"-u", fmt.Sprintf("https://%s:%s@%s:%d", org.CA.AdminUser, org.CA.AdminPassword, org.CA.Host, org.CA.Port),
		"--tls.certfiles", "tls-root-cert/tls-ca-cert.pem",
		"--enrollment.profile", "tls",
		"--csr.hosts", "localhost,*.pm3.org",
		"--mspdir", filepath.Join(org.Name, org.CA.AdminUser, "msp"))
	cmd.Dir = filepath.Join(net.BasePath, "organizations", "client")
	cmd.Env = append(cmd.Env, "FABRIC_CA_CLIENT_HOME="+net.FabricBinPath)

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
