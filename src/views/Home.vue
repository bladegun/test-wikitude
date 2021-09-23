<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Wikitude</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Wikitude</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list v-if="initError">
        <ion-item color="danger">
          <ion-label>Error: {{ initError }}</ion-label>
        </ion-item>
      </ion-list>

      <ion-list v-else>
        <ion-item>
          <ion-label>SDK Version:</ion-label>
          <div slot="end">{{ version }}</div>
        </ion-item>

        <ion-item>
          <ion-label>SDK Build Configuration:</ion-label>
          <div slot="end">{{ buildConfiguration }}</div>
        </ion-item>

        <ion-item>
          <ion-label>SDK Build Date:</ion-label>
          <div slot="end">{{ buildDate }}</div>
        </ion-item>

        <ion-item>
          <ion-label>SDK Build Number:</ion-label>
          <div slot="end">{{ buildNumber }}</div>
        </ion-item>

        <ion-item>
          <ion-label>'geo' Feature Supported:</ion-label>
          <div slot="end">{{ supported }}</div>
        </ion-item>

        <ion-item>
          <ion-label>'geo' Feature Permissions:</ion-label>
          <div slot="end">{{ access }}</div>
        </ion-item>

        <ion-item button detail @click="openAppSettings">
          <ion-label>Open App Settings</ion-label>
        </ion-item>

        <ion-item button detail @click="showAlert">
          <ion-label>Show Alert</ion-label>
        </ion-item>

        <ion-item>
          <ion-label>Remote URL:</ion-label>
          <ion-input v-model="remoteUrl"></ion-input>
        </ion-item>

        <!-- <ion-item button detail @click="loadARchitectWorldFront">
          <ion-label>Load ARchitect World (front)</ion-label>
        </ion-item> -->

        <ion-item button detail @click="loadARchitectWorldUrlBack">
          <ion-label>Load AR from Remote URL</ion-label>
        </ion-item>

        <ion-item button detail @click="loadARchitectWorldFile">
          <ion-label>Load AR from Assets</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">

import { defineComponent } from 'vue';
import { isPlatform, useBackButton, IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput } from '@ionic/vue';
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { Wikitude, SDKBuildInformation, StartupConfiguration } from '@ionic-native/wikitude';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { ActionSheet } from '@ionic-native/action-sheet';

interface ARMessage {
  action: 'boot' | 'show-poi' | 'navigate' | 'close';
  id: number | string;
  latitude: number;
  longitude: number;
}

export default defineComponent({
  name: 'Home',

  components: { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput },

  setup() {
    if (isPlatform('hybrid') && isPlatform('android')) {
      useBackButton(-1, () => App.exitApp());
    }
  },

  data() {
    return {
      initError: '',
      version: '',
      buildConfiguration: '',
      buildDate: '',
      buildNumber: '',
      supported: '',
      access: '',
      remoteUrl: 'http://192.168.50.16:8080/ar/',
    }
  },

  mounted() {
    this.init();
  },

  methods: {
    async init() {
      try {
        Wikitude._sdkKey = 'ScYpNFYRxv80X3n0t0btNc2N5tIUXOYPWu9s0iW/Bmj2zJUCWaHpnLAiXcN0F70XjxcvAh75c5SNgBNe08FgN/WrUeXCdLGKRfGjzzAz+JoERNZg0YaIIx/MppAsyUENOEuAJEj9u2vFauJ5wY4H2s02gGIjoLfGZrhvWN4S7rdTYWx0ZWRfX6++gBAbh1zgpZsaUt5iQut52KgfEPQCt1zzgdgApG33qRMSVcIFblYUFRk2Sy2VDPCfYqMxROY0voAFDzdk8wCzIbEViKoGmIPxd3Os+Ig9kQvHbMUlx4uGqD4ty4e9pYXAdwLh3HDMo9+pN/o2cW6EoVthV8uiVFMe0dZPvy89HPpfDEO3cHh0vDxCKsj7YivpzYuZd7sF+cWkVtphW0CKxYfVcjmPW22ppgIIvzKqWmUTqkKdvGH8OMYHiVDmPCf4OXNOZ+ugkFOa+T3L7/jEROTtvm/ScUoGMc1pGDskR1Z/XG3U4UOxJd69utvDMqw0GEj08iXxJQZrNXmth7oEARCigdF5TOUWfcmSjnZjUGp42+Oqt2tTyQ1Noje+96REZqcv+v8Etw7P/77YhFcclN1JEnWJqbvxn0J0RYjddhuQd6fhkovLM3aIhi+jhCTRKDWrdJSidAUxVzAIqv9YYgffLvv2gxPtakunnfaSG4xPpozArmBSlvfuu6jRiL7P8whsukRmSBVOvp8snPySE4oygh8pBaHAGK59hM/KknslImUFP1cBxOJNzkV2cIJxwwCLdLyprbkP8AOvJViCXIL03n76YSwuwW5B1evIuow/WIiGYxxmeE7L60+hGZTATpmJam/8mIzqBVI5VVR93PGBOalEM7a78Yy0qT4asnns5ozWwi0=';

        console.debug(Wikitude._sdkKey);

        console.debug(Wikitude.FeatureGeo);
        console.debug(Wikitude.FeatureImageTracking);
        console.debug(Wikitude.FeatureInstantTracking);
        console.debug(Wikitude.FeatureObjectTracking);

        console.debug(Wikitude.CameraPositionUndefined);
        console.debug(Wikitude.CameraPositionFront);
        console.debug(Wikitude.CameraPositionBack);

        console.debug(Wikitude.CameraFocusRangeNone);
        console.debug(Wikitude.CameraFocusRangeNear);
        console.debug(Wikitude.CameraFocusRangeFar);

        // Show infos.
        this.version = await Wikitude.getSDKVersion();

        const info = JSON.parse(await Wikitude.getSDKBuildInformation()) as SDKBuildInformation;
        this.buildConfiguration = info.buildConfiguration;
        this.buildDate = info.buildDate;
        this.buildNumber = info.buildNumber;

        // Features.
        const features = [Wikitude.FeatureGeo];

        await Wikitude.isDeviceSupported(features);
        this.supported = 'Yes';

        await Wikitude.requestAccess(features);
        this.access = 'Granted';

        // Listens for objects from AR.
        Wikitude.setJSONObjectReceivedCallback((message) => {
          this.onARMessageReceived(message);
        });

        if (isPlatform('hybrid')) {
          if (isPlatform('android')) {
            // Detect back button.
            Wikitude.setBackButtonCallback(() => this.backButtonCallback());
          }

          if (isPlatform('ios')) {
            // Listens for error from AR.
            Wikitude.setErrorHandler((err) => console.error(err));

            // Listens for sensor calibration events.
            Wikitude.setDeviceSensorsNeedCalibrationHandler(() => console.debug('iOS device sensors need calibration.'));
            Wikitude.setDeviceSensorsFinishedCalibrationHandler(() => console.debug('iOS device sensors finished calibration.'));
          }
        }
      }
      catch (error: any) {
        this.initError = error;
      }
    },

    backButtonCallback() {
      Toast.show({
        text: 'Came back from AR',
        duration: 'short',
      });
    },

    openAppSettings() {
      Wikitude.openAppSettings();
    },

    showAlert() {
      Wikitude.showAlert('Alert from Wikitude.');
    },

    loadARchitectWorldUrlFront() {
      this.loadARchitectWorldUrl('front');
    },

    loadARchitectWorldUrlBack() {
      this.loadARchitectWorldUrl('back');
    },

    async loadARchitectWorldUrl(cameraPosition: 'front' | 'back') {
      try {
        //const url = 'public/ar/index.html';
        const url = this.remoteUrl;
        const config: StartupConfiguration = {
          camera_position: cameraPosition, // eslint-disable-line
        };

        await Wikitude.loadARchitectWorld(url, [Wikitude.FeatureGeo], config);
      }
      catch (error) {
        console.error(error);
      }
    },

    async loadARchitectWorldFile(cameraPosition: 'front' | 'back' = 'back') {
      try {
        const url = 'public/ar/index.html';
        const config: StartupConfiguration = {
          camera_position: cameraPosition, // eslint-disable-line
        };

        await Wikitude.loadARchitectWorld(url, [Wikitude.FeatureGeo], config);
      }
      catch (error) {
        console.error(error);
      }
    },

    onARMessageReceived(message: ARMessage) {
      switch (message.action) {
        case 'boot': {
          const locale = 'ms';
          const mapApiUrl = 'http://jendelabeta.naditeknologi.com.my/api/Map/';

          const args = [
            JSON.stringify(locale),
            JSON.stringify(mapApiUrl),
          ];

          Wikitude.callJavaScript(`runApp(${args[0]},${args[1]})`);
          break;
        }

        case 'show-poi': {
          const poiId = message.id;
          setTimeout(() => {
            alert(`Navigate to POI with ID: ${poiId}`);
          }, 1000);

          Wikitude.close();
          break;
        }

        case 'navigate': {
          LaunchNavigator.navigate([message.latitude, message.longitude], {
            enableGeocoding: false,
            rememberChoice: {
              enabled: true,
            },
            androidTheme: ActionSheet.ANDROID_THEMES.THEME_DEVICE_DEFAULT_LIGHT,
          } as any);
          break;
        }

        case 'close':
          Wikitude.close();
          break;
      }
    },
  },
});

</script>
