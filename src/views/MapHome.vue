<template>
  <v-container fluid>
    <mb-map
      :mapId="mapId"
      :accessToken="accessToken"
      :mapStyle.sync="mapStyle"
      :mapOptions="mapOptions"
      @load="onMapLoaded"
    >
    </mb-map>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import MbMap from "@/components/mb-map.vue";
import { MarkerOptions, LngLat, LngLatLike } from "mapbox-gl";
import mapboxgl from "mapbox-gl";

const mapConfig = {
  // center: [-122.48383155304096, 37.82882682974591],
  // zoom: 5,
  center: [116.397428, 39.90923],
  zoom: 12,
  // minZoom: 1,
  // maxZoom: 10,
  pitch: 45,
  bearing: -17.6,
  customAttribution: "© VoicerMap"
};

@Component({
  components: {
    MbMap,
  }
})
export default class MapHome extends Vue {
  private accessToken: string =
    "pk.eyJ1IjoiaGFuYmluZ2RlIiwiYSI6ImNqbGh5a3h4bTFpZzczdnFvM2RnZ2V2bGoifQ.d1YPPTTL3KlJtfADCclSxA";
  private style: string = "dark-v10";
  private mapId: string = "container";
  private mapOptions = mapConfig;
  // private center = [116.397428, 39.90923];
  private center = [116.3413439, 40.0280492];
  private offset = 25;
  private jsonData: any = [];

  get mapStyle() {
    return "mapbox://styles/mapbox/" + this.style;
  }
  private mapStyles: String[] = [
    "light-v10",
    "dark-v10",
    "streets-v11",
    "satellite-v9",
    "outdoors-v11"
  ];
  private map?: mapboxgl.Map;

  public onMapLoaded(event: any) {
    console.log(`${this.mapId} map loaded`);
    this.map = event.map;
  }


}
</script>
