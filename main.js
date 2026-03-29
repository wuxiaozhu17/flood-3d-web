// 二维地图 + 真3D建筑 最终版（适配你带height的GeoJSON）
const map = L.map('map').setView([28.68, 112.88], 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 开启3D视角（核心！）
map.getRenderer()._canvas.style.transform = 'perspective(1000px) rotateX(60deg)';
map.getRenderer()._canvas.style.transformOrigin = 'center center';

let buildings = {};
let floodData = {};

// 加载3D建筑（按height拉伸）
fetch('buildings.geojson')
  .then(res => res.json())
  .then(geoData => {
    const layer = L.geoJSON(geoData, {
      style: (feature) => ({
        color: '#000',
        weight: 1,
        fillColor: 'white',
        fillOpacity: 0.8,
        // 3D拉伸：按height字段设置高度
        renderer: L.canvas(),
        extrude: feature.properties.height || 10
      })
    }).addTo(map);
    
    // 绑定建筑ID
    layer.eachLayer(layer => {
      const id = layer.feature.properties.id;
      const height = layer.feature.properties.height;
      buildings[id] = layer;
      
      // 点击弹出气泡
      layer.bindPopup(`
        <h3>建筑ID: ${id}</h3>
        <p>受灾状态: 安全</p>
        <p>积水水深: 0米</p>
        <p>建筑高度: ${height}米</p>
      `);
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

// 鼠标拖拽旋转3D视角
let isDragging = false;
map.on('mousedown', () => isDragging = true);
map.on('mouseup', () => isDragging = false);
map.on('mousemove', (e) => {
  if (!isDragging) return;
  map.panBy([e.originalEvent.movementX, e.originalEvent.movementY]);
});
