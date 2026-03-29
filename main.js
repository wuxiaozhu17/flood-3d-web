const map = L.map('map').setView([28.68, 112.88], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let buildings = {};

fetch('buildings.geojson')
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color:'black', fillColor:'white', fillOpacity:0.8, weight:1 }
    }).eachLayer(l => {
      const id = l.feature.properties.id;
      buildings[id] = l;
      l.bindPopup("ID："+id);
    }).addTo(map);

    return fetch('flood_animation_data.json').then(r => r.json());
  })
  .then(flood => {
    const times = Object.keys(flood);
    const s = document.getElementById('timeSlider');
    const t = document.getElementById('timeLabel');

    s.max = times.length-1;
    t.innerText = times[0];

    s.oninput = () => {
      const now = flood[times[s.value]];
      t.innerText = times[s.value];
      now.forEach(b => {
        const l = buildings[b.id];
        if(!l) return;
        let c = 'white';
        if(b.s===1) c='yellow';
        if(b.s===2) c='red';
        l.setStyle({ fillColor:c });
      });
    };
  });
