<template v-slot:modal-header="{ close }" title="connect to bitcoin core">
  <div
    class="px-2 px-sm-3 pt-2 d-flex flex-column justify-content-between w-100 mt-n4"
  >
    <h3 class="text-lowercase">Connect to bitcoin core</h3>
    <div class="px-2 px-sm-3 pb-2 pb-sm-3 mt-3">
      <div class="row flex-column-reverse flex-lg-row">
        <div class="col-12 col-lg-4 mt-4 lg-mt-0">
          <!-- QR Code -->
          <qr-code
            :value="
              currentMode === 'rpc'
                ? rpc.connectionString
                : p2p.connectionString
            "
            :size="180"
            class="qr-image mx-auto"
            showLogo
          ></qr-code>
        </div>
        <div class="col-12 col-lg-8 align-items-center">
          <!-- BUTTONS -->
          <div
            class="d-flex d-lg-inline-block btn-group border border-primary rounded mb-2"
            role="group"
            aria-label="Basic example"
          >
            <b-button
              v-for="mode in modes"
              :key="mode"
              class="btn btn-sm"
              :class="{
                [`bg-primary text-white`]: currentMode === mode,
                [`btn-light text-primary`]: currentMode !== mode
              }"
              @click="currentMode = mode"
            >
              Bitcoin Core {{ mode }}
            </b-button>
          </div>
          <!-- RPC Section -->
          <div v-if="currentMode === 'rpc'">
            <p>
              Connect any wallet that supports Bitcoin Core's RPC connection
              using the following details
            </p>
            <label class="mb-1 d-block"
              ><small class="ml-1 font-weight-bold"
                >Bitcoin Core RPC Username</small
              ></label
            >
            <div v-if="rpc.rpcuser">
              <input-copy
                class="mb-2"
                size="sm"
                :value="rpc.rpcuser"
              ></input-copy>
            </div>
            <span
              class="loading-placeholder loading-placeholder-lg mt-1"
              style="width: 100%;"
              v-else
            ></span>
            <label class="mb-1 d-block"
              ><small class="ml-1 font-weight-bold"
                >Bitcoin Core RPC Password</small
              ></label
            >
            <div v-if="rpc.rpcpassword">
              <input-copy
                class="mb-2"
                size="sm"
                :value="rpc.rpcpassword"
              ></input-copy>
            </div>
            <span
              class="loading-placeholder loading-placeholder-lg mt-1"
              style="width: 100%;"
              v-else
            ></span>
            <label class="mb-1 d-block"
              ><small class="ml-1 font-weight-bold"
                >Bitcoin Core RPC Address (Host)</small
              ></label
            >
            <div v-if="rpc.address">
              <input-copy
                class="mb-2"
                size="sm"
                :value="rpc.address"
              ></input-copy>
            </div>
            <span
              class="loading-placeholder loading-placeholder-lg mt-1"
              style="width: 100%;"
              v-else
            ></span>
            <label class="mb-1 d-block"
              ><small class="ml-1 font-weight-bold"
                >Bitcoin Core RPC Port</small
              ></label
            >
            <div v-if="rpc.port">
              <input-copy class="mb-2" size="sm" :value="rpc.port"></input-copy>
            </div>
            <span
              class="loading-placeholder loading-placeholder-lg mt-1"
              style="width: 100%;"
              v-else
            ></span>
          </div>
          <!-- P2P Section -->
          <div v-if="currentMode === 'p2p'">
            <p>
              Connect any wallet that supports Bitcoin Core's P2P connection
              using the following details
            </p>
            <label class="mb-1 d-block"
              ><small class="ml-1 font-weight-bold"
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
              ><small class="ml-1 font-weight-bold"
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

<style lang="scss" scoped>
.tx-chart-filter-button {
  text-transform: none;
  background: transparent;
  padding: 0.55em 0.8em;
  border-radius: 100%;
  margin: 0 0.25em;
}
</style>
