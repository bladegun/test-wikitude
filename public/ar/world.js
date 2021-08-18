class World {
  constructor() {
    this.initialized = false;
  }

  init() {
    AR.logger.activateDebugMode();
    AR.logger.debug("init()");

    this.initialized = true;
  }
}

const world = new World();
world.init();
