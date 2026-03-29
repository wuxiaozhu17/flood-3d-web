// 初始化地图，直接定位湘阴县
const map = L.map('map').setView([28.68, 112.88], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 加载建筑+洪水数据
let buildings = {};
let floodData = {};

// 加载GeoJSON建筑（用你原来的文件，直接读）
fetch('buildings.geojson')
  .then(res => res.json())
  .then(geoData => {
    const layer = L.geoJSON(geoData, {
      style: { color: 'black', fillColor: 'white', weight: 1, fillOpacity: 0.8 }
    }).addTo(map);
    
    // 绑定建筑ID
    layer.eachLayer(layer => {
      const id = layer.feature.properties.id;
      buildings[id] = layer;
      // 点击弹出气泡
      layer.bindPopup(`<h3>建筑ID: ${id}</h3><p>受灾状态: 安全</p><p>积水水深: 0米</p>`);
    });

    // 加载洪水数据
    fetch('flood_animation_data.json')
      .then(res => res.json())
      .then(data => {
        floodData = data;
        const timeList = Object.keys(data);
        const slider = document.getElementById('timeSlider');
        const label = document.getElementById('timeLabel');
        
        slider.max = timeList.length - 1;
        label.textContent = timeList[0];
        
        // 时间轴监听
        slider.addEventListener('input', () => {
          const currentTime = timeList[slider.value];
          label.textContent = currentTime;
          updateBuildings(floodData[currentTime]);
        });
        
        // 初始更新
        updateBuildings(floodData[timeList[0]]);
      });
  });

// 核心：按s值更新建筑颜色
function updateBuildings(buildingList) {
  buildingList.forEach(b => {
    const layer = buildings[b.id];
    if (!layer) return;
    
    // 按s值变色
    let color = 'white';
    let status = '安全';
    if (b.s === 1) { color = 'yellow'; status = '受威胁'; }
    if (b.s === 2) { color = 'red'; status = '淹没'; }
    
    layer.setStyle({ fillColor: color });
    // 更新气泡信息
    layer.setPopupContent(`
      <h3>建筑ID: ${b.id}</h3>
      <p>受灾状态: ${status}</p>
      <p>积水水深: ${b.d} 米</p>
    `);
  });
}
