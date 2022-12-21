<template>
  <!-- div wrapper with v-b-tooltip to allow tooltip to show when toggle is disabled -->
  <div v-b-tooltip.hover.left :title="tooltip">
    <div
      class="toggle"
      :class="{
        'toggle-off': !on,
        'toggle-on': on,
        'toggle-disabled': disabled,
        'toggle-loading': loading
      }"
      :disabled="disabled"
      @click="toggle"
    >
      <div
        class="toggle-switch justify-items-center"
        :class="{
          'toggle-switch-off': !on,
          'toggle-switch-on': on
        }"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    toggle() {
      if (this.disabled) {
        return;
      }
      return this.$emit("toggle", !this.on);
    }
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ""
    },
    on: {
      type: Boolean,
      default: false
    }
  },
  emits: ["toggle"]
};
</script>

<style scoped lang="scss">
$toggle-width: 50px;

.toggle {
  border-radius: calc($toggle-width * 0.5);
  width: $toggle-width;
  height: calc($toggle-width * 0.6);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  background: linear-gradient(346.78deg, #f7fcfc 0%, #fafcfa 100%);
  border: 1px solid rgba(0, 0, 0, 0.04);
  // TODO - may want to calc box-shadow px values to scale correctly with $toggle-width
  box-shadow: inset 0px 5px 10px rgba(0, 0, 0, 0.1);
  &.toggle-on {
    background: var(--success);
    box-shadow: none;
  }
  &.toggle-disabled {
    cursor: not-allowed;
  }
  &.toggle-loading {
    cursor: wait;
  }
}
.toggle-switch {
  margin: 0;
  height: calc($toggle-width * 0.5);
  width: calc($toggle-width * 0.5);
  border-radius: 50%;
  background: #ffffff;
  transition: 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.toggle-switch-off {
  transform: translateX(10%);
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}
.toggle-switch-on {
  transform: translateX(90%);
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}
</style>
