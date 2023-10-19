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

        <!-- PEER SETTINGS -->
        <b-card no-body class="setting-group-container mb-2">
          <b-card-header v-b-toggle.peer-settings header-tag="header" class="setting-group-header px-2 px-sm-3 d-flex justify-content-between align-items-center" role="tab">
            <div :class="{'fade-in-out': !hasLoadedSettings}">
              <p class="setting-group-title mb-1 font-weight-bold">Peer Settings</p>
              <small class="d-block text-muted">
                Configure how your node connects and interacts with peers (other nodes) on the network.
              </small>
            </div>
            <b-icon class="when-closed ml-2 text-muted" icon="plus" variant="secondary"></b-icon><b-icon class="when-open ml-2 text-muted" icon="dash" variant="secondary"></b-icon>
          </b-card-header>
          <b-collapse v-if="hasLoadedSettings" class="setting-group-body bg-light" id="peer-settings" accordion="peer-settings" role="tabpanel">

            <!-- OUTGOING CLEARNET PEERS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="clearnet">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Outgoing Connections to Clearnet Peers
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          onlynet
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Connect to peers available on the clearnet (publicly accessible internet).
                </small>
              </div>
            </b-card-body>

            <!-- OUTGOING TOR PEERS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="tor">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Outgoing Connections to Tor Peers
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          onlynet
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Connect to peers available on the Tor network.
                </small>
              </div>
            </b-card-body>

            <!-- CONNECT TO ALL CLEARNET PEERS OVER TOR -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="w-75">
                    <label class="mb-0" for="proxy">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Make All Outgoing Connections to Clearnet Peers Over Tor
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          proxy
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Connect to peers available on the clearnet via Tor to preserve your anonymity at the cost of slightly less security.
                </small>
              </div>
            </b-card-body>

            <!-- CONNECT TO I2P PEERS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="w-75">
                    <label class="mb-0" for="I2P">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Outgoing Connections to I2P Peers
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          onlynet
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Connect to peers available on the I2P network.
                </small>
              </div>
            </b-card-body>

            <!-- INCOMING CONNECTIONS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="w-75">
                    <label class="mb-0" for="allow-incoming-connections">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Incoming Connections
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          listen | listenonion | i2pacceptincoming
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="allow-incoming-connections"
                      class="align-self-center"
                      :on="settings.incomingConnections"
                      @toggle="status => (settings.incomingConnections = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Broadcast your node to the Bitcoin network to help other nodes 
                  access the blockchain. You may need to set up port forwarding on 
                  your router to allow incoming connections from clearnet-only peers.
                </small>
              </div>
            </b-card-body>

          </b-collapse>
        </b-card>

         <!-- OPTIMIZATION SETTINGS -->
         <b-card no-body class="setting-group-container mb-2">
          <b-card-header v-b-toggle.optimization-settings header-tag="header" class="setting-group-header px-2 px-sm-3 d-flex justify-content-between align-items-center" role="tab">
            <!-- IMPLEMENT HASLOADEDSETTINGS -->
            <div :class="{'fade-in-out': !hasLoadedSettings}">
              <p class="setting-group-title mb-1 font-weight-bold">Optimization</p>
              <small class="d-block text-muted">
                Fine tune the performance and resource usage of your node.
              </small>
            </div>
            <b-icon class="when-closed ml-2 text-muted" icon="plus" variant="secondary"></b-icon><b-icon class="when-open ml-2 text-muted" icon="dash" variant="secondary"></b-icon>
          </b-card-header>
          <b-collapse v-if="hasLoadedSettings" class="setting-group-body bg-light" id="optimization-settings" accordion="optimization-settings" role="tabpanel">
          
            <!-- DB CACHE -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="cache-size">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Cache Size
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          dbcache
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="MB">
                      <b-form-input
                        class="advanced-settings-input"
                        id="cache-size"
                        type="number"
                        v-model="settings.cacheSizeMB"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Choose the size of the UTXO set to store in RAM. A larger cache can 
                  speed up the initial synchronization of your Bitcoin node, but after 
                  the initial sync is complete, a larger cache value does not significantly 
                  improve performance and may use more RAM than needed.
                </small>
              </div>
            </b-card-body>

            <!-- RBF -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="mempool">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Replace-By-Fee (RBF) for All Transactions
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          mempoolfullrbf
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Allow any transaction in the mempool of your Bitcoin node to be replaced with
                  a newer version of the same transaction that includes a higher fee.
                </small>
              </div>
            </b-card-body>

            <!-- PRUNE -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="prune-old-blocks">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Prune Old Blocks
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          prune
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Save storage space by pruning (deleting) old blocks and keeping only 
                  a limited copy of the blockchain. Use the slider to choose the size 
                  of the blockchain you want to store. It may take some time for your 
                  node to be online after you turn on pruning. If you turn off pruning 
                  after turning it on, you'll need to download the entire blockchain 
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
            </b-card-body>

          </b-collapse>
        </b-card>

        <!-- RPC & REST SETTINGS -->
        <b-card no-body class="setting-group-container mb-2">
          <b-card-header v-b-toggle.rpc-rest-settings header-tag="header" class="setting-group-header px-2 px-sm-3 d-flex justify-content-between align-items-center" role="tab">
            <!-- IMPLEMENT HASLOADEDSETTINGS -->
            <div :class="{'fade-in-out': !hasLoadedSettings}">
              <p class="setting-group-title mb-1 font-weight-bold">RPC and REST</p>
              <small class="d-block text-muted">
                Configure RPC and REST API access to your node.
              </small>
            </div>
            <b-icon class="when-closed ml-2 text-muted" icon="plus" variant="secondary"></b-icon><b-icon class="when-open ml-2 text-muted" icon="dash" variant="secondary"></b-icon>
          </b-card-header>
          <b-collapse v-if="hasLoadedSettings" class="setting-group-body bg-light" id="rpc-rest-settings" accordion="rpc-rest-settings" role="tabpanel">
            
            <!-- RBF -->
            <!-- TODO: move to a "Transactions" accordion if we add additional transaction options -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="rest">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                       Public REST API
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          rest
                        </span>
                      </p>
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
                <small class="w-lg-75 d-block text-muted mt-1">
                  Public REST API can help you connect certain wallets and apps to your node. However, because the REST API access is unauthenticated, it can lead to unauthorized access, denial-of-service (DoS) attacks, and such.
                </small>
              </div>
            </b-card-body>
          </b-collapse>
        </b-card>

        <!-- CHAIN SELECTION SETTINGS -->
        <b-card no-body class="setting-group-container mb-2">
          <b-card-header v-b-toggle.chain-selection-settings header-tag="header" class="setting-group-header px-2 px-sm-3 d-flex justify-content-between align-items-center" role="tab">
            <!-- IMPLEMENT HASLOADEDSETTINGS -->
            <div :class="{'fade-in-out': !hasLoadedSettings}">
              <p class="setting-group-title mb-1 font-weight-bold">Network Selection</p>
              <small class="d-block text-muted">
                Switch between mainnet, testnet, regtest, and signet.
              </small>
            </div>
            <b-icon class="when-closed ml-2 text-muted" icon="plus" variant="secondary"></b-icon><b-icon class="when-open ml-2 text-muted" icon="dash" variant="secondary"></b-icon>
          </b-card-header>
          <b-collapse v-if="hasLoadedSettings" class="setting-group-body bg-light" id="chain-selection-settings" accordion="chain-selection-settings" role="tabpanel">
            
            <!-- CHAIN SELECTION -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="chain">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Blockchain
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          chain
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-form-select
                      id="network"
                      v-model="settings.network"
                      :options="networks"
                    ></b-form-select>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Choose which blockchain your node will connect to. 
                  If you change the chain, restart your Umbrel to make sure any 
                  apps connected to your node continue to work properly.
                </small>
              </div>
            </b-card-body>
          </b-collapse>
        </b-card>

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
    hasLoadedSettings() {
      return Object.keys(this.settings).length > 0;
    },
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
.setting-group-container {
  border: 1px solid #e9ecef !important;
  border-radius: 0.5rem;

  .setting-group-header {
    cursor: pointer;
    background-color: transparent;
  }

  .collapsed > .when-open,
  .not-collapsed > .when-closed {
    display: none;
  }

  .setting-group-body {
    border-radius: 0 0 0.5rem 0.5rem;

    .subsetting-body {
      border-bottom: 1px solid #e9ecef;
  
      .subsetting-title {
        font-size: 0.9rem;
      }

      .subsetting-config-name {
        font-size: 0.65rem;
        opacity: 0.6;
        margin-top: 0.1rem;
      }

      .input-container {
        width: 100%;
        max-width: 130px;

        .input-group-text {
          font-size: 0.85rem !important;
        }
      }

      .input-time {
        .input-group-append {
          .custom-select {

            font-size: 0.85rem !important;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
            cursor: pointer;

            &:focus {
              box-shadow: none;
            }
          }
        }
      }

      .advanced-settings-input {
        font-size: 0.85rem !important;

        &:focus {
        box-shadow: none;
        }
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
</style>
