<template v-slot:modal-header="{ close }" title="Connect to Handshake Node">
  <div
    class="px-2 px-sm-3 pt-2 d-flex flex-column justify-content-between w-100 mt-n4"
  >
    <h3>Connect to Handshake</h3>
    <p class="text-muted mb-md-4">
      Connect any wallet that supports Handshake hsd's RPC connection to your
      node using these details.
    </p>
    <div class="pb-2 pb-sm-3">
      <div class="row flex-column-reverse flex-lg-row">
        <div class="col-12 col-lg-4">
          <!-- QR Code -->
          <qr-code
            :value="chosenConnectionString"
            :size="225"
            class="qr-image mx-auto mt-1"
            showLogo
          ></qr-code>
        </div>
        <div class="col-12 col-lg-8 align-items-center">
          <div>
            <b-row>
              <b-col>
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold">Host</small></label
                >
                <input-copy
                  v-if="rpc.localAddress"
                  class="mb-2"
                  size="sm"
                  :value="rpc.localAddress"
                ></input-copy>
                <span
                  class="loading-placeholder loading-placeholder-lg mt-1"
                  style="width: 100%;"
                  v-else
                ></span>
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold">API Key</small></label
                >
                <input-copy
                  v-if="rpc.apiKey"
                  class="mb-2"
                  size="sm"
                  :value="rpc.apiKey"
                ></input-copy>
                <span
                  class="loading-placeholder loading-placeholder-lg mt-1"
                  style="width: 100%;"
                  v-else
                ></span>
              </b-col>
            </b-row>
            <b-row>
              <b-col>
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold">RPC Port</small></label
                >
                <input-copy
                  v-if="rpc.port"
                  class="mb-2"
                  size="sm"
                  :value="rpc.port"
                ></input-copy>
                <span
                  class="loading-placeholder loading-placeholder-lg mt-1"
                  style="width: 100%;"
                  v-else
                ></span>
              </b-col>
            </b-row>
          </div>
        </div>
      </div>
      <!-- <p class="mt-2">
        Looking for step-by-step instructions to connect your wallet to your
        Bitcoin node?
        <a href="https://link.umbrel.com/connect-bitcoin" target="_blank"
          >Click here</a
        >.
      </p> -->
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import QrCode from '@/components/Utility/QrCode';
import InputCopy from '@/components/Utility/InputCopy';

export default {
  data() {
    return {
      chosenMode: 'rpcTor',
      modes: [
        { value: 'rpcTor', text: 'RPC (Tor)' },
        { value: 'rpcLocal', text: 'RPC (Local Network)' },
        { value: 'p2pTor', text: 'P2P (Tor)' },
        { value: 'p2pLocal', text: 'P2P (Local Network)' }
      ]
    };
  },
  computed: {
    ...mapState({
      rpc: state => state.bitcoin.rpc
    }),
    chosenConnectionString() {
      return this.rpc.localConnectionString;
    }
  },
  components: {
    QrCode,
    InputCopy
  }
};
</script>
