Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const viewer = new Cesium.Viewer('cesiumContainer', {
    baseLayerPicker: false,
    homeButton: false,
    sceneModePicker: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    navigationHelpButton: false,
    geocoder: false,
    imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
    })
});

// 修复：强制视角定位到湘阴县（东经112.88°，北纬28.68°），解决全黑问题
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(112.88, 28.68, 5000), // 湘阴县中心坐标，高度5000米
    orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0
    },
    duration: 3 // 3秒飞过去
});

let buildingEntities = {};
viewer.dataSources.add(Cesium.GeoJsonDataSource.load('buildings.geojson', {
    clampToGround: false,
    stroke: Cesium.Color.BLACK,
    fill: Cesium.Color.WHITE.withAlpha(0.8)
})).then(dataSource => {
    dataSource.entities.values.forEach(entity => {
        const id = entity.properties.id.getValue();
        buildingEntities[id] = entity;
        if (entity.properties.height) {
            entity.polygon.extrudedHeight = entity.properties.height.getValue();
        }
    });
    // 加载完成后，自动缩放到建筑范围
    viewer.zoomTo(dataSource.entities);
    loadFloodData();
}).catch(err => {
    console.error("建筑加载失败:", err);
    alert("建筑数据加载失败，请检查GeoJSON格式/坐标系");
});

let floodData = {};
function loadFloodData() {
    fetch('flood_animation_data.json')
        .then(res => {
            if (!res.ok) throw new Error("JSON加载失败");
            return res.json();
        })
        .then(data => {
            floodData = data;
            const timeList = Object.keys(floodData);
            initTimeSlider(timeList);
            updateBuildings(timeList[0]);
        })
        .catch(err => {
            console.error("JSON加载失败:", err);
            alert("洪水数据加载失败，请检查文件名/格式");
        });
}

function initTimeSlider(timeList) {
    const slider = document.getElementById('timeSlider');
    const label = document.getElementById('timeLabel');
    slider.max = timeList.length - 1;
    slider.min = 0;
    slider.value = 0;
    label.textContent = timeList[0];

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
