/********************************************************************************
 * Common functions
 ********************************************************************************/

function sendMessage(message) {
  AR.platform.sendJSONObject(message);
}

function logError(error) {
  AR.logger.error(error);
}

async function loadFeatures(data) {
  const request = {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  const response = await fetch('http://jendelabeta.naditeknologi.com.my/api/Map/LoadFeatures', request);

  if (!response.ok)
    throw new Error(`${response.status} - ${response.statusText}`);

  return await response.json();
}


/********************************************************************************
 * World
 ********************************************************************************/

const World = {
  data() {
    return {
      locationAvailable: false,
      latitude: 0,
      longitude: 0,
      altitude: 0,
      accuracy: 0,
      markerResource: null,
      radarDrawable: null,
      camDrawable: null,
      arObjects: [],
    };
  },

  mounted() {
    AR.logger.setPlatformLoggingEnabled(true);
    AR.logger.setHTMLLoggingEnabled(true);

    // Listens to location event.
    AR.context.onLocationChanged = this.onLocationChanged.bind(this);

    // Load features.
    this.reloadFeatures();

    // Setup radar.
    if (this.$refs.radar)
      this.setupRadar(this.$refs.radar);
  },

  methods: {
    onLocationChanged(latitude, longitude, altitude, accuracy) {
      this.latitude = latitude;
      this.longitude = longitude;
      this.altitude = altitude;
      this.accuracy = accuracy;
      this.locationAvailable = true;
    },

    async reloadFeatures() {
      if (this.locationAvailable) {
        // Prepare request.
        const data = {
          name: 'internet-centre',
          center: {
            type: 'Point',
            coordinates: [this.longitude, this.latitude],
          },
          radius: 30 * 1000,
          page: 0,
          pageSize: 100,
        };

        try {
          const result = await loadFeatures(data);

          if (result.error)
            throw new Error(result.error);

          AR.logger.info(`${result.features.features.length} features loaded.`);

          // Destroy all existing objects.
          for (const arObject of this.arObjects)
            arObject.destroy();
          this.arObjects = [];

          // Add features as GeoObject.
          for (const feature of result.features.features)
            this.addFeature(feature);

          AR.radar.maxDistance = 30 * 1000;
        }
        catch (error) {
          logError(error);
        }
      }
      else {
        setTimeout(this.reloadFeatures.bind(this), 5 * 1000);
      }
    },

    addFeature(feature) {
      if (!this.markerResource) {
        this.markerResource = new AR.ImageResource("assets/marker_idle.png", { onError: logError });
      }

      if (!this.camDrawable) {
        this.camDrawable = new AR.ImageDrawable(this.markerResource, 2.5);
      }

      if (!this.radarDrawable) {
        this.radarDrawable = new AR.Circle(0.03, {
          horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.CENTER,
          opacity: 0.8,
          style: {
            fillColor: "#ffffff",
          },
        });
      }

      const [longitude, latitude] = feature.geometry.coordinates;
      const location = new AR.GeoLocation(latitude, longitude);

      const title = (feature.properties.title || '').substring(0, 10);
      const titleLabel = new AR.Label(title, 1, {
        zOrder: 1,
        translate: {
          y: 0.55,
        },
        style: {
          textColor: '#ffffff',
          fontStyle: AR.CONST.FONT_STYLE.BOLD,
        },
      });

      const geoObj = new AR.GeoObject(location, {
        drawables: {
          cam: [this.camDrawable, titleLabel],
          radar: [this.radarDrawable],
        },
      });

      this.arObjects.push(location, titleLabel, geoObj);
    },

    setupRadar(element) {
      try {
        AR.radar.container = element;
        AR.radar.background = new AR.ImageResource("assets/radar_bg.png", { onError: logError });
        AR.radar.northIndicator.image = new AR.ImageResource("assets/radar_north.png", { onError: logError });
        AR.radar.northIndicator.radius = 0.0;
        AR.radar.centerX = 0.5;
        AR.radar.centerY = 0.5;
        AR.radar.radius = 0.3;
        AR.radar.enabled = true;
      }
      catch (error) {
        // AR.radar throws error when running in desktop.
        // We catch all the desktop errors here.
        logError(error);
      }
    },

    close() {
      sendMessage({ action: 'close' });
    },
  },
};


/********************************************************************************
 * Startup
 ********************************************************************************/

Vue.createApp(World).mount('#app');
