let response = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2021-01-01&endtime=2021-01-02&maxlongitude=-69.52148437&minlongitude=-123.83789062&maxlatitude=48.74894534&minlatitude=25.16517337";

// Fetch earthquake data and process it
d3.json(response).then(function (data) {
    createFeatures(data.features); // Call function to create features
});

// Function to create features (circles representing earthquakes)
function createFeatures(earthquakeData) {
    function onEachFeature(feature, layer) {
        // Bind popup with earthquake details, including latitude, longitude, and depth
        layer.bindPopup(`
            <h3>${feature.properties.place}</h3>
            <p>Date: ${new Date(feature.properties.time)}</p>
            <p>Magnitude: ${feature.properties.mag}</p>
            <p>Latitude: ${feature.geometry.coordinates[1]}</p>
            <p>Longitude: ${feature.geometry.coordinates[0]}</p>
            <p>Depth: ${feature.geometry.coordinates[2]} km</p>
        `);
    }

    // Function to determine radius of the circle based on earthquake magnitude
    function getRadius(magnitude) {
        return magnitude * 8; // Adjust this multiplier as needed for better visualization
    }

    // Function to determine color of the circle based on earthquake depth
    function getColor(depth) {
        return depth > 90 ? '#0000FF' : // Deepest - Blue
               depth > 70 ? '#1E90FF' : // Moderately Deep
               depth > 50 ? '#6495ED' : // Mid Depth
               depth > 30 ? '#7FFFD4' : // Shallow-Mid
               depth > 10 ? '#00FA9A' : // Shallow
                            '#00FF00';  // Surface - Green
    }

    // Function to determine the fill opacity based on depth
    function getOpacity(depth) {
        return depth > 90 ? 1.0 :  // Deepest - Most Opaque
               depth > 70 ? 0.8 :
               depth > 50 ? 0.6 :
               depth > 30 ? 0.4 :
               depth > 10 ? 0.2 :
                            0.1;   // Surface - Least Opaque
    }

    // Create a GeoJSON layer with circles for each earthquake
    let earthquakes = L.geoJSON(earthquakeData, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: getRadius(feature.properties.mag),
                fillColor: getColor(feature.geometry.coordinates[2]), // Use depth for color
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: getOpacity(feature.geometry.coordinates[2]) // Use depth for opacity
            });
        },
        onEachFeature: onEachFeature
    });

    // Call function to create map with the earthquakes layer
    createMap(earthquakes);
}

// Function to create map with base and overlay layers
function createMap(earthquakesLayer) {
    // Define base map layers
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    // Define base maps object
    let baseMaps = {
        "Street Map": street,
        "Topographic Map": topo
    };

    // Define overlay maps object
    let overlayMaps = {
        "Earthquakes": earthquakesLayer
    };

    // Create map centered on US
    let map = L.map("map", {
        center: [37.09, -95.71],
        zoom: 5,
        layers: [street, earthquakesLayer] // Initial layers on load
    });

    // Add layer control to the map
    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Add a legend to the map
    let legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
        let div = L.DomUtil.create('div', 'info legend'),
            depths = [0, 10, 30, 50, 70, 90],
            magnitudes = [1, 2, 3, 4, 5],
            labels = [];

        div.innerHTML += '<strong>Depth (km)</strong><br>';
        // Loop through depth intervals and generate a label with a colored square for each interval
        for (let i = 0; i < depths.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(depths[i] + 1) + '"></i> ' +
                depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+');
        }

        div.innerHTML += '<br><strong>Magnitude</strong><br>';
        // Loop through magnitudes and generate a label with a circle of varying size for each interval
        for (let j = 0; j < magnitudes.length; j++) {
            div.innerHTML +=
                '<i style="background:#000; border-radius: 50%; width:' + getRadius(magnitudes[j]) + 'px; height:' + getRadius(magnitudes[j]) + 'px; display:inline-block;"></i> ' +
                magnitudes[j] + (magnitudes[j + 1] ? '&ndash;' + magnitudes[j + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
}
