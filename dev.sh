FRAKTALDIR=$(cd "$(dirname "$0")" && pwd)
NETWORKDIR=${FRAKTALDIR}/fabric-samples/test-network
CHANNEL_NAME="pm3"
CONTAINER_CLI=docker
export PATH=${FRAKTALDIR}/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=${FRAKTALDIR}/fabric-samples/config/
CC_NAME=${CC_NAME:-pm3package}
CC_VERSION=${CC_VERSION:-1.0}
CC_SEQUENCE=${CC_SEQUENCE:-1}
CC_LANG=${CC_LANG:-javascript} # we prebuild TS -> JS, so use javascript
CC_PATH=${CC_PATH:-${FRAKTALDIR}/chaincodes/package}

case "${CC_LANG}" in
node | Node | NODE) CC_LANG=javascript ;;
js | JS | JavaScript) CC_LANG=javascript ;;
ts | TS | TypeScript) CC_LANG=typescript ;;
esac

pushd ${FRAKTALDIR} >/dev/null
trap "popd > /dev/null" EXIT

function infoln() {
  echo -e "\033[1;34m$1\033[0m"
}

function errorln() {
  echo -e "\033[1;31m$1\033[0m"
}

function buildIPFSImage() {
  infoln "==============================="
  infoln "Building custom IPFS image..."
  infoln "==============================="

  pushd ${FRAKTALDIR}/docker/ipfs >/dev/null
  docker build -t fraktal-ipfs:latest .
  local rc=$?
  popd >/dev/null

  if [[ ${rc} -ne 0 ]]; then
    errorln "Failed to build IPFS image"
    exit 1
  fi
  infoln "Custom IPFS image built successfully"
}

# Build the PM3 chaincode (TypeScript -> dist JS)
function buildChaincode() {
  infoln "==============================="
  infoln "Building chaincode at: ${CC_PATH}"
  infoln "==============================="
  if [[ ! -d "${CC_PATH}" ]]; then
    errorln "Chaincode path not found: ${CC_PATH}"
    exit 1
  fi
  pushd "${CC_PATH}" >/dev/null
  rm -rf dist node_modules
  npm install
  npm ci
  npm run package
  popd >/dev/null
}

# Deploy the PM3 chaincode via test-network/network.sh
function deployChaincode() {
  infoln "======================================"
  infoln "Deploying chaincode to channel: ${CHANNEL_NAME}"
  infoln "Name=${CC_NAME}  Version=${CC_VERSION}  Seq=${CC_SEQUENCE}  Lang=${CC_LANG}"
  infoln "Path=${CC_PATH}"
  infoln "======================================"
  pushd "${NETWORKDIR}" >/dev/null
  GOWORK=off ./network.sh deployCC \
    -c "${CHANNEL_NAME}" \
    -ccn "${CC_NAME}" \
    -ccp "${CC_PATH}" \
    -ccl "${CC_LANG}" \
    -ccv "${CC_VERSION}" \
    -ccs "${CC_SEQUENCE}"
  local rc=$?
  popd >/dev/null
  return ${rc}
}

# Enroll CA admins for both organizations
function enrollCaAdmins() {
  infoln "==============================="
  infoln "Enrolling CA admins..."
  infoln "==============================="

  local NET=${NETWORKDIR}

  # Enroll CA admin for Org1
  infoln "Enrolling CA admin for Org1..."
  local CA_ADMIN_HOME_ORG1="${HOME}/.fabric-ca-client/org1"
  mkdir -p "${CA_ADMIN_HOME_ORG1}"
  FABRIC_CA_CLIENT_HOME="${CA_ADMIN_HOME_ORG1}" \
    fabric-ca-client enroll \
    -u "https://admin:adminpw@localhost:7054" \
    --tls.certfiles "${NET}/organizations/fabric-ca/org1/tls-cert.pem" \
    >/dev/null 2>&1

  if [[ $? -eq 0 ]]; then
    infoln "✓ CA admin for Org1 enrolled successfully"
  else
    errorln "Failed to enroll CA admin for Org1"
  fi

  # Enroll CA admin for Org2
  infoln "Enrolling CA admin for Org2..."
  local CA_ADMIN_HOME_ORG2="${HOME}/.fabric-ca-client/org2"
  mkdir -p "${CA_ADMIN_HOME_ORG2}"
  FABRIC_CA_CLIENT_HOME="${CA_ADMIN_HOME_ORG2}" \
    fabric-ca-client enroll \
    -u "https://admin:adminpw@localhost:8054" \
    --tls.certfiles "${NET}/organizations/fabric-ca/org2/tls-cert.pem" \
    >/dev/null 2>&1

  if [[ $? -eq 0 ]]; then
    infoln "✓ CA admin for Org2 enrolled successfully"
  else
    errorln "Failed to enroll CA admin for Org2"
  fi
}

# List all identities registered in the Fabric CA for the given organization
function listIdentities() {
  local org=$1

  if [[ -z "${org}" ]]; then
    errorln "Usage: listIdentities <org_number>"
    errorln "Example: listIdentities 1"
    return 1
  fi

  infoln "==============================="
  infoln "Listing identities for Org${org}"
  infoln "==============================="

  local NET=${NETWORKDIR}
  local CA_ADDRESS=""
  local CA_TLS=""
  local CA_ADMIN_HOME=""

  if [[ "${org}" == "1" ]]; then
    CA_ADDRESS="localhost:7054"
    CA_TLS="${NET}/organizations/fabric-ca/org1/tls-cert.pem"
    CA_ADMIN_HOME="${HOME}/.fabric-ca-client/org1"
  elif [[ "${org}" == "2" ]]; then
    CA_ADDRESS="localhost:8054"
    CA_TLS="${NET}/organizations/fabric-ca/org2/tls-cert.pem"
    CA_ADMIN_HOME="${HOME}/.fabric-ca-client/org2"
  else
    errorln "Invalid org number: ${org}. Must be 1 or 2."
    return 1
  fi

  # Check if CA Admin has been enrolled
  if [[ ! -d "${CA_ADMIN_HOME}/msp" ]]; then
    errorln "CA Admin not enrolled for Org${org}"
    errorln "Run './dev.sh up' to enroll CA admins automatically."
    return 1
  fi

  # List identities using the pre-enrolled CA Admin credentials
  FABRIC_CA_CLIENT_HOME="${CA_ADMIN_HOME}" \
    fabric-ca-client identity list \
    -u "https://${CA_ADDRESS}" \
    --tls.certfiles "${CA_TLS}"
}

# Start the fabric test network using the network.sh script. Setting the channel name to pm3.
# if the network is already running, this will do nothing.
function networkUp() {
  if [[ ! -d ${NETWORKDIR} ]]; then
    errorln "Fabric test network directory not found: ${NETWORKDIR}"
    exit 1
  fi
  # Check if the network is already running
  CONTAINERS=($($CONTAINER_CLI ps | grep hyperledger/ | awk '{print $2}'))
  if [[ ${#CONTAINERS[@]} -ge 4 ]]; then
    infoln "Fabric test network already running"
    pushd ${NETWORKDIR} >/dev/null
    ./network.sh down
    popd >/dev/null
  fi
  infoln "==============================="
  infoln "Starting Fabric test network..."
  infoln "==============================="
  pushd ${NETWORKDIR} >/dev/null

  ./network.sh up createChannel -ca -c ${CHANNEL_NAME}
  # Make sure to deploy the firefly chaincode so that if we start a firefly instance later it will work
  infoln "=============================="
  infoln "Deploying Firefly chaincode..."
  infoln "=============================="
  ./deploy_firefly_chaincode.sh
  popd >/dev/null
  enrollCaAdmins
}

# Makes sure that the configs are in order and then starts the firefly containers.
function fireflyUp() {
  ORG1_KEYSTORE=${NETWORKDIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore
  ORG2_KEYSTORE=${NETWORKDIR}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore

  # Make sure to chown these direcories to the current user so that ff can read them
  sudo chown -R $USER ${NETWORKDIR}/organizations

  #Check if the firefly containers are already running
  CONTAINERS=($($CONTAINER_CLI ps | grep ghcr.io/hyperledger-labs/firefly | awk '{print $2}'))
  if [[ ${#CONTAINERS[@]} -ge 4 ]]; then
    infoln "Firefly containers already running, stop them if you want to make changes"
    return
  fi

  infoln "==============================="
  infoln "Starting Firefly containers..."
  infoln "==============================="

  # Check if the key files have been generated
  if [[ ! -d ${ORG1_KEYSTORE} || ! -d ${ORG2_KEYSTORE} ]]; then
    errorln "Fabric keystore directories not found. Make sure the fabric test network is running."
    exit 1
  fi

  # Get the most recently modified key file (in case of re-enrollment)
  ORG1_KEYFILE=$(ls -t ${ORG1_KEYSTORE}/* | head -n 1)
  ORG2_KEYFILE=$(ls -t ${ORG2_KEYSTORE}/* | head -n 1)

  if [[ -z "${ORG1_KEYFILE}" || -z "${ORG2_KEYFILE}" ]]; then
    errorln "Fabric keystore files not found. Make sure the fabric test network is running."
    exit 1
  fi

  # Copy the template ccp yml files and replace the private key file names, overwriting any existing ccp files
  cp -f ${FRAKTALDIR}/config/ccp-template-org1.yml ${FRAKTALDIR}/config/ccp-org1.yml
  cp -f ${FRAKTALDIR}/config/ccp-template-org2.yml ${FRAKTALDIR}/config/ccp-org2.yml

  # Extract just the filename from the full paths
  ORG1_KEYFILE_NAME=$(basename ${ORG1_KEYFILE})
  ORG2_KEYFILE_NAME=$(basename ${ORG2_KEYFILE})

  # Replace FILL_IN_KEY_NAME_HERE with actual key filenames
  # Cross-platform sed in-place replacement
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/FILL_IN_KEY_NAME_HERE/${ORG1_KEYFILE_NAME}/g" ${FRAKTALDIR}/config/ccp-org1.yml
    sed -i '' "s/FILL_IN_KEY_NAME_HERE/${ORG2_KEYFILE_NAME}/g" ${FRAKTALDIR}/config/ccp-org2.yml
  else
    # Linux
    sed -i "s/FILL_IN_KEY_NAME_HERE/${ORG1_KEYFILE_NAME}/g" ${FRAKTALDIR}/config/ccp-org1.yml
    sed -i "s/FILL_IN_KEY_NAME_HERE/${ORG2_KEYFILE_NAME}/g" ${FRAKTALDIR}/config/ccp-org2.yml
  fi

  # Init the stack with the ccp files as flags and with the correct channel name
  pushd ${NETWORKDIR} >/dev/null

  # Check if stack exists already and remove it if so
  FF_LIST_OUTPUT=$(ff list)
  if [[ "$FF_LIST_OUTPUT" != "FireFly Stacks:" ]] && echo "$FF_LIST_OUTPUT" | grep -q "dev"; then
    ff stop dev
    ff remove dev
  fi

  ff init fabric dev \
    --ccp "${FRAKTALDIR}/config/ccp-org1.yml" \
    --msp "organizations" \
    --ccp "${FRAKTALDIR}/config/ccp-org2.yml" \
    --msp "organizations" \
    --channel ${CHANNEL_NAME} \
    --chaincode firefly -p 8000
  popd >/dev/null

  # Build custom IPFS image
  buildIPFSImage

  cp -f ${FRAKTALDIR}/config/docker-compose.override.yml ${HOME}/.firefly/stacks/dev

  ff start dev --no-rollback -v

  buildChaincode
  deployChaincode
}

function networkDown() {
  if [[ ! -d ${NETWORKDIR} ]]; then
    errorln "Fabric test network directory not found: ${NETWORKDIR}"
    exit 1
  fi
  # Check if the network is already running
  CONTAINERS=($($CONTAINER_CLI ps | grep hyperledger/ | awk '{print $2}'))
  if [[ ${#CONTAINERS[@]} -ge 1 ]]; then
    infoln "==============================="
    infoln "Stopping Fabric test network..."
    infoln "==============================="
    pushd ${NETWORKDIR} >/dev/null
    ./network.sh down
    popd >/dev/null
  else
    infoln "Fabric test network is not running"
  fi
}

function fireflyDown() {
  FF_LIST_OUTPUT=$(ff list)
  if [[ "$FF_LIST_OUTPUT" != "FireFly Stacks:" ]] && echo "$FF_LIST_OUTPUT" | grep -q "dev"; then
    infoln "==============================="
    infoln "Stopping and removing Firefly containers..."
    infoln "==============================="
    ff stop dev
    ff remove dev
  else
    errorln "Could not find Firefly stack 'dev'"
  fi
}

function networkRestart() {
  if [[ ! -d ${NETWORKDIR} ]]; then
    errorln "Fabric test network directory not found: ${NETWORKDIR}"
    exit 1
  fi
  # Check if the network is already running
  CONTAINERS=($($CONTAINER_CLI ps | grep hyperledger/ | awk '{print $2}'))
  if [[ ${#CONTAINERS[@]} -ge 1 ]]; then
    networkDown
    networkUp
  else
    infoln "Fabric test network is not running"
  fi
}

function install() {
  if [[ ! -d ${NETWORKDIR} ]]; then
    errorln "Fabric test network directory not found: ${NETWORKDIR}"
    exit 1
  fi
  infoln "==============================="
  infoln "Installing prerequisites..."
  infoln "==============================="
  git submodule init
  git submodule update
  pushd ${NETWORKDIR} >/dev/null
  ./network.sh prereq
  popd >/dev/null
}

function networkStatus() {
  infoln "==============================="
  infoln "Fabric test network status:"
  infoln "==============================="
  docker ps | grep hyperledger/
}

function fireflyStatus() {
  infoln "==============================="
  infoln "Firefly status:"
  infoln "==============================="
  ff info dev
}

function printHelp() {
  echo "Usage: $0 <mode> [ff|firefly|fb|fabric] [-h|--help]"
  echo ""
  echo "Modes:"
  echo "  up             Start the PM3 test network and/or Firefly containers"
  echo "  restart        Restart the PM3 test network and/or Firefly containers"
  echo "  down           Stop and remove the PM3 test network and/or Firefly containers"
  echo "  status         Show the status of the PM3 test network and/or Firefly containers"
  echo "  install        Install prerequisites for the PM3 test network"
  echo "  deploycc       Build and deploy the PM3 chaincode to the Fabric network"
  echo "  updaterole     Update role for an existing user (usage: $0 updaterole <username> <new_role> <org_number>)"
  echo "  listidentities List all identities in the CA for an org (usage: $0 listidentities <org_number>)"
  echo ""
  echo "Options:"
  echo "  ff,firefly  Operate on Firefly containers only"
  echo "  fb,fabric   Operate on PM3 test network only"
  echo "  -h, --help  Show this help message"
  echo ""
  echo "If neither firefly nor fabric is specified, both will be operated on."
  echo ""
  echo "Examples:"
  echo "  $0 updaterole transporter1 manager 1         # Update transporter1 in Org1 to manager role"
  echo "  $0 updaterole ombud1 auditor 2               # Update ombud1 in Org2 to auditor role"
  echo "  $0 listidentities 1                          # List all identities registered in Org1's CA"
  echo "  $0 listidentities 2                          # List all identities registered in Org2's CA"
}

# Parse commandline args
## Parse mode
if [[ $# -lt 1 ]]; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

firefly_selected=false
fabric_selected=false

# Commands that take positional arguments should skip the firefly/fabric parsing loop
if [[ "${MODE}" != "updaterole" && "${MODE}" != "listidentities" ]]; then
  while [[ $# -ge 1 ]]; do
    case "$1" in
    ff)
      firefly_selected=true
      ;;
    firefly)
      firefly_selected=true
      ;;
    fb)
      fabric_selected=true
      ;;
    fabric)
      fabric_selected=true
      ;;
    -h | --help)
      printHelp $MODE
      exit 0
      ;;
    *)
      echo "Unknown subcommand: $1"
      printHelp
      exit 1
      ;;
    esac
    shift
  done
fi

if [[ "${fabric_selected}" == false && "${firefly_selected}" == false ]]; then
  fabric_selected=true
  firefly_selected=true
fi

if [[ "${MODE}" == "up" ]]; then
  #Default to starting both if none specified
  if [[ "${fabric_selected}" == true ]]; then
    networkUp
  fi
  if [[ "${firefly_selected}" == true ]]; then
    fireflyUp
  fi
elif [[ "$MODE" == "restart" ]]; then
  if [[ "${fabric_selected}" == true ]]; then
    networkRestart
  fi
  if [[ "${firefly_selected}" == true ]]; then
    fireflyDown
    fireflyUp
  fi
elif [[ "${MODE}" == "down" ]]; then
  if [[ "${firefly_selected}" == true ]]; then
    fireflyDown
  fi
  if [[ "${fabric_selected}" == true ]]; then
    networkDown
  fi
elif [[ "${MODE}" == "status" ]]; then
  if [[ "${fabric_selected}" == true ]]; then
    networkStatus
  fi
  if [[ "${firefly_selected}" == true ]]; then
    fireflyStatus
  fi
elif [[ "${MODE}" == "install" ]]; then
  if [[ "${fabric_selected}" == true ]]; then
    install
  fi
elif [[ "${MODE}" == "deploycc" ]]; then
  # Build and deploy the PM3 chaincode
  buildChaincode
  deployChaincode
elif [[ "${MODE}" == "updaterole" ]]; then
  # Parse additional arguments for updaterole command
  if [[ $# -lt 3 ]]; then
    errorln "updaterole requires 3 arguments: <username> <new_role> <org_number>"
    echo "Example: $0 updaterole transporter1 manager 1"
    exit 1
  fi
  USERNAME=$1
  NEW_ROLE=$2
  ORG_NUM=$3
  updateUserRole "${USERNAME}" "${NEW_ROLE}" "${ORG_NUM}"
elif [[ "${MODE}" == "listidentities" ]]; then
  # Parse additional arguments for listidentities command
  if [[ $# -lt 1 ]]; then
    errorln "listidentities requires 1 argument: <org_number>"
    echo "Example: $0 listidentities 1"
    exit 1
  fi
  ORG_NUM=$1
  listIdentities "${ORG_NUM}"
else
  echo "Unknown mode: ${MODE}"
  printHelp
  exit 1
fi
