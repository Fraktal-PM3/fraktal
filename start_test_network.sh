FRAKTALDIR=$(cd "$(dirname "$0")" && pwd)
NETWORKDIR=${FRAKTALDIR}/fabric-samples/test-network
CHANNEL_NAME="pm3"

pushd ${FRAKTALDIR} >/dev/null
trap "popd > /dev/null" EXIT

# Start the fabric test network using the network.sh script. Setting the channel name to pm3.
# if the network is already running, this will do nothing.
function networkUp() {
  if [[ ! -d ${NETWORKDIR} ]]; then
    errorln "Fabric test network directory not found: ${NETWORKDIR}"
    exit 1
  fi
  # Check if the network is already running
  CONTAINERS=($($CONTAINER_CLI ps | grep hyperledger/ | awk '{print $2}'))
  if [[len ${CONTAINERS[@]} -ge 4 ]]; then
    infoln "Fabric test network already running"
    return
  else
    infoln "Starting Fabric test network..."
    pushd ${NETWORKDIR} >/dev/null
    ./network.sh up createChannel -ca -c ${CHANNEL_NAME}

    # Make sure to deploy the firefly chaincode so that if we start a firefly instance later it will work
    ./deploy_firefly_chaincode.sh
    popd >/dev/null
  fi
}

function fireflyUp(fabric_selected) {
  ORG1_KEYSTORE=${FRAKTALDIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore
  ORG2_KEYSTORE=${FRAKTALDIR}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/keystore

  # Make sure to chown these direcories to the current user so that ff can read them
  chown -R $USER:$USER ${FRAKTALDIR}/organizations

  #Check if the firefly containers are already running
  CONTAINERS=($($CONTAINER_CLI ps | grep ghcr.io/hyperledger-labs/firefly | awk '{print $2}'))
  if [[len ${CONTAINERS[@]} -ge 4 ]]; then
    infoln "Firefly containers already running, stop them if you want to make changes"
    return
  fi



  infoln "Starting Firefly containers..."
  # Check if the key files have been generated
  if [[ ! -d ${ORG1_KEYSTORE} || ! -d ${ORG2_KEYSTORE} ]]; then
    errorln "Fabric keystore directories not found. Make sure the fabric test network is running."
    exit 1
  fi

  ORG1_KEYFILE=$(ls ${ORG1_KEYSTORE}/*_ks | head -n 1)
  ORG2_KEYFILE=$(ls ${ORG2_KEYSTORE}/*_ks | head -n 1)

  if [[ -z "${ORG1_KEYFILE}" || -z "${ORG2_KEYFILE}" ]]; then
    errorln "Fabric keystore files not found. Make sure the fabric test network is running."
    exit 1
  fi

  # Copy the template ccp yml files and replace the private key file names, overwriting any existing ccp files
  cp -f ${FRAKTALDIR}/config/ccp-template-org1.yaml ${FRAKTALDIR}/config/ccp-org1.yaml
  cp -f ${FRAKTALDIR}/config/ccp-template-org2.yaml ${FRAKTALDIR}/config/ccp-org2.yaml

  # Extract just the filename from the full paths
  ORG1_KEYFILE_NAME=$(basename ${ORG1_KEYFILE})
  ORG2_KEYFILE_NAME=$(basename ${ORG2_KEYFILE})

  # Replace FILL_IN_KEY_NAME_HERE with actual key filenames
  sed -i "s/FILL_IN_KEY_NAME_HERE/${ORG1_KEYFILE_NAME}/g" ${FRAKTALDIR}/config/ccp-org1.yaml
  sed -i "s/FILL_IN_KEY_NAME_HERE/${ORG2_KEYFILE_NAME}/g" ${FRAKTALDIR}/config/ccp-org2.yaml


  # Init the stack with the ccp files as flags and with the correct channel name
  pushd ${NETWORKDIR} >/dev/null

  # Check if stack exists already and remove it if so

  ff list | grep dev >/dev/null 2>&1

  # Check if fabric was also selected to start, in which case the key files will be changes so we will need to remove the stack and recreate it
  if [[ $? -eq 0 && fabric_selected ]]; then
    ff remove dev
  fi

  ff init fabric dev \
    --ccp "${FRAKTALDIR}/config/ccp-org1.yml" \
    --msp "organizations" \
    --ccp "${FRAKTALDIR}/config/ccp-org2.yml" \
    --msp "organizations" \
    --channel ${CHANNEL_NAME} \
    --chaincode firefly

  ff start dev
  popd >/dev/null
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
  fb)
    fabric_selected=true
    ;;
  fabric)
    fabric_selected=true
    ;;
  firefly)
    firefly_selected=true
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

if [[ "${MODE}" == "start" ]]; then
  #Default to starting both if none specified
  if [[ "${fabric_selected}" == true ]]; then
    infoln "Starting PM3 test network..."
    networkUp
  fi
  if [[ "${firefly_selected}" == true ]]; then
    infoln "Starting Firefly containers..."
    fireflyUp fabric_selected
  fi
elif [[ "${MODE}" == "stop" ]]; then
  if [[ "${firefly_selected}" == true ]]; then
    infoln "Stopping Firefly containers..."
    fireflyStop
  fi
elif [[ "$MODE" == "restart" ]]; then
  if [[ "${fabric_selected}" == true ]]; then
    infoln "Restarting PM3 test network..."
    networkRestart
  fi
  if [[ "${firefly_selected}" == true ]]; then
    infoln "Restarting Firefly containers..."
    fireflyUp
  fi
elif [[ "${MODE}" == "down" ]]; then
  if [[ "${firefly_selected}" == true ]]; then
    infoln "Stopping and removing Firefly containers..."
    fireflyDown
  fi
  if [[ "${fabric_selected}" == true ]]; then
    infoln "Stopping and removing PM3 test network..."
    networkDown
  fi
elif [[ "${MODE}" == "status" ]]; then
  if [[ "${fabric_selected}" == true ]]; then
    infoln "PM3 test network status..."
    networkStatus
  fi
  if [[ "${firefly_selected}" == true ]]; then
    infoln "Firefly containers status..."
    fireflyStatus
  fi
else
  echo "Unknown mode: ${MODE}"
  printHelp
  exit 1
fi
