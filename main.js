Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    baseLayerPicker: false,
    homeButton: false,
    sceneModePicker: false
});

let buildingEntities = {};
viewer.dataSources.add(Cesium.GeoJsonDataSource.load('buildings.geojson', {
    clampToGround: false,
    stroke: Cesium.Color.BLACK,
    fill: Cesium.Color.WHITE.withAlpha(0.8)
})).then(dataSource => {
    dataSource.entities.values.forEach(entity => {
        const id = entity.properties.Building_ID.getValue();
        buildingEntities[id] = entity;
        if (entity.properties.height) {
            entity.polygon.extrudedHeight = entity.properties.height.getValue();
        }
    });
    loadFloodData();
});

let floodData = {};
function loadFloodData() {
    fetch('flood_animation_data.json')
        .then(res => res.json())
        .then(data => {
            floodData = data;
            const timeList = Object.keys(floodData);
            initTimeSlider(timeList);
            updateBuildings(timeList[0]);
        });
}

function initTimeSlider(timeList) {
    const slider = document.getElementById('timeSlider');
    const label = document.getElementById('timeLabel');

    // ✅ 这里自动适配你的 24 个时间步
    slider.max = timeList.length - 1;
    slider.min = 0;
    slider.value = 0;

    slider.addEventListener('input', () => {
        const currentIndex = parseInt(slider.value);
        const currentTime = timeList[currentIndex];
        label.textContent = currentTime;
        updateBuildings(currentTime);
    });
}

function updateBuildings(currentTime) {
    if (!floodData[currentTime]) return;
    const buildings = floodData[currentTime];
    
    buildings.forEach(b => {
        const entity = buildingEntities[b.id];
        if (!entity) return;
        
        switch(b.s) {
            case 0:
                entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.8);
                break;
            case 1:
                entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.8);
                break;
            case 2:
                entity.polygon.material = Cesium.Color.RED.withAlpha(0.8);
                break;
            default:
                entity.polygon.material = Cesium.Color.WHITE.withAlpha(0.8);
        }

        entity.description = `
            <h3>建筑ID: ${b.id}</h3>
            <p>受灾状态: ${b.s === 0 ? '安全' : b.s === 1 ? '受威胁' : '淹没'}</p>
            <p>积水水深: ${b.d} 米</p>
        `;
    });
}

viewer.zoomTo(viewer.entities);