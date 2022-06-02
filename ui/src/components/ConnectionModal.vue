<template v-slot:modal-header="{ close }" title="Connect to Bitcoin Node">
  <div
    class="px-2 px-sm-3 pt-2 d-flex flex-column justify-content-between w-100 mt-n4"
  >
    <h3>Connect to Bitcoin Node</h3>
    <div class="pb-2 pb-sm-3 mt-3">
      <!-- BUTTONS -->
      <div
        class="d-flex d-lg-inline-block btn-group border border-primary rounded mb-2"
        role="group"
        aria-label="Basic example"
      >
        <b-button
          v-for="mode in modes"
          :key="mode"
          class="btn btn-sm px-3"
          :class="{
            [`bg-primary text-white`]: currentMode === mode,
            [`btn-light text-primary`]: currentMode !== mode
          }"
          @click="currentMode = mode"
        >
          Bitcoin Core {{ mode }}
        </b-button>
      </div>
      <div>
      <p class="text-muted mb-md-4">
        Connect any wallet that supports Bitcoin Core's <span class="text-uppercase">{{ currentMode }}</span> connection to your node using these details
      </p>
      </div>
      <div class="row flex-column-reverse flex-lg-row">
        <div class="col-12 col-lg-4">
          <!-- QR Code -->
          <qr-code
            :value="
              currentMode === 'rpc'
                ? rpc.connectionString
                : p2p.connectionString
            "
            :size="180"
            class="qr-image mx-auto mx-md-0 mt-4 mt-md-0"
            showLogo
          ></qr-code>
        </div>
        <div class="col-12 col-lg-8 align-items-center">
          <!-- RPC Section -->
          <div v-if="currentMode === 'rpc'">
            <b-row>
              <b-col cols="12" md="6">
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold"
                    >Bitcoin Core RPC Username</small
                  ></label
                >
                <input-copy
                  v-if="rpc.rpcuser"
                  class="mb-2"
                  size="sm"
                  :value="rpc.rpcuser"
                ></input-copy>
                <span
                  class="loading-placeholder loading-placeholder-lg mt-1"
                  style="width: 100%;"
                  v-else
                ></span>
              </b-col>

              <b-col cols="12" md="6">
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold"
                    >Bitcoin Core RPC Password</small
                  ></label
                >
                <input-copy
                  v-if="rpc.rpcpassword"
                  class="mb-2"
                  size="sm"
                  :value="rpc.rpcpassword"
                ></input-copy>
                <span
                  class="loading-placeholder loading-placeholder-lg mt-1"
                  style="width: 100%;"
                  v-else
                ></span>
              </b-col>

              <b-col cols="12" md="6">
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold"
                    >Bitcoin Core RPC Address (Host)</small
                  ></label
                >
                <input-copy
                  v-if="rpc.address"
                  class="mb-2"
                  size="sm"
                  :value="rpc.address"
                ></input-copy>
                <span
                  class="loading-placeholder loading-placeholder-lg mt-1"
                  style="width: 100%;"
                  v-else
                ></span>
              </b-col>

              <b-col cols="12" md="6">
                <label class="mb-1 d-block"
                  ><small class="font-weight-bold"
                    >Bitcoin Core RPC Port</small
                  ></label
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
          <!-- P2P Section -->
          <div v-if="currentMode === 'p2p'">
            <label class="mb-1 d-block"
              ><small class="font-weight-bold"
                >Bitcoin Core P2P Address (Host)</small
              ></label
            >
            <div v-if="p2p.address">
              <input-copy
                class="mb-2"
                size="sm"
                :value="p2p.address"
              ></input-copy>
            </div>
            <label class="mb-1 d-block"
              ><small class="font-weight-bold"
                >Bitcoin Core P2P Port</small
              ></label
            >
            <div v-if="p2p.port">
              <input-copy class="mb-2" size="sm" :value="p2p.port"></input-copy>
            </div>
            <span
              class="loading-placeholder loading-placeholder-lg mt-1"
              style="width: 100%;"
              v-else
            ></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import QrCode from "@/components/Utility/QrCode";
import InputCopy from "@/components/Utility/InputCopy";

export default {
  data() {
    return {
      currentMode: "rpc",
      modes: ["rpc", "p2p"]
    };
  },
  computed: {
    ...mapState({
      rpc: state => state.bitcoin.rpc,
      p2p: state => state.bitcoin.p2p
    })
  },
  components: {
    QrCode,
    InputCopy
  }
};
</script>
