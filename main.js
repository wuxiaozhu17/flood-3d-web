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
    // 用天地图影像底图，更适配国内区域，加载更快
    imageryProvider: new Cesium.WebMapServiceImageryProvider({
        url: 'https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=你的天地图key'
    })
});

// 修复：精准定位湘阴县，高度1000米，俯视视角，直接看到建筑
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(112.88, 28.68, 1000), // 湘阴县中心，高度1000米
    orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-80.0), // 俯视角度，不是垂直90度，避免穿模
        roll: 0.0
    },
    duration: 2
});

let buildingEntities = {};
// 修复：添加加载进度提示，避免白屏
viewer.dataSources.add(Cesium.GeoJsonDataSource.load('buildings.geojson', {
    clampToGround: true, // 强制贴地，避免建筑飘空
    stroke: Cesium.Color.BLACK,
    fill: Cesium.Color.WHITE.withAlpha(0.8)
})).then(dataSource => {
    dataSource.entities.values.forEach(entity => {
        const id = entity.properties.id.getValue();
        buildingEntities[id] = entity;
        if (entity.properties.height) {
            entity.polygon.extrudedHeight = entity.properties.height.getValue();
            entity.polygon.perPositionHeight = true; // 按高度拉伸
        }
    });
    // 加载完成后，强制缩放到建筑范围，彻底解决视角问题
    viewer.zoomTo(dataSource.entities, {
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-80), 1000)
    });
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
