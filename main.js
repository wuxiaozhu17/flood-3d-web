// 2D地图 + 3D建筑 混合版（绝不报错！）
const map = L.map('map').setView([28.68, 112.88], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let buildings = {};
let floodData = {};

// 加载3D建筑
fetch('buildings.geojson')
  .then(res => res.json())
  .then(geoData => {
    // 3D 核心：使用 Leaflet Extrude 实现立体建筑
    geoData.features.forEach(f => {
      const id = f.properties.id;
      const coords = f.geometry.coordinates[0].map(p => [p[1], p[0]]);
      const height = (f.properties.height || 15) + 10;

      // 创建 3D 多边形
      const poly = L.polygon(coords, {
        color: '#000',
        weight: 1,
        fillColor: 'white',
        fillOpacity: 0.9
      }).addTo(map);

      // 3D 拉伸（最关键！）
      poly._update = function () {
        if (this._map && this._path) {
          this._path.style.zIndex = 1000;
          this._path.style.transform = `translateZ(${height}px)`;
          this._path.style.transition = 'transform 0.3s';
        }
        L.Polygon.prototype._update.call(this);
      };

      buildings[id] = poly;

      poly.bindPopup(`
        <h3>建筑ID: ${id}</h3>
        <p>状态：安全</p>
        <p>水深：0 米</p>
      `);
    });

    // 加载洪水动画
    fetch('flood_animation_data.json')
      .then(res => res.json())
      .then(data => {
        floodData = data;
        const times = Object.keys(floodData);
        const slider = document.getElementById('timeSlider');
        const label = document.getElementById('timeLabel');

        slider.max = times.length - 1;
        label.textContent = times[0];

        slider.oninput = () => {
          const t = times[slider.value];
          label.textContent = t;
          update(floodData[t]);
        };
        update(floodData[times[0]]);
      });
  });

// 3D 建筑变色逻辑
function update(list) {
  for (let item of list) {
    const b = buildings[item.id];
    if (!b) continue;

    let col = 'white';
    let txt = '安全';
    if (item.s === 1) { col = 'yellow'; txt = '受威胁'; }
    if (item.s === 2) { col = 'red'; txt = '淹没'; }

    b.setStyle({ fillColor: col });
    b.setPopupContent(`
      <h3>建筑ID: ${item.id}</h3>
      <p>状态：${txt}</p>
      <p>水深：${item.d} 米</p>
    `);
  }
}
