const lightningLogic = require('logic/lightning');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = class LndUnlocker {
  constructor(password) {
    this.password = password;
    this.running = false;
    this.unlocked = false;
  }

  async unlock() {
    try {
      await lightningLogic.getGeneralInfo();
      if (!this.unlocked) {
        console.log('LndUnlocker: Wallet unlocked!');
      }
      return true;
    } catch (e) {
      try {
        await lightningLogic.unlockWallet(this.password);
        console.log('LndUnlocker: Wallet unlocked!');
        return true;
      } catch (e) {
        console.log('LndUnlocker: Wallet failed to unlock!');
        return false;
      }
    }
  };

  async start() {
    if (this.running) {
      throw new Error('Already running');
    }
    this.running = true;
    while (this.running) {
      this.unlocked = await this.unlock();
      await delay(this.unlocked ? 1 * MINUTES : 10 * SECONDS);
    }
  }

  stop() {
    this.running = false;
    this.unlocked = false;
  }
}
