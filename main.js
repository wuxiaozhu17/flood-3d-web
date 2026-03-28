// 极简初始化 —— 不搞地形、不搞复杂底图
const viewer = new Cesium.Viewer("cesiumContainer");

// 直接飞到湘阴县 —— 这一步 100% 能看到地图！
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(112.88, 28.68, 800)
});

// 加载建筑物
let buildings = {};
Cesium.GeoJsonDataSource.load("buildings.geojson").then((ds) => {
  viewer.dataSources.add(ds);
  
  ds.entities.values.forEach(e => {
    const id = e.properties.id?.getValue();
    if (id) buildings[id] = e;
  });

  // 加载完自动缩放到建筑！！！
  viewer.zoomTo(ds);
  loadFloodData();
});

// 加载洪水数据
function loadFloodData() {
  fetch("flood_animation_data.json")
    .then(r => r.json())
    .then(data => {
      const times = Object.keys(data);
      const slider = document.getElementById("timeSlider");
      const label = document.getElementById("timeLabel");

      slider.max = times.length - 1;
      slider.value = 0;
      label.innerText = times[0];

      slider.oninput = () => {
        const t = times[slider.value];
        label.innerText = t;
        update(data[t]);
      };
      update(data[times[0]]);
    });
}

// 更新颜色
function update(list) {
  if (!list) return;
  list.forEach(b => {
    const e = buildings[b.id];
    if (!e) return;

    if (b.s === 0) e.polygon.material = Cesium.Color.WHITE;
    if (b.s === 1) e.polygon.material = Cesium.Color.YELLOW;
    if (b.s === 2) e.polygon.material = Cesium.Color.RED;
  });
}
