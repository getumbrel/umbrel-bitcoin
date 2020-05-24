#!/bin/bash

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

# Usage
# ./wait-for-node-manager.sh <hostname> <command>
# Other documentation: https://docs.docker.com/compose/startup-order/

set -e


host="$1"
shift
cmd="$@"

found=1
iterations=1
until [ $found = 2 ]; do
  if node -e "const axios = require('axios').default; axios.get('http://$host:3006/ping').then((resp) => {console.log(resp.data); process.exit(0); }).catch((error) => {process.exit(1) } );" ; then
    echo "Can connect, lets proceed with server starting"
    found=2
  else
    echo "Can't connect, keep trying"
  fi
  if [ $iterations -gt 14 ]; then
    echo "Cannot connect after 15 tries, giving up"
    exit 1
  fi
  ((iterations=iterations+1))
  sleep 2
done

>&2 echo "Pre-condition found, Running service"
exec $cmd
