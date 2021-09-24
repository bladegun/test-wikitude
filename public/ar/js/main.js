/********************************************************************************
 * Common functions
 ********************************************************************************/

function arSendMessage(message) {
  AR.platform.sendJSONObject(message);
}

function arLogError(error) {
  AR.logger.error(error);
}

async function arLoadFeatures(mapApiUrl, data) {
  const request = {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  const response = await fetch(mapApiUrl + 'LoadFeatures', request);

  if (!response.ok)
    throw new Error(`${response.status} - ${response.statusText}`);

  return await response.json();
}

/********************************************************************************
 * ArWorld class
 ********************************************************************************/

class ArWorld {
  constructor() {
    this.idleMarkerResource         = new AR.ImageResource("assets/marker_idle.png",     { onError: arLogError });
    this.selectedMarkerResource     = new AR.ImageResource("assets/marker_selected.png", { onError: arLogError });
    this.directionIndicatorResource = new AR.ImageResource("assets/indi.png",            { onError: arLogError });

    this.radarDrawable = new AR.Circle(0.05, {
      horizontalAnchor: AR.CONST.HORIZONTAL_ANCHOR.CENTER,
      opacity: 0.8,
      style: {
        fillColor: "#ffffff",
      },
    });

    this.markers = [];
  }

  updateMarkers(features) {
    // Add any features from incoming set not found in existing markers.
    const currentIDs = this.markers.map(m => m.id);

    for (const feature of features) {
      if (currentIDs.indexOf(feature.properties.id) === -1) {
        const marker = new ArMarker(feature);
        this.markers.push(marker);

        AR.logger.debug(`Added marker ${marker.id}.`);
      }
    }

    // Remove any existing markers not found in incoming set.
    const newIDs = features.map(f => f.properties.id);

    for (const marker of this.markers.slice()) {
      if (newIDs.indexOf(marker.id) === -1) {
        const index = this.markers.indexOf(marker);
        this.markers.splice(index, 1);

        marker.destroy();
        AR.logger.debug(`Removed marker ${marker.id}.`);
      }
    }
  }

  getSelectedMarker() {
    for (const marker of this.markers) {
      if (marker.selected)
        return marker;
    }
  }

  deselectAllMarkers() {
    for (const marker of this.markers) {
      if (marker.selected)
        marker.deselect();
    }
  }
}

/********************************************************************************
 * ArMarker class
 ********************************************************************************/

const CHANGE_ANIMATION_DURATION = 500;
const RESIZE_ANIMATION_DURATION = 1000;

const MIN_OPACITY = 0.0;
const MAX_OPACITY = 1.0;

const MIN_SCALE = 1.0;
const MAX_SCALE = 1.2;

class ArMarker {
  constructor(feature) {
    this.resources = [];

    this.feature = feature;
    this.id      = feature.properties.id;
    this.title   = feature.properties.title || '';
    this.text    = feature.properties.text  || '';

    this.selected   = false;
    this.onSelect   = null;
    this.onDeselect = null;

    // Create GeoLocation.
    const [longitude, latitude] = feature.geometry.coordinates;
    this.geoLocation = new AR.GeoLocation(latitude, longitude);

    // Create Label.
    const title = this.title.substring(0, 10);
    this.titleLabel = new AR.Label(title, 1, {
      zOrder: 1,
      translate: {
        y: 0.55,
      },
      style: {
        textColor: '#ffffff',
        fontStyle: AR.CONST.FONT_STYLE.BOLD,
      },
    });

    // Create drawables.
    this.idleMarkerDrawable = new AR.ImageDrawable(world.idleMarkerResource, 2.5, {
      onClick: this.select.bind(this),
    });

    this.selectedMarkerDrawable = new AR.ImageDrawable(world.selectedMarkerResource, 2.5, {
      opacity: 0,
    });

    this.directionIndicatorDrawable = new AR.ImageDrawable(world.directionIndicatorResource, 0.1, {
      enabled: false,
      verticalAnchor: AR.CONST.VERTICAL_ANCHOR.TOP,
    });

    // Create GeoObject.
    this.geoObject = new AR.GeoObject(this.geoLocation, {
      drawables: {
        cam: [this.idleMarkerDrawable, this.selectedMarkerDrawable, this.titleLabel],
        indicator: this.directionIndicatorDrawable,
        radar: [world.radarDrawable],
      },
    });

    // Mark all objects
    this.mark(this.geoLocation);
    this.mark(this.titleLabel);
    this.mark(this.idleMarkerDrawable);
    this.mark(this.selectedMarkerDrawable);
    this.mark(this.directionIndicatorDrawable);
    this.mark(this.geoObject);
  }

  select() {
    world.deselectAllMarkers();

    AR.logger.debug(`Selecting marker #${this.id}.`);

    if (this.idleAnimationGroup && this.idleAnimationGroup.isRunning()) {
      this.idleAnimationGroup.stop();
    }

    if (!this.selectedAnimationGroup) {
      this.createSelectedAnimationGroup();
    }

    this.selectedAnimationGroup.start();
    this.directionIndicatorDrawable.enabled = true;

    this.idleMarkerDrawable.onClick = null;
    this.selectedMarkerDrawable.onClick = this.deselect.bind(this);

    this.selected = true;

    if (typeof this.onSelect === 'function')
      this.onSelect(this);
  }

  deselect() {
    AR.logger.debug(`Deselecting marker #${this.id}.`);

    if (this.selectedAnimationGroup && this.selectedAnimationGroup.isRunning()) {
      this.selectedAnimationGroup.stop();
    }

    if (!this.idleAnimationGroup) {
      this.createIdleAnimationGroup();
    }

    this.idleAnimationGroup.start();
    this.directionIndicatorDrawable.enabled = false;

    this.idleMarkerDrawable.onClick = this.select.bind(this);
    this.selectedMarkerDrawable.onClick = null;

    this.selected = false;

    if (typeof this.onDeselect === 'function')
      this.onDeselect(this);
  }

  createSelectedAnimationGroup() {
    const easingCurve = new AR.EasingCurve(AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC, {
      amplitude: 2.0
    });

    // For idle drawable, hide and scale X & Y to MAX_SCALE.
    const hideIdleAnimation   = new AR.PropertyAnimation(this.idleMarkerDrawable, "opacity", null, MIN_OPACITY, CHANGE_ANIMATION_DURATION);
    const scaleIdleXAnimation = new AR.PropertyAnimation(this.idleMarkerDrawable, 'scale.x', null, MAX_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);
    const scaleIdleYAnimation = new AR.PropertyAnimation(this.idleMarkerDrawable, 'scale.y', null, MAX_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);

    // For selected drawable, show and scale X & Y to MAX_SCALE.
    const showSelectedAnimation   = new AR.PropertyAnimation(this.selectedMarkerDrawable, "opacity", null, MAX_OPACITY, CHANGE_ANIMATION_DURATION);
    const scaleSelectedXAnimation = new AR.PropertyAnimation(this.selectedMarkerDrawable, 'scale.x', null, MAX_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);
    const scaleSelectedYAnimation = new AR.PropertyAnimation(this.selectedMarkerDrawable, 'scale.y', null, MAX_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);

    // For title label, scale X & Y to MAX_SCALE.
    const scaleTitleLabelXAnimation = new AR.PropertyAnimation(this.titleLabel, 'scale.x', null, MAX_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);
    const scaleTitleLabelYAnimation = new AR.PropertyAnimation(this.titleLabel, 'scale.y', null, MAX_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);

    // Create a parallel AR.AnimationGroup.
    const animations = [
      hideIdleAnimation,
      scaleIdleXAnimation,
      scaleIdleYAnimation,
      showSelectedAnimation,
      scaleSelectedXAnimation,
      scaleSelectedYAnimation,
      scaleTitleLabelXAnimation,
      scaleTitleLabelYAnimation,
    ];
    this.selectedAnimationGroup = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, animations);

    // Mark all objects.
    for (const animation of animations) {
      this.mark(animation);
    }
    this.mark(easingCurve);
    this.mark(this.selectedAnimationGroup);
  }

  createIdleAnimationGroup() {
    const easingCurve = new AR.EasingCurve(AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC, {
      amplitude: 2.0
    });

    // For idle drawable, show and scale X & Y to MIN_SCALE.
    const showIdleAnimation   = new AR.PropertyAnimation(this.idleMarkerDrawable, "opacity", null, MAX_OPACITY, CHANGE_ANIMATION_DURATION);
    const scaleIdleXAnimation = new AR.PropertyAnimation(this.idleMarkerDrawable, 'scale.x', null, MIN_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);
    const scaleIdleYAnimation = new AR.PropertyAnimation(this.idleMarkerDrawable, 'scale.y', null, MIN_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);

    // For selected drawable, show and scale X & Y to MIN_SCALE.
    const hideSelectedAnimation   = new AR.PropertyAnimation(this.selectedMarkerDrawable, "opacity", null, MIN_OPACITY, CHANGE_ANIMATION_DURATION);
    const scaleSelectedXAnimation = new AR.PropertyAnimation(this.selectedMarkerDrawable, 'scale.x', null, MIN_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);
    const scaleSelectedYAnimation = new AR.PropertyAnimation(this.selectedMarkerDrawable, 'scale.y', null, MIN_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);

    // For title label, scale X & Y to MIN_SCALE.
    const scaleTitleLabelXAnimation = new AR.PropertyAnimation(this.titleLabel, 'scale.x', null, MIN_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);
    const scaleTitleLabelYAnimation = new AR.PropertyAnimation(this.titleLabel, 'scale.y', null, MIN_SCALE, RESIZE_ANIMATION_DURATION, easingCurve);

    // Create a parallel AR.AnimationGroup.
    const animations = [
      showIdleAnimation,
      scaleIdleXAnimation,
      scaleIdleYAnimation,
      hideSelectedAnimation,
      scaleSelectedXAnimation,
      scaleSelectedYAnimation,
      scaleTitleLabelXAnimation,
      scaleTitleLabelYAnimation,
    ];
    this.idleAnimationGroup = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, animations);

    // Mark all objects.
    for (const animation of animations) {
      this.mark(animation);
    }
    this.mark(easingCurve);
    this.mark(this.idleAnimationGroup);
  }

  mark(obj) {
    this.resources.push(obj);
  }

  destroy() {
    for (const resource of this.resources) {
      resource.destroy();
    }
    this.resources.splice(0);
    this.onSelect = null;
    this.onDeselect = null;
  }
}

/********************************************************************************
 * Vue app
 ********************************************************************************/

const ArApp = {
  components: {
    VForm: VeeValidate.Form,
    VField: VeeValidate.Field,
    ErrorMessage: VeeValidate.ErrorMessage,
  },

  i18n: {
    messages: {
      en: {
        poiType: 'Pusat Internet Komuniti (PIK)',
        poiDetailLink: 'Details',
        poiNavigateLink: 'Navigate',
        radiusDialogTitle: 'Search Nearby',
        radiusLabel: 'Radius (km)',
        radiusHint: '1 - 30',
        radiusError: 'Please enter a valid radius',
        submitButton: 'Submit',
      },
      ms: {
        poiDetailLink: 'Maklumat',
        poiNavigateLink: 'Navigasi',
        radiusDialogTitle: 'Carian Berdekatan',
        radiusError: 'Sila masukkan radius yang tepat.',
        submitButton: 'Hantar',
      },
    },
  },

  data() {
    return {
      locationAvailable: false,
      latitude: 0,
      longitude: 0,
      altitude: 0,
      accuracy: 0,

      reloadStarted: false,
      radarCreated: false,

      radius: 0,
      radiusValues: {},

      reloading: false,
      reloadAgain: false,
      reloadTimer: 0,

      detailPanelVisible: false,
      detailMarkerTitle: '',
    };
  },

  watch: {
    radius(newValue) {
      AR.radar.maxDistance = newValue * 1000;
    },
  },

  mounted() {
    AR.logger.setPlatformLoggingEnabled(true);
    AR.logger.setHTMLLoggingEnabled(true);

    this.radius = 20;
    window.world = new ArWorld();

    // Listens to location event.
    AR.context.onLocationChanged = this.onLocationChanged.bind(this);

    // Radius dialog event.
    $('#radius-dialog').on('shown.bs.modal', () => $('#radius-input').focus());
  },

  methods: {
    onLocationChanged(latitude, longitude, altitude, accuracy) {
      this.locationAvailable = true;
      this.latitude = latitude;
      this.longitude = longitude;
      this.altitude = altitude;
      this.accuracy = accuracy;

      //AR.logger.debug(`Lat: ${latitude}, Lon: ${longitude}, Alt: ${altitude}, Acc: ${accuracy}`);

      if (!this.reloadStarted) {
        this.reloadStarted = true;
        this.reloadFeatures();
      }
    },

    setReload(seconds) {
      this.reloadTimer = setTimeout(() => this.reloadFeatures(), seconds * 1000);
    },

    async reloadFeatures() {
      // Prepare request.
      const data = {
        name: 'internet-centre',
        center: {
          type: 'Point',
          coordinates: [this.longitude, this.latitude],
        },
        radius: this.radius * 1000,
        page: 0,
        pageSize: 200,
      };

      let result;

      try {
        this.reloading = true;
        result = await arLoadFeatures(this.mapApiUrl, data);

        if (result.error)
          throw new Error(result.error);
      }
      catch (error) {
        arLogError(error);
        // Reload on next 5 seconds if an error occurred.
        this.setReload(5);
        return;
      }
      finally {
        this.reloading = false;
      }

      if (this.reloadAgain) {
        this.reloadAgain = false;
        this.reloadFeatures();
        return;
      }

      // Enable radar.
      if (!this.radarCreated) {
        this.radarCreated = true;
        this.setupRadar();
      }

      // We have got the feature collection.
      const collection = result.features.features;
      AR.logger.debug(`${collection.length} '${data.name}' features loaded.`);

      // Add/remove features into marker set.
      world.updateMarkers(collection);

      // Listen for marker's 'select' and 'deselect' events.
      for (const marker of world.markers) {
        marker.onSelect   = this.onMarkerSelect.bind(this);
        marker.onDeselect = this.onMarkerDeselect.bind(this);
      }

      // Reload on next 60 seconds.
      this.setReload(60);
    },

    setupRadar() {
      const element = this.$refs.radar;
      if (!element)
        return;

      try {
        AR.radar.container = element;
        AR.radar.background = new AR.ImageResource("assets/radar_bg.png", { onError: arLogError });
        AR.radar.northIndicator.image = new AR.ImageResource("assets/radar_north.png", { onError: arLogError });
        AR.radar.northIndicator.radius = 0.0;
        AR.radar.centerX = 0.5;
        AR.radar.centerY = 0.5;
        AR.radar.radius = 0.3;
        AR.radar.enabled = true;
      }
      catch (error) {
        // AR.radar throws error when running in desktop.
        // We catch all the desktop errors here.
        arLogError(error);
      }
    },

    onMarkerSelect(marker) {
      this.detailPanelVisible = true;
      this.detailMarkerTitle = marker.title;
    },

    onMarkerDeselect(marker) {
      this.detailPanelVisible = false;
    },

    closeDetailPanel() {
      world.deselectAllMarkers();
    },

    showPoiDetail() {
      const marker = world.getSelectedMarker();

      if (marker) {
        arSendMessage({
          action: 'show-poi',
          id: marker.id,
        });
      }
    },

    navigateToPoi() {
      const marker = world.getSelectedMarker();

      if (marker) {
        const [longitude, latitude] = marker.feature.geometry.coordinates;

        arSendMessage({
          action: 'navigate-to',
          latitude,
          longitude,
        });
      }
    },

    showRadiusDialog() {
      this.radiusValues.radius = this.radius;
      $('#radius-dialog').modal('show');
    },

    hideRadiusDialog() {
      $('#radius-dialog').modal('hide');
    },

    isRadiusValid(value) {
      const num = parseInt(value || '', 10);

      if (num >= 1 && num <= 30)
        return true;

      return this.$t('radiusError');
    },

    onRadiusDialogSubmit(values) {
      this.radius = parseInt(values.radius, 10);
      this.hideRadiusDialog();

      clearTimeout(this.reloadTimer);

      if (this.reloading)
        this.reloadAgain = true;
      else
        this.reloadFeatures();
    },

    close() {
      arSendMessage({ action: 'close' });
    },
  },
};

/********************************************************************************
 * Startup
 ********************************************************************************/

function arRunApp(locale, mapApiUrl) {
  const i18n = VueI18n.createI18n({
    locale,
    fallbackLocale: 'en',
  });

  const app = Vue.createApp(ArApp).use(i18n);

  app.config.globalProperties.mapApiUrl = mapApiUrl;
  app.mount('#app');
}

// Inform Ionic that this file has been loaded.
// Ionic will call the arRunApp() function.
arSendMessage({ action: 'boot' });
