const map = L.map("map").setView(
    [coordinates[1], coordinates[0]],
    13
);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: 'Developed by Ayush_UV' 
    }
).addTo(map);

// Red marker icon
const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.marker(
    [window.coordinates[1], window.coordinates[0]],
    { icon: redIcon }
)
.addTo(map)
.bindPopup(`<b>${window.locationName}</b>`)
.openPopup();