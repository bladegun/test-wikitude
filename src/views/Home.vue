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

        <ion-item button detail @click="loadARchitectWorldFront">
          <ion-label>Load ARchitect World (front)</ion-label>
        </ion-item>

        <ion-item button detail @click="loadARchitectWorldBack">
          <ion-label>Load ARchitect World (back)</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">

import { defineComponent } from 'vue';
import { isPlatform, useBackButton, IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonItem, IonLabel } from '@ionic/vue';
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { Wikitude, SDKBuildInformation, StartupConfiguration } from '@ionic-native/wikitude';

interface ARMessage {
  action: 'close';
}

export default defineComponent({
  name: 'Home',

  components: { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonItem, IonLabel },

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
    }
  },

  mounted() {
    this.init();
  },

  methods: {
    async init() {
      try {
        Wikitude._sdkKey = 'Pt/HlN2lgZQabZXFJ50Xt6p/VeGtZ522+97fZBoGwlA6EQh8IatNrY0Z4WP21tyxjNgind5e8KkyhgxUH5mZbRiG/D9im7DzXBnmdNzGlcIUmPIUEVeKWBK16p2PeUKzjSO60jeFffI7O66FmyGxe8BGrm/fu1IAIqUIEbyOvMdTYWx0ZWRfXxq1FudmK3yZDckDXhERfuh0sAQN5kRoE2NbSZm6w5qXTe8KIG/v5Vpo9VV1xKPcInfTCCpqhQvPg3RBpVLn0Af4axluPnnock6eSSVWMKhSQosB06NbCmHctQa0280wtxB3uMAtqEvWdTq+LmtJI+eXbwGCmeSJZ52JfaJthjg8pCTXjBAJJL+jTn3u2I4uGbwGyFUX4K9a627YswxfJWiMgoT/LhtOzJddYEgehvtak28Wljq3x60M3y9hhDSt4Zdp8fELdmFLsQeujsyNgSZgMdBNjnIFyvWYBxcrDRzFHtoV9M9uKJDh4S/KDniQisbB4e4zR+ahYVUTDo7PcwU9He6wXkWzf4g+8WEu+j6HizTLoju3KKdNhwuBjEx36K8ZvnlPqp6MYk4VDFsyy5gbEnXlxC4ye43CobxEQs3AVnGLDtTtPdMFAkiOfA2UPGiqjF8paryJG0zmKB4pxX5QDJMIiE2aKEATj3VPYRxVz4UiGaXjr/NNskQRNwzlVQ4BrdS28WjaLybe9FZYhLMG6hTJBRpKKDFayBGd5g26CI68G3IA8R9R+aTIo5pKbW/wFZZiTjRBruo5DrQ7BmYqHDVeLx7BQP38JSe1cgLwj5v4Axm5rR8EoYY0APOCI5FQ1Z9G8awl';

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

    loadARchitectWorldFront() {
      this.loadARchitectWorld('front');
    },

    loadARchitectWorldBack() {
      this.loadARchitectWorld('back');
    },

    async loadARchitectWorld(cameraPosition: 'front' | 'back') {
      try {
        const url = 'public/poi/index.html';
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
        case 'close':
          Wikitude.close();
          break;
      }
    },
  },
});

</script>
