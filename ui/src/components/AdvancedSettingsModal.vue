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

            <!-- PEERBLOCKFILTERS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="w-75">
                    <label class="mb-0" for="peerblockfilters">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Peer Block Filters
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          peerblockfilters
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="peerblockfilters"
                      class="align-self-center"
                      :on="settings.peerblockfilters"
                      @toggle="status => (settings.peerblockfilters = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  <p>
                    Share compact block filter data with connected light clients (like wallets) connected to your node, allowing them to get only the transaction information they are
                    interested in from your node without having to download the entire blockchain. Enabling this will automatically enable Block Filter Index below. 
                  </p>
                  <p class="mb-0">
                    Note: If you disable Peer Block Filters, you will need to also manually toggle off Block Filter Index if you
                    want to stop storing block filter data.
                  </p>
                </small>
              </div>
            </b-card-body>

            <!-- BLOCKFILTERINDEX -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="w-75">
                    <label class="mb-0" for="blockfilterindex">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Block Filter Index
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          blockfilterindex
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="blockfilterindex"
                      class="align-self-center"
                      :on="settings.blockfilterindex"
                      :disabled="isPeerBlockFiltersEnabled"
                      :tooltip="blockFilterIndexTooltip"
                      @toggle="status => (settings.blockfilterindex = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  <p>
                    Store an index of compact block filters which allows faster wallet re-scanning.
                    In order to serve compact block filters to peers, you must also enable Peer Block Filters above.
                  </p>
                  <p class="mb-0">
                    Note: To use 'Block Filter Index' with a pruned node, you must enable it when you start the 'Prune Old Blocks' process under the Optimization category.
                    If your node is already pruned and 'Block Filter Index' is off, enabling it will prevent your node from starting. To fix this while keeping 'Block Filter Index' on, you will need to either reindex your node or turn off 'Prune Old Blocks'.
                  </p>
                </small>
              </div>
            </b-card-body>

            <!-- PEERBLOOMFILTERS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="w-75">
                    <label class="mb-0" for="peerbloomfilters">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Peer Bloom Filters
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          peerbloomfilters
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="peerbloomfilters"
                      class="align-self-center"
                      :on="settings.peerbloomfilters"
                      @toggle="status => (settings.peerbloomfilters = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  <p>
                    Enable support for BIP37, a feature used by older light clients (like wallets) to get only the transaction information they are interested in from your node without having to download the entire blockchain.
                  </p>
                  <p class="mb-0">
                    Note: Bloom filters can have privacy and denial-of-service (DoS) risks, especially if your node is publicly reachable; its use is discouraged in favour of the more modern compact block filters.
                  </p>
                </small>
              </div>
            </b-card-body>

            <!-- BANTIME -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="bantime">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Peer Ban Time
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          bantime
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="sec">
                      <b-form-input
                        class="advanced-settings-input"
                        id="bantime"
                        type="number"
                        v-model="settings.bantime"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the duration (in seconds) that a peer will be banned from connecting to your node if they violate protocol rules or exhibit suspicious behavior.
                  By adjusting bantime, you can maintain your node's security and network integrity, while preventing repeat offenders from causing disruptions.
                  A longer bantime increases the ban period, discouraging misbehavior, while a shorter bantime allows for quicker reconnections but may require more frequent manual monitoring of peer activity.
                </small>
              </div>
            </b-card-body>

            <!-- MAXCONNECTIONS -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxconnections">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Peer Connections
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxconnections
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group>
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxconnections"
                        type="number"
                        v-model="settings.maxconnections"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum number of peers your node can connect to simultaneously. By managing this, you can optimize your node's network usage and system resources based on your device's capacity.
                  A higher value enables your node to maintain more connections, potentially improving network stability and data sharing. A lower value conserves system resources and bandwidth,
                  which may be beneficial for devices with limited capabilities.
                </small>
              </div>
            </b-card-body>

            <!-- MAXRECEIVEBUFFER -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxreceivebuffer">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Receive Buffer
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxreceivebuffer
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="KB">
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxreceivebuffer"
                        type="number"
                        v-model="settings.maxreceivebuffer"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum amount of memory (in kilobytes) allocated for storing incoming data from other nodes in the network.
                  A larger buffer size allows your node to handle more incoming data simultaneously, while a smaller size reduces memory consumption but may limit the amount of data your node can process at once.
                </small>
              </div>
            </b-card-body>

            <!-- MAXSENDBUFFER -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxsendbuffer">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Send Buffer
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxsendbuffer
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="KB">
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxsendbuffer"
                        type="number"
                        v-model="settings.maxsendbuffer"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum memory (in kilobytes) dedicated to storing outgoing data sent to other nodes in the network.
                  A larger buffer size enables your node to send more data simultaneously, while a smaller size conserves memory but may
                  restrict the volume of data your node can transmit at once.
                </small>
              </div>
            </b-card-body>

            <!-- MAXTIMEADJUSTMENT -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxtimeadjustment">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Time Adjustment
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxtimeadjustment
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="sec">
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxtimeadjustment"
                        type="number"
                        v-model="settings.maxtimeadjustment"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum allowed time adjustment (in seconds) your node can make based on the time data received from other nodes in the network.
                  By controlling it, you can maintain your node's time accuracy while reducing the risk of incorrect time adjustments that could affect block validation and other time-sensitive processes.
                  A lower value provides a stricter limit on time corrections, while a higher value allows more flexibility based on network data.
                </small>
              </div>
            </b-card-body>

            <!-- PEERTIMEOUT -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="peertimeout">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Peer Timeout
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          peertimeout
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="sec">
                      <b-form-input
                        class="advanced-settings-input"
                        id="peertimeout"
                        type="number"
                        v-model="settings.peertimeout"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum time (in seconds) that your node will wait for a response from a connected peer before considering it unresponsive and disconnecting.
                  Adjusting peertimeout helps you maintain stable connections with responsive peers while ensuring your node doesn't waste resources on unresponsive ones.
                  A shorter timeout value allows for quicker disconnection from unresponsive peers, while a longer timeout provides more time for slow-responding peers to maintain a connection.
                </small>
              </div>
            </b-card-body>

            <!-- TIMEOUT -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="timeout">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Connection Timeout
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          timeout
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="ms">
                      <b-form-input
                        class="advanced-settings-input"
                        id="timeout"
                        type="number"
                        v-model="settings.timeout"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum time (in seconds) that your node will wait for a response from a newly connecting peer during the initial handshake process before considering it unresponsive and disconnecting.
                  Fine-tuning it helps you ensure your node establishes stable connections with responsive peers while avoiding unresponsive ones. A shorter timeout value leads to faster disconnection from unresponsive peers,
                  while a longer timeout allows more time for slow-responding peers to complete the handshake.
                </small>
              </div>
            </b-card-body>

            <!-- MAX UPLOAD TARGET -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxuploadtarget">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Upload Target
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxuploadtarget
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="MB/24hr">
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxuploadtarget"
                        type="number"
                        v-model="settings.maxuploadtarget"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                
                <small class="w-lg-75 d-block text-muted mt-1">
                  <p>
                    Limit the maximum amount of data (in MB) your node will upload to other peers in the network within a 24-hour period. Setting this to 0 (default) means that there is no limit.
                    By adjusting it, you can optimize your node's bandwidth usage and maintain a balance between sharing data with the network and conserving your internet resources.
                    A higher upload target allows your node to contribute more data to the network, while a lower target helps you save bandwidth for other uses.
                  </p>
                  <p class="mb-0">
                    Note: Peers that are whitelisted are exempt from this limit. By default, your node whitelists apps on your Umbrel (e.g., Electrs).
                    However, external apps and wallets that are connected via the P2P port may fail to receive data from your node if your node hits the 24-hour upload limit.
                  </p>
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

            <!-- RBF -->
            <!-- consider move to a Transactions accordion group -->
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

            <!-- DATACARRIER -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="mempool">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Relay Transactions Containing Arbitrary Data
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          datacarrier
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="datacarrier"
                      class="align-self-center"
                      :on="settings.datacarrier"
                      @toggle="status => (settings.datacarrier = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Relay transactions with OP_RETURN outputs.
                </small>
              </div>
            </b-card-body>

            <!-- DATACARRIERSIZE -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="mempoolexpiry">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Allowed Size of Arbitrary Data in Transactions
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          datacarriersize
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="bytes">
                      <b-form-input
                        class="advanced-settings-input"
                        id="datacarriersize"
                        type="number"
                        v-model="settings.datacarriersize"
                        number
                        :disabled="!settings.datacarrier"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  <p>
                    Set the maximum size of the data in OP_RETURN outputs (in bytes) that your node will relay.
                  </p>
                  <p class="mb-0">
                    Note: datacarrier must be enabled for this setting to take effect.
                  </p>
                </small>
              </div>
            </b-card-body>

            <!-- PERMITBAREMULTISIG -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="mempool">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Relay Bare Multisig Transactions
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          permitbaremultisig
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="permitbaremultisig"
                      class="align-self-center"
                      :on="settings.permitbaremultisig"
                      @toggle="status => (settings.permitbaremultisig = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Relay non-P2SH multisig transactions.
                </small>
              </div>
            </b-card-body>

            <!-- MAXMEMPOOL -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxmempool">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Maximum Mempool Size
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxmempool
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="MB">
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxmempool"
                        type="number"
                        v-model="settings.maxmempool"
                        number
                        autocomplete="off"
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum size that your node will allocate (in RAM) for storing unconfirmed transactions before they are included in a block.
                  By adjusting maxmempool, you can optimize your node's performance and balance memory usage based on your device's capabilities.
                  A larger maxmempool allows your node to store more unconfirmed transactions, providing more accurate statistics on explorer apps like Mempool.
                </small>
              </div>
            </b-card-body>

            <!-- MEMPOOLEXPIRY -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="mempoolexpiry">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Mempool Expiration
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          mempoolexpiry
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="hr">
                      <b-form-input
                        class="advanced-settings-input"
                        id="mempoolexpiry"
                        type="number"
                        v-model="settings.mempoolexpiry"
                        number
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the time threshold (in hours) for unconfirmed transactions to remain in your node's mempool before being removed.
                  By adjusting it, you can manage your node's memory usage and ensure outdated, unconfirmed transactions are discarded.
                  A shorter expiry time helps keep your mempool up-to-date and reduces memory usage, while a longer expiry time allows transactions
                  to remain in the pool for an extended period in case of network congestion or delayed confirmations.
                </small>
              </div>
            </b-card-body>

            <!-- PERSISTMEMPOOL -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="persistmempool">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Persist Mempool
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          persistmempool
                        </span>
                      </p>
                    </label>
                  </div>
                  <div>
                    <toggle-switch
                      id="persistmempool"
                      class="align-self-center"
                      :on="settings.persistmempool"
                      @toggle="status => (settings.persistmempool = status)"
                    ></toggle-switch>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Saves unconfirmed transactions in your node's mempool when it's shutting down and reloads them upon startup.
                  Enabling this setting helps maintain a consistent mempool and prevents the loss of unconfirmed transactions during a restart.
                  Disabling this setting will clear the mempool upon restart, which may reduce startup time but requires your node to rebuild its mempool from scratch.
                </small>
              </div>
            </b-card-body>

            <!-- MAXORPHANTX -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="maxorphantx">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        Max Orphan Transactions
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          maxorphantx
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="txs">
                      <b-form-input
                        class="advanced-settings-input"
                        id="maxorphantx"
                        type="number"
                        v-model="settings.maxorphantx"
                        number
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum number of orphan transactions (transactions missing one or more of their inputs) that your node will keep in memory.
                  By fine-tuning it, you can optimize your node's memory usage and manage its performance based on your device's capabilities.
                  A larger limit allows your node to store more orphan transactions, potentially increasing the chances of finding missing inputs.
                  A smaller limit conserves memory but will result in your node evicting some orphan transactions from memory when the limit is reached.
                </small>
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
            
            <!-- REST -->
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
                  Enabling the public REST API can help you connect certain wallets and apps to your node. However, because the REST API access is unauthenticated, it can lead to unauthorized access, privacy degradation, and denial-of-service (DoS) attacks.
                </small>
              </div>
            </b-card-body>

            <!-- RPC WORK QUEUE SIZE -->
            <b-card-body class="subsetting-body px-2 px-sm-3">
              <div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="flex-sm-grow-1">
                    <label class="mb-0" for="rpcworkqueue">
                      <p class="subsetting-title font-weight-bold mb-0 mr-1">
                        RPC Work Queue Size
                        <span class="subsetting-config-name text-monospace font-weight-normal d-block">
                          rpcworkqueue
                        </span>
                      </p>
                    </label>
                  </div>
                  <div class="input-container ml-1">
                    <b-input-group append="threads">
                      <b-form-input
                        class="advanced-settings-input"
                        id="rpcworkqueue"
                        type="number"
                        v-model="settings.rpcworkqueue"
                        number
                      ></b-form-input>
                    </b-input-group>
                  </div>
                </div>
                <small class="w-lg-75 d-block text-muted mt-1">
                  Set the maximum number of queued Remote Procedure Call (RPC) requests your node can handle
                  (e.g., from connected wallets or other apps), helping you strike a balance between performance and resource usage.
                  Higher values can improve processing speed at the cost of increased system resources.
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

      <b-alert variant="danger" :show="validationErrors.length > 0" class="error-message mt-3 mb-0" dismissible @dismissed="validationErrors.length === 0">
        <p class="mb-0">Please fix the following errors and try again:</p>
        <ul class="mb-0 pl-3">
          <li v-for="error in validationErrors" :key="error">
            {{ error }}
          </li>
        </ul>
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
        { value: "test", text: "testnet3" },
        { value: "testnet4", text: "testnet4" },
        { value: "signet", text: "signet" },
        { value: "regtest", text: "regtest" }
      ],
      maxPruneSizeGB: 300
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
    },
    isPeerBlockFiltersEnabled() {
      return this.settings.peerblockfilters;
    },
    blockFilterIndexTooltip() {
      if (this.settings.peerblockfilters) {
        return "Peer Block Filters must be disabled to turn this off.";
      } else {
        return "";
      }
    },
  },
  watch: {
    isTorProxyDisabled(value) {
      if (!value) return;
      this.settings.torProxyForClearnet = false;
    },
    // if peerblockfilters is enabled, blockfilterindex must be enabled for bitcoind to start
    isPeerBlockFiltersEnabled(value) {
      if (!value) return;
      this.settings.blockfilterindex = true;
    }
  },
  props: {
    isSettingsDisabled: {
      type: Boolean,
      default: false
    },
    validationErrors: {
      type: Array,
      default: () => []
    }
  },
  beforeDestroy() {
    // clear validationErrors when component is destroyed
    this.$emit("clearErrors");
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
