/* Implementation of AR-Experience (aka "World"). */
class World {
  /* True once data was fetched. */
  initiallyLoadedData = false;

  /* pOI-Marker asset. */
  markerDrawableIdle = null;

  init() {
    // Setup logger.
    AR.logger.setPlatformLoggingEnabled(true);
    AR.logger.setHTMLLoggingEnabled(true);

    /*
      Set a custom function where location changes are forwarded to. There is also a possibility to set
      AR.context.onLocationChanged to null. In this case the function will not be called anymore and no further
      location updates will be received.
    */
    AR.context.onLocationChanged = this.locationChanged.bind(this);

    // Setup UI.
    document.getElementById('backButton').addEventListener('click', ev => {
      ev.preventDefault();
      this.onBackButtonClick();
    });
  }

  /* Location updates, fired every time you call architectView.setLocation() in native environment. */
  locationChanged(lat, lon, alt, acc) {
    AR.logger.debug(`Location changed: lat=${lat}, lon=${lon}, alt=${alt}, acc=${acc}`);

    /*
        The custom function World.onLocationChanged checks with the flag World.initiallyLoadedData if the
        function was already called. With the first call of World.onLocationChanged an object that contains geo
        information will be created which will be later used to create a marker using the
        World.loadPoisFromJsonData function.
    */
    if (!this.initiallyLoadedData) {
      /* Creates a poi object with a random location near the user's location. */
      let poiData = {
        "id": 1,
        "latitude": (lat + (Math.random() / 5 - 0.1)),
        "longitude": (lon + (Math.random() / 5 - 0.1)),
        "altitude": 100.0,
      };

      this.loadPoisFromJsonData(poiData);
      this.initiallyLoadedData = true;
    }
  }

  /* Called to inject new POI data. */
  loadPoisFromJsonData(poiData) {
    /*
        The example Image Recognition already explained how images are loaded and displayed in the augmented
        reality view. This sample loads an AR.ImageResource when the World variable was defined. It will be
        reused for each marker that we will create afterwards.
    */
    this.markerDrawableIdle = new AR.ImageResource("assets/marker_idle.png", {
      onError: this.onError.bind(this),
    });

    /*
        For creating the marker a new object AR.GeoObject will be created at the specified geolocation. An
        AR.GeoObject connects one or more AR.GeoLocations with multiple AR.Drawables. The AR.Drawables can be
        defined for multiple targets. A target can be the camera, the radar or a direction indicator. Both the
        radar and direction indicators will be covered in more detail in later examples.
    */
    let markerLocation = new AR.GeoLocation(poiData.latitude, poiData.longitude, poiData.altitude);
    let markerImageDrawableIdle = new AR.ImageDrawable(this.markerDrawableIdle, 2.5, {
      zOrder: 0,
      opacity: 1.0,
    });

    /* Create GeoObject. */
    let markerObject = new AR.GeoObject(markerLocation, {
      drawables: {
        cam: [markerImageDrawableIdle]
      }
    });

    /* Updates status message as a user feedback that everything was loaded properly. */
    this.updateStatusMessage('1 place loaded');
  }

  /* Updates status message shown in small "i"-button aligned bottom center. */
  updateStatusMessage(message, isWarning) {
    document.getElementById("popupButtonImage").src = isWarning ? "assets/warning_icon.png" : "assets/info_icon.png";
    document.getElementById("popupButtonTooltip").innerHTML = message;
  }

  onError(error) {
    alert(error);
  }

  onBackButtonClick() {
    AR.platform.sendJSONObject({
      action: 'close',
    });
  }
}

const world = new World();
world.init();
