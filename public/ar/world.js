class World {
  constructor() {
    this.initialized = false;
  }

  init() {
    AR.logger.activateDebugMode();
    AR.logger.debug("init()");

    this.initialized = true;

    setTimeout(() => {
      AR.platform.sendJSONObject({
        id: 123,
        name: '456',
        time: new Date(),
      });
    }, 3000);
  }

  greet(msg) {
    alert(msg);
  }
}

const world = new World();
world.init();
