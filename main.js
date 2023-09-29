const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/a59a3f88-c206-4441-bff6-b545ef7a9e50/style.json?key=lrAb8ZjgXPO37UmKipWz',
    center: [10.165, 54.3635],
    zoom: 12.3,
    bearing: -80,
    pitch: 45
});

map.on("load", function () {
    map.addSource("points", {
        type: "geojson",
        data: myData
    });

    map.addLayer({
        id: "badeStellen",
        source: "points",
        type: "fill",
        paint: {
            "fill-color": "#FFF739",

        }
    });

    // Create a popup, but don't add it to the map yet.
    const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mouseenter', 'badeStellen', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        const placeName = e.features[0].properties.name;
        const placeStatus = e.features[0].properties.status;
        const placeSize = e.features[0].properties.size;
        const rating = e.features[0].properties.rating;

        const coordinates = e.lngLat;
        const description = placeName+" | "+placeSize+" | "+rating; // Replace with your desired content

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });

    map.on('mouseleave', 'badeStellen', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });

});



// create targomo client
const client = new tgm.TargomoClient('westcentraleurope', 'MWQGBPQCHV8L8FVVI1EG')
        // Coordinates to center the map
        const source = { lng: 10.1289, lat: 54.3276, id: 'source' }
        const targets = [
                          { lng: 10.1758, lat: 54.3436, id: 'Hasselfelde' },
                          { lng: 10.1529, lat: 54.3321, id: 'Reventlou' },
                          { lng: 10.1548, lat: 54.3444, id: 'Bellevue' },
                          { lng: 10.1533, lat: 54.3466, id: 'Seebar' },
                          { lng: 10.1562, lat: 54.3711, id: 'Holtenau' },
                          { lng: 10.1904, lat: 54.4007, id: 'Falkenstein' },
                          { lng: 10.1710, lat: 54.4275, id: 'Schilksee' },
                        ];



  // The travel options used to determine which routes should be searched for
    const options = {
        travelType: 'bike',
        maxEdgeWeight: 6000,
        edgeWeight: 'time',
        pathSerializer: 'geojson',
        polygon: {
            srid: 4326
        }
    }

        const emptyData = { 'type': 'FeatureCollection', 'features': [] }

        const sourceMarker = new maplibregl.Marker({ draggable: true, color: '#B1B26C' })
            .setLngLat(source).addTo(map)
        // const targetMarker = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[0]).addTo(map)
        // const targetMarker1 = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[1]).addTo(map)
        // const targetMarker2 = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[2]).addTo(map)
        // const targetMarker3 = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[3]).addTo(map)
        // const targetMarker4 = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[4]).addTo(map)
        // const targetMarker5 = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[5]).addTo(map)
        // const targetMarker6 = new maplibregl.Marker({ draggable: false, color: '#FFFFFF' })
        //     .setLngLat(targets[6]).addTo(map)

        //calculate new routes when either source or target moves
        sourceMarker.on('dragend', getRoute)


        async function getRoute() {
          document.getElementById('message').classList.remove('visible');

          const sourceCoordinates = { ...sourceMarker.getLngLat(), ...{ id: source.id } };

          // Requesting routes from the Targomo API for all targets
          const routes = await client.routes.fetch([sourceCoordinates], targets, options);

          //Traveltime list element
          const routeList = document.getElementById('route-list');
          routeList.innerHTML = ''; // Clear the existing list

          let fastestRouteIndex = -1;
          let fastestTravelTime = Number.MAX_VALUE;

          if (routes && routes.length > 0) {
            // Find the fastest route and its index
            routes.forEach((route, index) => {
              map.getSource(`route${index}`).setData(route);

              const travelTime = route.features[0].properties.travelTime;
              const travelTimeInMinutes = Math.floor(travelTime / 60);
              const placeName2 = route.features[0].properties.name;
              const targetId = targets[index].id;

              const listItem = document.createElement('li');
              listItem.textContent = `${targetId}: ${travelTimeInMinutes}min`;
              routeList.appendChild(listItem);

              // Check if this route is the fastest
              if (travelTime < fastestTravelTime) {
                fastestTravelTime = travelTime;
                fastestRouteIndex = index;
              }
            });

            // Apply a yellow font color to the fastest route in the list
            if (fastestRouteIndex !== -1) {
              const fastestListItem = routeList.children[fastestRouteIndex];
              fastestListItem.style.color = '#FFF739';
            }

            // Calculate the bounding box for all routes and fit the map
            const combinedRoute = { type: 'FeatureCollection', features: routes };
            map.fitBounds(turf.bbox(combinedRoute), { padding: 20 });
          } else {
            // No routes found for any targets
            targets.forEach((target, index) => {
              map.getSource(`route${index}`).setData(emptyData);
            });
            document.getElementById('message').classList.add('visible');
          }
        }



      map.on('load', () => {
      // Add empty sources and layers for each route
      targets.forEach((_, index) => {
        map.addSource(`route${index}`, {
          type: 'geojson',
          data: emptyData,
          attribution: '<a href="https://www.targomo.com/developers/resources/attribution/" target="_blank">&copy; Targomo</a>'
        });

        map.addLayer({
          id: `route${index}`,
          type: 'line',
          source: `route${index}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': [
              'match',
              ['get', 'travelType'],
              'TRANSIT', 'red',
              'WALK', 'green',
              'BIKE', '#B1B26C',
              'grey'
            ],
            'line-width': 1.8
          },
          filter: ['==', ['geometry-type'], 'LineString']
        });
      });

      getRoute();
    });




    // Add this code to your existing JavaScript code
    document.addEventListener('DOMContentLoaded', function () {
      const overlayButton = document.getElementById('overlay-button');
      const overlay = document.querySelector('.overlay');

      overlayButton.addEventListener('click', function () {
        overlay.classList.toggle('hidden'); // Toggle the 'hidden' class to show/hide the overlay
      });
    });
