/**
 * maps.js — Drive Smart Portal: Maps Feature
 * Isolated module. Does NOT touch any global state from other pages.
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let map, directionsService, directionsRenderer, trafficLayer;
  let autocompleteSource, autocompleteDest;
  let currentRoutes = [];       // all returned routes
  let selectedRouteIndex = 0;

  // ── DOM refs (resolved after DOMContentLoaded) ─────────────────────────────
  let elSource, elDest, elStatus, elRouteInfo, elAltRoutes, elTrafficLegend, elBtnNavigate;

  // ── Init ───────────────────────────────────────────────────────────────────
  function initMap() {
    elSource        = document.getElementById('maps-source');
    elDest          = document.getElementById('maps-dest');
    elStatus        = document.getElementById('maps-status');
    elRouteInfo     = document.getElementById('maps-route-info');
    elAltRoutes     = document.getElementById('maps-alt-routes');
    elTrafficLegend = document.getElementById('maps-traffic-legend');
    elBtnNavigate   = document.getElementById('maps-btn-navigate');

    // Default center: India
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };

    map = new google.maps.Map(document.getElementById('maps-map'), {
      center: defaultCenter,
      zoom: 5,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false,
    });

    directionsService  = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,       // show A/B markers
      polylineOptions: { strokeWeight: 5 },
    });

    // Traffic layer (visual congestion colours)
    trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    elTrafficLegend.classList.add('visible');

    // Places Autocomplete
    if (google.maps.places) {
      autocompleteSource = new google.maps.places.Autocomplete(elSource, { fields: ['geometry', 'name'] });
      autocompleteDest   = new google.maps.places.Autocomplete(elDest,   { fields: ['geometry', 'name'] });
    }

    // Try to centre on user's location immediately
    locateUser(false);
  }

  // ── Geolocation ────────────────────────────────────────────────────────────
  function locateUser(fillSource) {
    if (!navigator.geolocation) {
      showStatus('Geolocation is not supported by your browser.', 'error');
      return;
    }
    showStatus('Detecting your location…', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(latlng);
        map.setZoom(14);

        if (fillSource) {
          // Reverse-geocode to get a human-readable address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
              elSource.value = results[0].formatted_address;
              showStatus('Current location set as source.', 'success');
            } else {
              // Fallback: use lat,lng string
              elSource.value = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
              showStatus('Current location set as source (coordinates).', 'success');
            }
          });
        } else {
          hideStatus();
          // Drop a small "you are here" marker
          new google.maps.Marker({
            position: latlng,
            map,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });
        }
      },
      (err) => {
        showStatus('Could not get location: ' + err.message, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Route calculation ──────────────────────────────────────────────────────
  function calculateRoute() {
    const src  = elSource.value.trim();
    const dest = elDest.value.trim();

    if (!src || !dest) {
      showStatus('Please enter both source and destination.', 'error');
      return;
    }

    showStatus('Calculating route…', 'info');
    elRouteInfo.classList.remove('visible');
    elAltRoutes.classList.remove('visible');
    elAltRoutes.innerHTML = '';

    directionsService.route(
      {
        origin: src,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),          // enables traffic-aware ETA
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
        provideRouteAlternatives: true,       // request alternate routes
      },
      handleRouteResult
    );
  }

  function handleRouteResult(result, status) {
    if (status !== google.maps.DirectionsStatus.OK) {
      showStatus('Could not find a route: ' + status, 'error');
      return;
    }

    currentRoutes = result.routes;
    selectedRouteIndex = 0;
    renderRoute(0, result);

    // Show info for best route
    displayRouteInfo(currentRoutes[0], 0);

    // Update the "Open in Google Maps" button URL
    const src  = encodeURIComponent(elSource.value.trim());
    const dest = encodeURIComponent(elDest.value.trim());
    elBtnNavigate.href = `https://www.google.com/maps/dir/?api=1&origin=${src}&destination=${dest}&travelmode=driving`;
    elBtnNavigate.style.display = 'block';

    // Show alternate routes if any
    if (currentRoutes.length > 1) {
      buildAltRoutesList(result);
    }

    hideStatus();
  }

  function renderRoute(index, fullResult) {
    directionsRenderer.setDirections(fullResult);
    directionsRenderer.setRouteIndex(index);
  }

  function displayRouteInfo(route, index) {
    const leg = route.legs[0];
    document.getElementById('maps-info-distance').textContent = leg.distance.text;
    document.getElementById('maps-info-duration').textContent =
      leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration.text;
    document.getElementById('maps-info-via').textContent =
      route.summary || 'Best route';
    elRouteInfo.classList.add('visible');
  }

  function buildAltRoutesList(fullResult) {
    elAltRoutes.innerHTML = '';
    currentRoutes.forEach((route, i) => {
      const leg  = route.legs[0];
      const time = leg.duration_in_traffic ? leg.duration_in_traffic.text : leg.duration.text;
      const div  = document.createElement('div');
      div.className = 'alt-route-item' + (i === 0 ? ' selected' : '');
      div.innerHTML = `<strong>Route ${i + 1}</strong> via ${route.summary || '—'} &nbsp;·&nbsp; ${leg.distance.text} &nbsp;·&nbsp; ${time}`;
      div.addEventListener('click', () => {
        document.querySelectorAll('.alt-route-item').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        selectedRouteIndex = i;
        directionsRenderer.setRouteIndex(i);
        displayRouteInfo(route, i);
      });
      elAltRoutes.appendChild(div);
    });
    elAltRoutes.classList.add('visible');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showStatus(msg, type) {
    elStatus.textContent = msg;
    elStatus.className = type;   // 'info' | 'error' | 'success'
  }
  function hideStatus() { elStatus.className = ''; elStatus.textContent = ''; }

  // ── Expose initMap globally so Google Maps callback can reach it ───────────
  window.mapsPageInit = initMap;

  // ── Wire up buttons after DOM ready ───────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('maps-btn-route')
      .addEventListener('click', calculateRoute);

    document.getElementById('maps-btn-locate')
      .addEventListener('click', () => locateUser(true));

    // Allow Enter key in inputs to trigger route
    ['maps-source', 'maps-dest'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') calculateRoute();
      });
    });
  });

})();
