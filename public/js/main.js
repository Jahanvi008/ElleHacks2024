let map, infoWindow;
let userPos;
let confirmedMarkers = [];

// Shows the side menu bar when clicked on it
function toggleMarkerMenu() {
  const menu = document.querySelector('.marker-menu');
  menu.classList.toggle('active');
}

//Initialize the map
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  map = new google.maps.Map(document.getElementById("googleMap"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 6,
  });

  // Code to access current location of the user
  infoWindow = new google.maps.InfoWindow();

  const locationButton = document.createElement("button");

  locationButton.textContent = "Use Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(
    locationButton
  );
  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
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
          sendPositionToServer(userPos);
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

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

  const autocomplete = new google.maps.places.Autocomplete(
    input,
    options
  );

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the bounds option in the request.
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
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert(
        "No details available for input: '" + place.name + "'"
      );
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
    infowindowContent.children["place-name"].textContent = place.name;
    infowindowContent.children["place-address"].textContent =
      place.formatted_address;
    infowindow.open(map, marker);
  });

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
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
      // User wants to turn off location bias, so three things need to happen:
      // 1. Unbind from map
      // 2. Reset the bounds to whole world
      // 3. Uncheck the strict bounds checkbox UI (which also disables strict bounds)
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
          addMarker(event.latLng);
      } else {
          alert('Please select a marker color from the side menu.');
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
      // Push the new marker to an array or any data structure to keep track of confirmed markers
      confirmedMarkers.push(newMarker);
  }
}


function getMarkerIcon(color) {
  return {
      url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
  };
}

function sendPositionToServer(position) {
  fetch('/api/position', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ position }),
  })
  .then(response => console.log(response))
  .then(data => {
    console.log('Position sent to server:', data);
  })
  .catch((error) => {
    console.error('Error sending position to server:', error);
  });
}

window.initMap = initMap;