#!/opt/homebrew/bin/bash bash

CORE_PORT=8333
CORE_RPCPORT=8332

arguments=""
for env in "${!CORE_@}"
do
  value=${!env}
  uppercase_flag=${env#CORE_}
  lowercase_flag=${uppercase_flag,,}
  arguments="${arguments} -${lowercase_flag,,}=${!env}"
done
echo $arguments
# -port=8333 -rpcport=8332