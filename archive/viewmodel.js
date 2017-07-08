// model for Google Data
var googleData = [];

// model for FourSquare Data
var foursquareData = [];

// global variable for Google Map
var map;

// for locations
var markers = [];

// for center of map
var centerMarker = null;

// global indicator for markers being set; default is false
var markerIndicator = false;

// foursquare vendor API Info
var url = 'https://api.foursquare.com/v2/venues/search';
var client_id = 'RS0YND1BNEBIBRGEM1EUGFCFWYCCPYDP1CWL3ZGATNFFXVFA';
var client_secret = 'X5YXUYI4MWLWA00WCYG3CYBPFLRX4ZKF20I4PRMFWS05T0V3';
var v = '20170623';

// view model
function viewModel(foursquareData) {
	var self = this;
	self.selectedSpots = ko.observableArray(foursquareData);
}

// Initialize the map

function initMap() {
	// this is currently the fixed center
	var coords = {
		lat: 40.777841, 
		lng: -73.9887167
	};

	// initializing map
	map = new google.maps.Map(document.getElementById('map'), {
		center: coords,
		zoom: 13
	});
	// setup event listener for search button
	document.getElementById('search-neighborhood').addEventListener('click', function() {
		// clear all coffee shop markers
		if (markerIndicator == true) {
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
			
			googleData = [];
			foursquareData = [];

			// clear center marker
			centerMarker.setMap(null);
			
			// search for nearby coffee shops
			searchNeighbhorhood();
		} else {
			searchNeighbhorhood();
			// apply bindings only once on the initial start
			console.log(foursquareData);
			ko.applyBindings(new viewModel(foursquareData));
			// set indicator to true to no longer apply bindings in this session
			markerIndicator = true;
		}
    });
}

// Create Markers
function setMarker(coords, iconType) {
	marker = new google.maps.Marker({
		map: map,
		position: coords,
		animation: google.maps.Animation.DROP,
		icon: iconType
	});
	return marker;
}

// Zoom to the area that was typed in the search box
function searchNeighbhorhood() {
	// initialize geocoder
	var geocode = new google.maps.Geocoder();
	
	// pull address from text field
	var address = document.getElementById('search-neighborhood-text').value;

	if (address == '') {
		window.alert('You must enter an area or address.');
	} else {
		geocode.geocode(
			{ address: address,
			  componentRestrictions: {locality: 'New York'}
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var centerCoord = {
						lat: results[0].geometry.location.lat(),
						lng: results[0].geometry.location.lng(), 
					}
					map.setCenter(results[0].geometry.location);
					map.setZoom(15);
					centerMarker = setMarker(results[0].geometry.location);
					studySpotsGoogle(results, centerCoord);
				} else {
					window.alert('We could not find that location - try entering a more specific place');
				}
		});
	}
}

function findPlacesWithinTime(results, centerCoord){
	var distanceMatrixService = new google.maps.DistanceMatrixService;
	var origin = [new google.maps.LatLng(centerCoord.lat, centerCoord.lng)];
	var locations = [];
	var mode = document.getElementById('mode').value;
	var maxDuration = document.getElementById('max-duration').value;
	// pull location data from foursquare data
	for (var i = 0; i < googleData.length; i++) {
		locations[i] = googleData[i].latlng; 
	}
	distanceMatrixService.getDistanceMatrix(
	{
		origins: origin,
		destinations: locations,
		travelMode: google.maps.TravelMode[mode],
		unitSystem: google.maps.UnitSystem.IMPERIAL
	}, function (response, status) {
		if (status == 'OK') {
			var origins = response.originAddresses;
			var destinations = response.destinationAddresses;
			var results = response.rows[0].elements;
			for (var j = 0; j < results.length; j++) {
				var element = results[j];
				if (element.status == 'OK') {
					var distanceText = element.distance.text;
					var duration = element.duration.value/60;
					var durationText = element.duration.text;
					if (duration <= maxDuration) {
						var geocode = new google.maps.Geocoder();
						geocode.geocode(
							{ address: destinations[j],
							  componentRestrictions: {locality: 'New York'}
							}, function (results, status) {
								if (status == google.maps.GeocoderStatus.OK) {
									// Match data back to foursquare
									$.getJSON(url + '?ll=' + results[0].geometry.location.lat() + ',' + results[0].geometry.location.lng()
									 + '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=' + v + 
										'&limit=1', {}, function(data) {
										if (data.meta.code === 200) {
											var venueData = data.response.venues[0];
											var placeInfo = {
												id: venueData.id,
												name: venueData.name,
												phone: venueData.contact.formattedPhone,
												address: venueData.location.formattedAddress[0],
												latlng: new google.maps.LatLng(venueData.location.lat, venueData.location.lng)
											}
										}
										var marker = setMarker(results[0].geometry.location);
										markers.push(marker);
										foursquareData.push(placeInfo);

										// create an info window
										var contentString = '<div id="content">' + '<p><b>Name: </b>' + placeInfo.name + 
											'</p>' + '<p><b>Phone: </b>' + placeInfo.phone + '</p>' + '<p><b>Address: </b>' + 
											placeInfo.address + '</p></div>';

										var infowindow = new google.maps.InfoWindow({
											content: contentString
										});
										infowindow.open(map, marker);

										// close window on click
										markers.infowindow = infowindow;
										google.maps.event.addListener(marker, 'click', function() {
											this.infowindow.close();
										});
									});
								}
								else {
									window.alert('We could not find any locations');
								}								
							}
						);	
					}
				}
			}
		}
	});  
}

// populate place data based on location from Google Places API

function studySpotsGoogle(results, centerCoord) {
	var request = {
		location: centerCoord,
		types: ['cafe'],
		radius: '4000'
	}
	var placeRequest = new google.maps.places.PlacesService(map);
	placeRequest.nearbySearch(request, function (resultsPlaces, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < resultsPlaces.length; i++) {
				var venueData = resultsPlaces[i];
				var placeInfo = {
					id: venueData.id,
					name: venueData.name,
					place_id: venueData.place_id,
					address: venueData.vicinity,
					latlng: venueData.geometry.location
				};
				googleData.push(placeInfo);
			}
			findPlacesWithinTime(results, centerCoord);
		}
	});
}