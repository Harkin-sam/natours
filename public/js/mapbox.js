
export const displayMap = (locations) => {
  // console.log(locations);

  mapboxgl.accessToken =
    'pk.eyJ1IjoiaGF5a2luejEiLCJhIjoiY2xqN242YTluMGkxdDNkcXhwNDRqaTF5MSJ9.ASXlNjkWaFf3iUoG7_TeBQ';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/haykinz1/clj7o2glw007w01pi0qz3623o', // style URL
    //   center: [-118.113491, 34.111745 ], // starting position [lng, lat]
    //   zoom: 10, // starting zoom
    //   interactive: false // this will make the map not interactive so it will look like just a simple image
    scrollZoom: false, // to prevent map zooming onscroll
  });

  //Bounds object is basically the area that will be displayed on the map, it moves and fit the map right to our specified markers
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', // this means is the bottom of the pin pointer icon that will be located at the exact location
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({ offset: 20 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
      .addTo(map);

    // Extend map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  }); // the function that executes the moving and zooming

  //Mapbox just like mongodb expects longitude first and then latitude
};


// we cannot use the mapbox npm library with parcel that why we still use the CDN in pug