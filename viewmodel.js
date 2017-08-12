// global variable for map
var map;

// global variable for coffee shop data
var foursquareData = [];


// global variable for start of session
var sessionStarted = true;


// fixed center on initial load
var coords = {
		lat: 40.777841, 
		lng: -73.9887167
	};	

// constructor for travel mode object
var mode = function (text, value) {
	this.displayText = text;
	this.actualValue = value
}

// constructor for time object
var time = function (text, value) {
	this.displayText = text;
	this.actualValue = value
}

// view model
function ViewModel() {
	var self = this;
	// place observable array
	self.selectedSpots = ko.observableArray(foursquareData);
	
	// time observable array
	self.timeDuration = ko.observableArray([
		new time('10 min', 10),
		new time('15 min', 15),
		new time('30 min', 30)
		]);
	self.selectedTime = ko.observable();
	
	// mode observable array
	self.displayMode = ko.observableArray([
		new mode('Drive', 'DRIVING'),
		new mode('Walk', 'WALKING'),
		new mode('Bike', 'BICYCLING'),
		new mode('Transit', 'TRANSIT')
		]);
	self.selectedMode = ko.observable();
	
	self.showInfo = function (foursquareData) {
		foursquareData.marker.infoWindow.open(map, foursquareData.marker);
		foursquareData.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			foursquareData.marker.setAnimation(null); 
		}, 750);
	};

	// neighborhood search
	self.searchText = ko.observable();
	self.searchNeighborhood = function() {
		var address = self.searchText();

		if (address === '') {
			window.alert('You must enter an area or an address.');
		} else {
			// send address to geocode function to convert to lat lng
			geocodeAddress(address, function(){
				getFourSquareData(coords, query);
			});
		}

	}
}

// load Google map
function initMap () {
	map = new google.maps.Map(document.getElementById('map'), {
		center: coords,
		zoom: 13
	});
	getFourSquareData(coords, query);
}



// function to geocode the address and store lat/lng within 
// the coords global variable

function geocodeAddress (address, callback) {
	var geocode = new google.maps.Geocoder();

	geocode.geocode(
		{ address: address
		}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				// update global coords variable
				coords.lat = results[0].geometry.location.lat();
				coords.lng = results[0].geometry.location.lng();

				// set new center
				map.setCenter(coords);
				callback();
			} else {
				window.alert('Could not find the area. Please try again.');
			}
		});
}

// foursquare credentials
var CLIENT_ID = 'RS0YND1BNEBIBRGEM1EUGFCFWYCCPYDP1CWL3ZGATNFFXVFA';
var CLIENT_SECRET = 'X5YXUYI4MWLWA00WCYG3CYBPFLRX4ZKF20I4PRMFWS05T0V3';
var version = '20170623';
var query = 'coffee';
var base_url = 'https://api.foursquare.com/v2/venues/search';

// pull foursquare data
function getFourSquareData(coords, query) {
	removeAllMarkers();
	$.getJSON(base_url + '?ll=' + coords.lat + ',' + coords.lng + 
		'&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=' + version + 
		'&query=' + query, {})
		.done(function(result) {
				for (var i = 0; i < result.response.venues.length; i++) {
					latlng = new google.maps.LatLng(result.response.venues[i].location.lat, 
					result.response.venues[i].location.lng);
					coffeePlace = {
						name: result.response.venues[i].name,
						phone: result.response.venues[i].contact.formattedPhone,
						displayUrl: result.response.venues[i].url,
						htmlUrl: '<a href="' + result.response.venues[i].url + '">' + result.response.venues[i].url + '</a>',
						address: [result.response.venues[i].location.formattedAddress[0],
						result.response.venues[i].location.formattedAddress[1],
						result.response.venues[i].location.formattedAddress[2]],
						latlng: latlng,
						marker: new setMarker(latlng)
					};
					coffeePlace.marker = addBounce(coffeePlace);
					createInfoWindow(coffeePlace);
					foursquareData.push(coffeePlace);
				}
				// check if this is the first session
				if (sessionStarted === true) {
					viewModel.selectedSpots(foursquareData);
					sessionStarted = false;
				} else {
					findDistance();
				}

		})
		.fail(function(result) {
			window.alert('Could not find a coffee shop in your area. Please try again.');
		});
}

// apply filter on fourquare data pull

function findDistance() {
	var distanceMatrixService = new google.maps.DistanceMatrixService();
	var origin = [new google.maps.LatLng(parseFloat(coords.lat), parseFloat(coords.lng))];
	var mode = viewModel.selectedMode().actualValue;
	var maxDuration = viewModel.selectedTime().actualValue;
	
	// create a temporary store for foursquareData
	var filteredList = foursquareData;
	removeAllMarkers();

	filteredList.forEach(function(listItem, i) {
		latlng = [listItem.latlng];
		distanceMatrixService.getDistanceMatrix(
		{
			origins: origin,
			destinations: latlng,
			travelMode: google.maps.TravelMode[mode],
			unitSystem: google.maps.UnitSystem.IMPERIAL 
		}, function (response, status) {
			element = response.rows[0].elements[0];
			if (status == 'OK' && element.status == 'OK') {
				duration = element.duration.value/60;
				if (duration < maxDuration) {
					addMarkers(listItem);

					createInfoWindow(listItem);
					
					foursquareData.push(listItem);

					// Update view model
					viewModel.selectedSpots(foursquareData);
				} 
			}
			if (filteredList.length === 0) {
				window.alert('Could not find a coffee shop in your area. Please increase the search radius.');
			} 			
		});
	});
}

// create a marker
function setMarker(latlng) {
	marker = new google.maps.Marker({
		map: map,
		position: latlng,
		animation: google.maps.Animation.DROP
	});
	return marker;
}

// add marker bounce
function addBounce(placeInfo) {
	placeInfo.marker.addListener('click', function() {
		placeInfo.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			placeInfo.marker.setAnimation(null); 
		}, 750);
	});
	return marker;
}

// remove markers from the map
function removeAllMarkers() {
	for (var i = 0; i < foursquareData.length; i++) {
		foursquareData[i].marker.infoWindow.setMap(null);
		foursquareData[i].marker.setMap(null);
	}
	foursquareData = [];
}

// remove markers from the map
function addMarkers(placeInfo) {
		placeInfo.marker.setMap(map);
}

// open infowindow on click
function createInfoWindow (placeInfo) {
	var contentString = '<div id="content">' + '<p><b>Name: </b>' + placeInfo.name + 
	'</p>' + '<p><b>Phone: </b>' + placeInfo.phone + '</p>' + '<p><b>Address: </b>' + 
	placeInfo.address[0] + '</p></div>';

	var infoWindow = new google.maps.InfoWindow({
		content: contentString
	});

	// add infowindow to the marker object within a place object
	placeInfo.marker.infoWindow = infoWindow;

	// add listener to open infowindow on a marker click
	google.maps.event.addListener(placeInfo.marker, 'click', function() {
		placeInfo.marker.infoWindow.open(map, placeInfo.marker);
	});
}

// on error loading the Google API

function googleAPIError() {
	window.alert('There was an error loading the Google Maps API.  Please reload the page and try again.');	
}

// creating knockout viewModel
var viewModel = new ViewModel();

// apply bindings
ko.applyBindings(viewModel);