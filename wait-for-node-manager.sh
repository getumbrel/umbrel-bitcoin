#!/bin/bash

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

set -e


host="$1"
shift
cmd="$@"

found=1

until [ $found = 2 ]; do
  if node -e "const axios = require('axios').default; axios.get('http://$host:3006/ping').then((resp) => {console.log(resp.data); process.exit(0); }).catch((error) => {process.exit(1) } );" ; then
    echo "Executed"
    found=2
  else
    echo "Can't connect, keep trying"
  fi
  sleep 2
done

>&2 echo "Pre-condition found, Running service"
exec $cmd
