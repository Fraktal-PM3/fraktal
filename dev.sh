FRAKTALDIR=$(cd "$(dirname "$0")" && pwd)
NETWORKDIR=${FRAKTALDIR}/fabric-samples/test-network
CHANNEL_NAME="pm3"
CONTAINER_CLI=docker
export PATH=${FRAKTALDIR}/fabric-samples/bin:$PATH
CC_NAME=${CC_NAME:-pm3package}
CC_VERSION=${CC_VERSION:-1.0}
CC_SEQUENCE=${CC_SEQUENCE:-1}
CC_LANG=${CC_LANG:-javascript}   # we prebuild TS -> JS, so use javascript
CC_PATH=${CC_PATH:-${FRAKTALDIR}/chaincodes/package}

case "${CC_LANG}" in
  node|Node|NODE)       CC_LANG=javascript ;;
  js|JS|JavaScript)     CC_LANG=javascript ;;
  ts|TS|TypeScript)     CC_LANG=typescript ;;
esac

pushd ${FRAKTALDIR} >/dev/null
trap "popd > /dev/null" EXIT

function infoln() {
  echo -e "\033[1;34m$1\033[0m"
}

function errorln() {
  echo -e "\033[1;31m$1\033[0m"
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
  npm ci
  npm run build
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

# Register users with roles in the Fabric test network CAs
function registerRoles() {

  infoln "==============================="
  infoln "Registering users with roles..."
  infoln "==============================="

  local NET=${NETWORKDIR}
  # host:port ONLY (no scheme here)
  local ORG1_CA="localhost:7054"
  local ORG2_CA="localhost:8054"
  local ORG1_CA_TLS="${NET}/organizations/fabric-ca/org1/tls-cert.pem"
  local ORG2_CA_TLS="${NET}/organizations/fabric-ca/org2/tls-cert.pem"

  # ---- Org1: enroll CA registrar ----
  export FABRIC_CA_CLIENT_HOME="${NET}/organizations/peerOrganizations/org1.example.com/"
  fabric-ca-client enroll \
    -u "https://admin:adminpw@${ORG1_CA}" \
    --tls.certfiles "${ORG1_CA_TLS}"

  # Register transporter1 with role=transporter (embedded in ECert)
  fabric-ca-client register \
    --id.name transporter1 \
    --id.secret transporterpw \
    --id.type client \
    --id.affiliation org1.department1 \
    --id.attrs 'role=transporter:ecert' \
    -u "https://${ORG1_CA}" \
    --tls.certfiles "${ORG1_CA_TLS}"

  # Enroll transporter1 -> creates MSP with signcerts containing role
  fabric-ca-client enroll \
    -u "https://transporter1:transporterpw@${ORG1_CA}" \
    --mspdir "${NET}/organizations/peerOrganizations/org1.example.com/users/transporter1@org1.example.com/msp" \
    --tls.certfiles "${ORG1_CA_TLS}"

  # ---- Org2: enroll CA registrar ----
  export FABRIC_CA_CLIENT_HOME="${NET}/organizations/peerOrganizations/org2.example.com/"
  fabric-ca-client enroll \
    -u "https://admin:adminpw@${ORG2_CA}" \
    --tls.certfiles "${ORG2_CA_TLS}"

  # Register ombud1 with role=ombud
  fabric-ca-client register \
    --id.name ombud1 \
    --id.secret ombudpw \
    --id.type client \
    --id.affiliation org2.department1 \
    --id.attrs 'role=ombud:ecert' \
    -u "https://${ORG2_CA}" \
    --tls.certfiles "${ORG2_CA_TLS}"

  # Enroll ombud1
  fabric-ca-client enroll \
    -u "https://ombud1:ombudpw@${ORG2_CA}" \
    --mspdir "${NET}/organizations/peerOrganizations/org2.example.com/users/ombud1@org2.example.com/msp" \
    --tls.certfiles "${ORG2_CA_TLS}"

  # (Optional) Give Admin@org2 the pm3 role and reenroll
  fabric-ca-client identity modify admin \
    --type client \
    --attrs 'role=pm3:ecert' \
    -u "https://${ORG2_CA}" \
    --tls.certfiles "${ORG2_CA_TLS}"

  FABRIC_CA_CLIENT_HOME="${NET}/organizations/peerOrganizations/org2.example.com/" \
    fabric-ca-client reenroll \
    --mspdir "${NET}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" \
    --enrollment.attrs "role" \
    -u "https://${ORG2_CA}" \
    --tls.certfiles "${ORG2_CA_TLS}"

  echo "Roles registered and enrolled (Org1: transporter1, Org2: ombud1, Admin@org2 has role=pm3)."
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
  registerRoles
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

  ORG1_KEYFILE=$(ls ${ORG1_KEYSTORE}/* | head -n 1)
  ORG2_KEYFILE=$(ls ${ORG2_KEYSTORE}/* | head -n 1)

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
  echo "  up          Start the PM3 test network and/or Firefly containers"
  echo "  restart     Restart the PM3 test network and/or Firefly containers"
  echo "  down        Stop and remove the PM3 test network and/or Firefly containers"
  echo "  status      Show the status of the PM3 test network and/or Firefly containers"
  echo "  install     Install prerequisites for the PM3 test network"
  echo "  deploycc    Build and deploy the PM3 chaincode to the Fabric network"
  echo ""
  echo "Options:"
  echo "  ff,firefly  Operate on Firefly containers only"
  echo "  fb,fabric   Operate on PM3 test network only"
  echo "  -h, --help  Show this help message"
  echo ""
  echo "If neither firefly nor fabric is specified, both will be operated on."
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
  # Ensure Fabric network is up first
  networkUp
  # Build and deploy the PM3 chaincode
  buildChaincode
  deployChaincode
else
  echo "Unknown mode: ${MODE}"
  printHelp
  exit 1
fi
