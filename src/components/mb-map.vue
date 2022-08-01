<template>
  <div class="mgl-map-wrapper">
    <div v-once :id="mapId" ref="container"/>
    <slot/>
  </div>
</template>

<script lang="ts">
import {
  Vue,
  Component,
  Provide,
  Prop,
  Emit,
  Watch
} from "vue-property-decorator";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { getJsonDataApi } from '@/api/api';

@Component
export default class MbMap extends Vue {
  initial: boolean = true;
  initialized: boolean = false;
  isPlay: boolean = false;

  private map?: mapboxgl.Map = undefined;
  private jsonData: any = {
    "type": "FeatureCollection",
    "features": [
    {
        "type": "Feature",
        "properties": {
            "message": "北京市",
            "iconSize": [50, 50],
            "thumbnail": "https://www.jianglishi.cn/uploadfile/mier/uploads/allimg/151103/41780_151103084433_1.jpg"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [
                116.407526,39.90403
            ]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "message": "上海市",
            "iconSize": [50, 50],
            "thumbnail": "http://img1.qq.com/2008/pics/5593/5593773.jpg"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [
                121.4737021,31.2303904
            ]
        }
    },
    {
        "properties": {
            "message": "深圳市",
            "iconSize": [50, 50],
	          "thumbnail": "http://vthumb.ykimg.com/054101015E3D29A28B6C069AAB209093",
        },
        "geometry": {
            "type": "Point",
            "coordinates": [
                114.057865,22.543096
            ]
        }
    }]
  };
  private aLength!: number;
  private counter!: number;
  private steps!: number;
  private newRouteGeoJson: any= { }

  private realRouteGeoJson: any = {
      'type': 'FeatureCollection',
      'features': [{
          'type': 'Feature',
          'geometry': {
              'type': 'LineString',
              'coordinates': []
          }
      }]
  }
  private animatePointGeoJson: any = {
    'type': 'FeatureCollection',
    'features': [{
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'Point',
            'coordinates': []
        }
    }]
  }


  @Prop({ required: true }) private mapId!: string;
  @Prop({ default: "mapbox://styles/mapbox/streets-v9" })
  private mapStyle!: string;
  @Prop({ required: true }) private accessToken!: string;
  @Prop({ default: null }) private mapOptions!: mapboxgl.MapboxOptions;

  public mounted() {
    mapboxgl.accessToken = this.accessToken;
    let map = new mapboxgl.Map({
      ...this.mapOptions,
      container: this.mapId || this.$refs.container,
      style: this.mapStyle,
    } as mapboxgl.MapboxOptions);
    this.map = map
    // 箭头-右
    var svgXML =
        `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M529.6128 512L239.9232 222.4128 384.7168 77.5168 819.2 512 384.7168 946.4832 239.9232 801.5872z" p-id="9085" fill="#ffffff"></path>
        </svg>
        `
    //给图片对象写入base64编码的svg流
    var svgBase64 = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgXML)));

    map.on("load", () => {
      let that = this
      this.map = map;
      this.initial = false;
      this.initialized = true;
      this.isPlay = false;
      this.counter = 0
      this.steps = 0
      this.aLength = 0;
      let arrowIcon = new Image(20, 20)
      arrowIcon.src = svgBase64
      arrowIcon.onload = function() {
          map.addImage('arrowIcon', arrowIcon)
          map.loadImage('/image/car.png', function(error: any, carIcon: any) {
              if (carIcon) {
                  map.addImage('carIcon', carIcon);
                  that.setRouteData(map)
              }
          })
      }
      this.mapLoaded();
      this.layers(this.map)
      this.addMarker(this.map);
    });
    map.addControl(new MapboxLanguage({
      defaultLanguage: "zh-Hans",
    }))
  }

  @Emit("load") public mapLoaded() {
    return {
      map: this.map,
      component: this
    };
  }

  @Watch("mapStyle")
  public onMapStyleChanged(nextStyle: string, prev: string) {
    if (nextStyle != prev) {
      (this.map as mapboxgl.Map).setStyle(nextStyle);
    }
  }

  @Provide("handlemap")
  public handlemap(found: (map: mapboxgl.Map) => void) {
    let vm = this;
    function checkForMap() {
      if (vm.map) {
        found(vm.map);
      } else {
        // waiting for map load
        setTimeout(checkForMap, 50);
      }
    }
    checkForMap();
  }

  //点标记
  public addMarker(map: mapboxgl.Map) {
    this.jsonData.features.forEach(function(markers: any) {
      var popup = new mapboxgl.Popup({ offset: 25 })
          .setText(markers.properties.message);
      var el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = 'url('+markers.properties.thumbnail+')';
      el.style.width = markers.properties.iconSize[0] + 'px';
      el.style.height = markers.properties.iconSize[1] + 'px';
      el.style.borderRadius = 50 +'%';
      // add marker to map
      new mapboxgl.Marker(el)
        .setLngLat(markers.geometry.coordinates)
        .setPopup(popup) // sets a popup on this marker
        .addTo(map);
    });
  }
  //3d建筑
  public layers(map: mapboxgl.Map) {
    // Insert the layer beneath any symbol layer.
    var layers = map.getStyle().layers;
    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
        labelLayerId = layers[i].id;
        break;
      }
    }
    map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          "interpolate", ["linear"], ["zoom"],
          15, 0,
          15.05, ["get", "height"]
        ],
        'fill-extrusion-base': [
          "interpolate", ["linear"], ["zoom"],
          15, 0,
          15.05, ["get", "min_height"]
        ],
        'fill-extrusion-opacity': .6
      }
    }, labelLayerId);
  }

  // 获取轨迹数据
  public async setRouteData(map: any) {
    const res = await getJsonDataApi();
    this.animatePointGeoJson.features[0].geometry.coordinates = res.data.features[0].geometry.coordinates[0];
    this.aLength = res.data.features[0].geometry.coordinates.length;
    this.newRouteGeoJson = this.resetRoute(res.data.features[0], 1000, 'miles')
    this.steps = this.newRouteGeoJson.geometry.coordinates.length


    this.getJsonData(map)
    this.addAnimatePointSource(map) // 添加动态点图层
    this.addRealRouteSource(map)
    this.addArrowlayer(map) // 添加箭头图层

     if (!this.isPlay) {
      this.isPlay = true
      this.animate(this.map)
    }

  }

  // 获取本地JSON数据(轨迹)
  private async getJsonData(map: any) {
    const res = await getJsonDataApi();
    let i=0
    res.data.features.forEach(function(point: any) {
      i++
      map.addLayer({
          'id': 'routeLayer'+i,
          'type': 'line',
          'source': {
              'type': 'geojson',
              'lineMetrics': true,
              'data': res.data
          },
          'paint': {
              'line-width': 10,
              'line-opacity': 1,
              'line-color': ['get', 'color'],
          }
      });
    })
  }
  // 添加实时轨迹线
  public addRealRouteSource(map: any) {
    map.addLayer({
        'id': 'realRouteLayer',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'lineMetrics': true,
            'data': this.realRouteGeoJson
        },
        'paint': {
            'line-width': 10,
            'line-opacity': 1,
            'line-color': '#FF9900',
        }
    });
  }
  // 添加箭头图层
  private async addArrowlayer(map: any){
    const res = await getJsonDataApi();
    let i=0
    res.data.features.forEach(function(point: any) {
      i++
      map.addLayer({
          'id': 'arrowLayer'+i,
          'type': 'symbol',
          'source': {
            'type': 'geojson',
            'data': res.data
          },
          'layout': {
            'symbol-placement': 'line',
            'symbol-spacing': 50, // 图标间隔，默认为250
            'icon-image': 'arrowIcon', //箭头图标
            'icon-size': 0.5
          }
      });
    })
  }
  // 添加动态点图层
  public addAnimatePointSource(map: any){
    map.addLayer({
        'id': 'animatePointLayer',
        'type': 'symbol',
        'source': {
            'type': 'geojson',
            'data': this.animatePointGeoJson
        },
        'layout': {
            'icon-image': 'carIcon',
            'icon-size': 1,
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
        }
    });
  }
  //移动效果
  public animate(map: any) {
    if (this.counter >= this.steps) {
        return
    }
    var startPnt, endPnt
    if (this.counter == 0) {
        this.realRouteGeoJson.features[0].geometry.coordinates = []
        startPnt = this.newRouteGeoJson.geometry.coordinates[this.counter]
        endPnt = this.newRouteGeoJson.geometry.coordinates[this.counter + 1]
    } else if (this.counter !== 0) {
        startPnt = this.newRouteGeoJson.geometry.coordinates[this.counter - 1]
        endPnt = this.newRouteGeoJson.geometry.coordinates[this.counter]
    }

    this.animatePointGeoJson.features[0].properties.bearing = turf.bearing(
        turf.point(startPnt),
        turf.point(endPnt)
    ) - 90;
    this.animatePointGeoJson.features[0].geometry.coordinates = this.newRouteGeoJson.geometry.coordinates[this.counter];
    this.realRouteGeoJson.features[0].geometry.coordinates.push(this.animatePointGeoJson.features[0].geometry.coordinates)

    this.map.getSource('animatePointLayer').setData(this.animatePointGeoJson);
    this.map.getSource('realRouteLayer').setData(this.realRouteGeoJson);
    if (this.isPlay) {
        requestAnimationFrame(this.animate);
    }
    this.counter = this.counter + 1;
  }
  public resetRoute(route: any, nstep: number, units: string){
    var newroute = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': []
        }
    }
    var lineDistance = turf.lineDistance(route);
    var nDistance = lineDistance / nstep;
    for (let i = 0; i < this.aLength - 1; i++) {
        var from = turf.point(route.geometry.coordinates[i]);
        var to = turf.point(route.geometry.coordinates[i + 1]);
        let lDistance = turf.distance(from, to, {
            units: units
        });
        if (i == 0) {
          newroute.geometry.coordinates.push(route.geometry.coordinates[0])
        }
        if (lDistance > nDistance) {
            let rings = this.lineMore(from, to, lDistance, nDistance, units)
            newroute.geometry.coordinates = newroute.geometry.coordinates.concat(rings)
        } else {
            newroute.geometry.coordinates.push(route.geometry.coordinates[i + 1])
        }
    }
    return newroute
  }
  public lineMore(from: any, to: any, distance: any, splitLength: any, units: any) {
      var step = parseInt(distance / splitLength)
      var leftLength = distance - step * splitLength
      var rings = []
      var route = turf.lineString([from.geometry.coordinates, to.geometry.coordinates])
      for (let i = 1; i <= step; i++) {
          let nlength = i * splitLength
          let pnt = turf.along(route, nlength, {
              units:units
          });
          rings.push(pnt.geometry.coordinates)
      }
      if (leftLength > 0) {
          rings.push(to.geometry.coordinates)
      }
      return rings
  }
  //时间戳
  public transformTime(timestamp = +new Date()) {
    if (timestamp) {
        var time = new Date(timestamp);
        var y = time.getFullYear();
        var M = time.getMonth() + 1;
        var d = time.getDate();
        var h = time.getHours();
        var m = time.getMinutes();
        var s = time.getSeconds();
        return y + '-' + this.addZero(M) + '-' + this.addZero(d) + ' ' + this.addZero(h) + ':' + this.addZero(m) + ':' + this.addZero(s);
      } else {
          return '';
      }
  }
  public addZero(m: number) {
      return m < 10 ? '0' + m : m;
  }
}
</script>

<style>
@import url('//api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css');

.mgl-map-wrapper {
  height:100%;
  width:100%;
  text-align:left;
}
.mgl-map-wrapper .mapboxgl-map {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left:0;
  bottom: 0;
}
</style>

