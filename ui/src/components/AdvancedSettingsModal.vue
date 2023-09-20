<template v-slot:modal-header="{ close }" title="Advanced Settings">
  <b-form @submit.prevent="submit">
    <div
      class="px-0 px-sm-3 pb-3 d-flex flex-column justify-content-between w-100"
    >
      <h3 class="mt-1">Advanced Settings</h3>
      <b-alert variant="warning" show class="mb-3">
        <small>
          Be careful when changing the settings below as they may cause issues 
          with other apps on your Umbrel that connect to your Bitcoin node. Only make 
          changes if you understand the potential effects on connected apps or 
          wallets.
        </small>
      </b-alert>

      <b-overlay :show="isSettingsDisabled" rounded="sm">
        <div
          class="advanced-settings-container d-flex flex-column p-3 pb-sm-3 bg-light mb-2"
        >
          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="clearnet">
                  <p class="font-weight-bold mb-0">Outgoing Connections to Clearnet Peers</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="clearnet"
                  class="align-self-center"
                  :on="settings.clearnet"
                  @toggle="status => (settings.clearnet = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Connect to peers available on the clearnet (publicly accessible internet).
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="tor">
                  <p class="font-weight-bold mb-0">Outgoing Connections to Tor Peers</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="tor"
                  class="align-self-center"
                  :on="settings.tor"
                  @toggle="status => (settings.tor = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Connect to peers available on the Tor network.
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="proxy">
                  <p class="font-weight-bold mb-0">Connect to all Clearnet Peers over Tor</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="proxy"
                  class="align-self-center"
                  :on="settings.torProxyForClearnet"
                  :disabled="isTorProxyDisabled"
                  :tooltip="torProxyTooltip"
                  @toggle="status => (settings.torProxyForClearnet = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Connect to peers available on the clearnet via Tor to preserve your anonymity at the cost of slightly less security.
            </small>
          </div>


          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="I2P">
                  <p class="font-weight-bold mb-0">Outgoing Connections to I2P Peers</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="I2P"
                  class="align-self-center"
                  :on="settings.i2p"
                  @toggle="status => (settings.i2p = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Connect to peers available on the I2P network.
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="allow-incoming-connections">
                  <p class="font-weight-bold mb-0">Incoming Connections</p>
                </label>
              </div>
              <div class="">
                <toggle-switch
                  id="allow-incoming-connections"
                  class="align-self-center"
                  :on="settings.incomingConnections"
                  @toggle="status => (settings.incomingConnections = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Broadcast your node to the Bitcoin network to help other nodes 
              access the blockchain. You may need to set up port forwarding on 
              your router to allow incoming connections from clearnet-only peers.
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="cache-size">
                  <p class="font-weight-bold mb-0">Cache Size (MB)</p>
                </label>
              </div>
              <div class="">
                <b-form-input
                  class="advanced-settings-input"
                  id="cache-size"
                  type="number"
                  v-model="settings.cacheSizeMB"
                ></b-form-input>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Choose the size of the UTXO set to store in RAM. A larger cache can 
              speed up the initial synchronization of your Bitcoin node, but after 
              the initial sync is complete, a larger cache value does not significantly 
              improve performance and may use more RAM than needed.
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="mempool">
                  <p class="font-weight-bold mb-0">Replace-By-Fee (RBF) for All Transactions</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="mempool"
                  class="align-self-center"
                  :on="settings.mempoolFullRbf"
                  @toggle="status => (settings.mempoolFullRbf = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Allow any transaction in the mempool of your Bitcoin node to be replaced with
              a newer version of the same transaction that includes a higher fee.
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="rest">
                  <p class="font-weight-bold mb-0">Enable REST API</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="rest"
                  class="align-self-center"
                  :on="settings.rest"
                  @toggle="status => (settings.rest = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Accept public REST requests to your node. Be sure to understand the risks and limitations of an unauthenticated REST interface before enabling this feature.
            </small>
          </div>

          <hr class="advanced-settings-divider" />

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="prune-old-blocks">
                  <p class="font-weight-bold mb-0">Prune Old Blocks</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="prune-old-blocks"
                  class="align-self-center"
                  :on="settings.prune.enabled"
                  @toggle="status => (settings.prune.enabled = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Save storage space by pruning (deleting) old blocks and keeping only 
              a limited copy of the blockchain. Use the slider to choose the size 
              of the blockchain you want to store. It may take some time for your 
              node to be online after you turn on pruning. If you turn off pruning 
              after turning it on, you'll need to download the entire blockchain 
              again.
            </small>
            <prune-slider
              id="prune-old-blocks"
              class="mt-3 mb-3"
              :minValue="1"
              :maxValue="maxPruneSizeGB"
              :startingValue="settings.prune.pruneSizeGB"
              :disabled="!settings.prune.enabled"
              @change="value => (settings.prune.pruneSizeGB = value)"
            ></prune-slider>
          </div>

          <hr class="advanced-settings-divider" />

          <!-- <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="reindex-blockchain">
                  <p class="font-weight-bold mb-0">Reindex Blockchain</p>
                </label>
              </div>
              <div>
                <toggle-switch
                  id="reindex-blockchain"
                  class="align-self-center"
                  :on="settings.reindex"
                  @toggle="status => (settings.reindex = status)"
                ></toggle-switch>
              </div>
            </div>
            <small class="w-sm-75 d-block text-muted mt-1">
              Rebuild the database index used by your Bitcoin node. This can 
              be useful if the index becomes corrupted.
            </small>
          </div>

          <hr class="advanced-settings-divider" /> -->

          <div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="w-75">
                <label class="mb-0" for="network">
                  <p class="font-weight-bold mb-0">Network</p>
                </label>
              </div>

              <div>
                <b-form-select
                  id="network"
                  v-model="settings.network"
                  :options="networks"
                ></b-form-select>
              </div>
            </div>
          </div>
          <small class="w-sm-75 d-block text-muted mt-1">
            Choose which network you want your Bitcoin node to connect to. 
            If you change the network, restart your Umbrel to make sure any 
            apps connected to your Bitcoin node continue to work properly.
          </small>
        </div>

        <!-- template overlay with empty div to show an overlay with no spinner -->
        <template #overlay>
          <div></div>
        </template>
      </b-overlay>

      <b-alert variant="warning" :show="showOutgoingConnectionsError" class="mt-2" @dismissed="showOutgoingConnectionsError=false">
        <small>
          Please choose at least one source for outgoing connections (Clearnet, Tor, or I2P).
        </small>
      </b-alert>

      <div class="mt-2 mb-2">
        <b-row>
          <b-col cols="12" lg="6">
            <b-button @click="clickRestoreDefaults" class="btn-border" variant="outline-secondary" block :disabled="isSettingsDisabled">
              Restore Default Settings</b-button
            >
          </b-col>
          <b-col cols="12" lg="6">
            <b-button class="mt-2 mt-lg-0" variant="success" type="submit" block :disabled="isSettingsDisabled">
              Save and Restart Bitcoin Node</b-button
            >
          </b-col>
        </b-row>
      </div>
    </div>
  </b-form>
</template>

<script>
import cloneDeep from "lodash.clonedeep";

import { mapState } from "vuex";
import ToggleSwitch from "./Utility/ToggleSwitch.vue";
import PruneSlider from "./PruneSlider.vue";

export default {
  data() {
    return {
      settings: {},
      networks: [
        { value: "main", text: "mainnet" },
        { value: "test", text: "testnet" },
        { value: "signet", text: "signet" },
        { value: "regtest", text: "regtest" }
      ],
      maxPruneSizeGB: 300,
      showOutgoingConnectionsError: false
    };
  },
  computed: {
    ...mapState({
      bitcoinConfig: state => state.user.bitcoinConfig,
      rpc: state => state.bitcoin.rpc,
      p2p: state => state.bitcoin.p2p
    }),
    isTorProxyDisabled() {
      return !this.settings.clearnet || !this.settings.tor;
    },
    torProxyTooltip() {
      if (!this.settings.clearnet || !this.settings.tor) {
        return "Outgoing connections to both clearnet and Tor peers must be enabled to turn this on.";
      } else {
        return "";
      }
    }
  },
  watch: {
    isTorProxyDisabled(value) {
      if (!value) return;
      this.settings.torProxyForClearnet = false;
    }
  },
  props: {
    isSettingsDisabled: {
      type: Boolean,
      default: false
    }
  },
  created() {
    this.setSettings();
  },
  components: {
    ToggleSwitch,
    PruneSlider
  },
  methods: {
    submit() {
      this.showOutgoingConnectionsError = false;
      if (!this.isOutgoingConnectionsValid()) return this.showOutgoingConnectionsError = true;
      this.$emit("submit", this.settings);
    },
    clickRestoreDefaults() {
      if (window.confirm("Are you sure you want to restore the default settings?")) {
        this.$emit("clickRestoreDefaults");
      }
    },
    setSettings() {
      // deep clone bitcoinConfig in order to properly reset state if user hides modal instead of clicking the save and restart button
      this.settings = cloneDeep(this.bitcoinConfig);
    },
    isOutgoingConnectionsValid() {
      return this.settings.clearnet || this.settings.tor || this.settings.i2p;
    }
  }
};
</script>

<!-- removed scoped in order to place scrollbar on bootstrap-vue .modal-body. Increased verbosity on other classes-->
<style lang="scss">
.advanced-settings-container {
  border-radius: 1rem;
  .advanced-settings-divider {
    // same styles as bootstrap <b-dropdown-divider/>
    height: 0;
    margin: 1.25rem 0;
    overflow: hidden;
    border-top: 1px solid #e9ecef;
  }
  .advanced-settings-input {
    max-width: 75px;
  }
  // to remove arrows on number input field
  .advanced-settings-input::-webkit-outer-spin-button, .advanced-settings-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .advanced-settings-input[type="number"] {
    -moz-appearance: textfield;
  }
}

.btn-border {
  border: solid 1px !important;
}

.modal-body::-webkit-scrollbar {
  width: 5px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
  margin-block-end: 1rem;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

/* sm breakpoint */
@media (min-width: 576px) {
  .w-sm-75 { 
    width: 75% !important;
  }
}
</style>
