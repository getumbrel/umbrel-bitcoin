<template>
  <div>
    <transition name="loading" mode>
      <div v-if="isIframe">
        <div
          class="d-flex flex-column align-items-center justify-content-center min-vh100 p-2"
        >
          <img alt="Umbrel" src="@/assets/icon.svg" class="mb-5 logo" />
          <span class="text-muted w-75 text-center">
            <small
              >For security reasons this app cannot be embedded in an
              iframe.</small
            >
          </span>
        </div>
      </div>
      <loading v-else-if="loading" :progress="loadingProgress"> </loading>
      <!-- component matched by the route will render here -->
      <router-view v-else></router-view>
    </transition>
  </div>
</template>

<style lang="scss">
@import "@/global-styles/design-system.scss";
</style>

<script>
import { mapState } from "vuex";
import Loading from "@/components/Loading";

export default {
  name: "App",
  data() {
    return {
      isIframe: window.self !== window.top,
      loading: true,
      loadingProgress: 0,
      loadingPollInProgress: false
    };
  },
  computed: {
    ...mapState({
      isApiOperational: state => {
        return state.system.api.operational;
      }
    })
  },
  methods: {
    //TODO: move this to the specific layout that needs this 100vh fix
    updateViewPortHeightCSS() {
      return document.documentElement.style.setProperty(
        "--vh100",
        `${window.innerHeight}px`
      );
    },
    async getLoadingStatus() {
      // Skip if previous poll in progress or if system is updating
      if (this.loadingPollInProgress || this.updating) {
        return;
      }

      this.loadingPollInProgress = true;

      // Then check if middleware api is up
      if (this.loadingProgress <= 40) {
        this.loadingProgress = 40;
        await this.$store.dispatch("system/getApi");
        if (!this.isApiOperational) {
          this.loading = true;
          this.loadingPollInProgress = false;
          return;
        }
      }

      this.loadingProgress = 100;
      this.loadingPollInProgress = false;

      // Add slight delay so the progress bar makes
      // it to 100% before disappearing
      setTimeout(() => (this.loading = false), 300);
    }
  },
  created() {
    //for 100vh consistency
    this.updateViewPortHeightCSS();
    window.addEventListener("resize", this.updateViewPortHeightCSS);
  },
  watch: {
    loading: {
      handler: function(isLoading) {
        window.clearInterval(this.loadingInterval);
        //if loading, check loading status every two seconds
        if (isLoading) {
          this.loadingInterval = window.setInterval(
            this.getLoadingStatus,
            2000
          );
        } else {
          //else check every 20s
          this.loadingInterval = window.setInterval(
            this.getLoadingStatus,
            20000
          );
        }
      },
      immediate: true
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateViewPortHeightCSS);
    window.clearInterval(this.loadingInterval);
  },
  components: {
    Loading
  }
};
</script>

<style lang="scss" scoped>
// Loading transitions

.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.4s ease;
}
.loading-enter {
  opacity: 0;
  // filter: blur(70px);
}
.loading-enter-to {
  opacity: 1;
  // filter: blur(0);
}
.loading-leave {
  opacity: 1;
  // filter: blur(0);
}
.loading-leave-to {
  opacity: 0;
  // filter: blur(70px);
}
</style>
