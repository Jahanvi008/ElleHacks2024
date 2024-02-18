let map, infoWindow;
let userPos;
let time = '';
let lat = '';
let long = '';
let color = '';
let confirmedMarkers = [];
let selectedMarkerColor = null;

// Shows the side menu bar when clicked on it
function toggleMarkerMenu() {
  const menu = document.querySelector('.marker-menu');
  menu.classList.toggle('active');
}

// Function to check if marker already exists
function markerExists(marker) {
  return confirmedMarkers.some(existingMarker => {
    return existingMarker.lat === marker.lat && existingMarker.long === marker.long;
  });
}

//Initialize the map
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  map = new google.maps.Map(document.getElementById("googleMap"), {
    center: { lat: 43.772555690917805, lng: -79.5064801469422 },
    zoom: 12,
  });

  fetch('/api/markers')
  .then(response => response.json())
  .then(markers => {
    addMarkersFromDatabase(markers);
  })
  .catch(error => {
    console.error('Error fetching markers:', error);
  });


  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer({ map: map });

  // Code to access current location of the user
  infoWindow = new google.maps.InfoWindow();

  const locationButton = document.getElementById("custom-map-control-button");

  locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          userPos = pos.lat;

          infoWindow.setPosition(pos);
          infoWindow.setContent("Location found.");
          infoWindow.open(map);
          console.log("pos: ", pos);
          console.log("userpos: ", userPos);
          map.setCenter(pos);
          
          // Send position to server after obtaining it
          //sendPositionToServer(userPos);
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });

  // Code to autocomplete the address search
  const card = document.getElementById("pac-card");
  const input = document.getElementById("pac-input");
  const biasInputElement = document.getElementById("use-location-bias");
  const strictBoundsInputElement =
    document.getElementById("use-strict-bounds");
  const options = {
    fields: ["formatted_address", "geometry", "name"],
    strictBounds: false,
  };

  const autocomplete = new google.maps.places.Autocomplete(input,options);

  autocomplete.bindTo("bounds", map);

  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");

  infowindow.setContent(infowindowContent);

  const marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29),
  });

  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    marker.setVisible(false);

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      window.alert(
        "No details available for input: '" + place.name + "'");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(12);
    }

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
    infowindowContent.children["place-name"].textContent = place.name;
    infowindowContent.children["place-address"].textContent =
      place.formatted_address;
    infowindow.open(map, marker);
  });

  // Sets a listener on a radio button to change the filter type on Places
  function setupClickListener(id, types) {
    const radioButton = document.getElementById(id);

    radioButton.addEventListener("click", () => {
      autocomplete.setTypes(types);
      input.value = "";
    });
  }

  setupClickListener("changetype-all", []);
  setupClickListener("changetype-address", ["address"]);
  setupClickListener("changetype-establishment", ["establishment"]);
  setupClickListener("changetype-geocode", ["geocode"]);
  setupClickListener("changetype-cities", ["Cities"]);
  setupClickListener("changetype-regions", ["Regions"]);
  biasInputElement.addEventListener("change", () => {
    if (biasInputElement.checked) {
      autocomplete.bindTo("bounds", map);
    } else {
      autocomplete.unbind("bounds");
      autocomplete.setBounds({
        east: 180,
        west: -180,
        north: 90,
        south: -90,
      });
      strictBoundsInputElement.checked = biasInputElement.checked;
    }

    input.value = "";
  });

  strictBoundsInputElement.addEventListener("change", () => {
    autocomplete.setOptions({
      strictBounds: strictBoundsInputElement.checked,
    });
    if (strictBoundsInputElement.checked) {
      biasInputElement.checked = strictBoundsInputElement.checked;
      autocomplete.bindTo("bounds", map);
    }

    input.value = "";
  });

  // Event listeners for marker color selection
  const markerOptions = document.querySelectorAll('.marker-option');
  markerOptions.forEach(option => {
      option.addEventListener('click', () => {
          selectedMarkerColor = option.id;
      });
  });

  // Event listener for adding marker on map click
  map.addListener('click', (event) => {
      if (selectedMarkerColor) {
          addMarker(event.latLng, selectedMarkerColor);
      } else {
          alert('Please select a marker color from the side menu.');
      }
  });
}

const output = document.querySelector('#output');
//define calcRoute function
function calculateRoute() {
  var options = {
    fields: ["formatted_address", "geometry", "name"],
    strictBounds: false,
  };

  var input1 = document.getElementById("start");
  var autocomplete1 = new google.maps.places.Autocomplete(input1, options);

  var input2 = document.getElementById("destination");
  var autocomplete2 = new google.maps.places.Autocomplete(input2, options);

  autocomplete1.bindTo("bounds", map);
  autocomplete2.bindTo("bounds", map);

  autocomplete1.addListener("place_changed", () => {
    const place = autocomplete1.getPlace();
    if (!place.geometry || !place.geometry.location) {
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }
    map.setCenter(place.geometry.location);
    map.setZoom(12);
  });

  autocomplete2.addListener("place_changed", () => {
    const place = autocomplete2.getPlace();
    if (!place.geometry || !place.geometry.location) {
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }
    map.setCenter(place.geometry.location);
    map.setZoom(12);
  });

  //create request
  var request = {
      origin: document.getElementById("start").value,
      destination: document.getElementById("destination").value,
      travelMode: google.maps.TravelMode.DRIVING, //WALKING, BYCYCLING, TRANSIT
      unitSystem: google.maps.UnitSystem.IMPERIAL
  }

  //pass the request to the route method
  directionsService.route(request, function (result, status) {
      if (status == google.maps.DirectionsStatus.OK) {

          //Get distance and time
          const output = document.querySelector('#output');
          output.innerHTML = "<div class='alert-info'>From: " + document.getElementById("start").value + ".<br />To: " + document.getElementById("destination").value + ".<br /> Driving distance <i class='fas fa-road'></i> : " + result.routes[0].legs[0].distance.text + ".<br />Duration <i class='fas fa-hourglass-start'></i> : " + result.routes[0].legs[0].duration.text + ".</div>";

          //display route
          directionsDisplay.setDirections(result);
      } else {
          //delete route from map
          directionsDisplay.setDirections({ routes: [] });
          //center map in London
          map.setCenter({ lat: -34.397, lng: 150.644 });

          //show error message
          output.innerHTML = "<div class='alert-danger'><i class='fas fa-exclamation-triangle'></i> Could not retrieve driving distance.</div>";
      }
  });
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

function addMarker(location) {
  const confirmation = confirm("Do you want to add a marker at this location?");
  if (confirmation) {
      const newMarker = new google.maps.Marker({
          position: location,
          map: map,
          icon: getMarkerIcon(selectedMarkerColor),
          draggable: true
      });

      const timestamp = Date.now();

      sendPositionToServer({time: timestamp, lat : newMarker.position.lat(), long: newMarker.position.lng(), color: selectedMarkerColor});

    // Push the new marker to an array or any data structure to keep track of confirmed markers
    confirmedMarkers.push({
        marker: newMarker,
    });
  }
}

function addMarkerToMap(location, color) {
  const iconUrl = getMarkerIcon(color);
  const newMarker = new google.maps.Marker({
    position: location,
    map: map,
    icon: iconUrl,
    draggable: true
  });


  // Push the new marker to the confirmedMarkers array
  confirmedMarkers.push({
    marker: newMarker,
    lat: location.lat,
    long: location.lng,
    color: selectedMarkerColor
  });
}

// Function to add markers from the database to the map
function addMarkersFromDatabase(markers) {
  
  markers.forEach(marker => {
    
      if (!markerExists(marker)) {
        // Add marker to map
        const position = { time: marker.time, lat: marker.lat, lng: marker.long , color:marker.color};
        addMarkerToMap(position, marker.color);
        console.log('marker color from main.js:', marker.color);
      }
      else {
      console.error('Invalid latitude or longitude:', marker);
    }
});
}


function getMarkerIcon(color) {
  return {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
  };
}

function sendPositionToServer(position) {
  console.log('position before fetch:', position);

  position.color = selectedMarkerColor;

  fetch('/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(position), 
    
  })
  .then(response => {
    console.log('response:', response);
    return response.json();
  })
    
 
  .then(data => {
    console.log('Server returns this message: ', data);
    console.log('position from main.js:', position);
  })
  .catch((error) => {
    console.error('Error sending position to server:', error);
  });
}


window.initMap = initMap;