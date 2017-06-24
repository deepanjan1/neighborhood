// model (i.e. study spots)

var studySpots = [{
		name: 'Sergimmo Salumeria',
		location: {
	 		lat: 40.754273,
	 		lng: -73.9976406
		},
		phone: '',
		formattedAddress: ''
	},{
	 	name: 'Blu Café',
	 	location: {
	 		lat: 40.776528,
	 		lng: -73.9912892
	 	},
		phone: '',
		formattedAddress: ''
	},{
		name: 'Irving Farm Roasters',
		location: {
			lat: 40.7834379,
			lng: -73.9816515
		},
		phone: '',
		formattedAddress: ''
	},{
		name: 'La Colombe Noho',
		location: {
			lat: 40.7282208,
			lng: -73.9953544
		},
		phone: '',
		formattedAddress: ''
	},{
		name: 'Intelligentsia Coffee - Highline Hotel',
		location: {
			lat: 40.7457887,
			lng: -74.0052982
		},
		phone: '',
		formattedAddress: ''
	}
];

// model for FourSquare Data
var fourSquareData = [];

// global variable for Google Map

var map;

var markers = [];

// foursquare vendor API Info
var url = 'https://api.foursquare.com/v2/venues/search';
var client_id = 'RS0YND1BNEBIBRGEM1EUGFCFWYCCPYDP1CWL3ZGATNFFXVFA';
var client_secret = 'X5YXUYI4MWLWA00WCYG3CYBPFLRX4ZKF20I4PRMFWS05T0V3';
var v = '20170623';

// populate foursquare data for places found in database
function studySpotsFoursquare(studySpots) {
	for (var i = 0; i < studySpots.length; i++) {
		var firstWord = [];
		var words = studySpots[i].name.split(" ");
		firstWord.push(words[0]);
		$.getJSON(url + '?ll=' + studySpots[i].location.lat + ',' + studySpots[i].location.lng + '&client_id=' + client_id + '&client_secret=' + client_secret + '&v=' + v + '&query=' + firstWord, {}, function(data) {
				if (data.meta.code === 200) {
					var venueData = data.response.venues[0];
					var placeInfo = {
						id: venueData.id,
						name: venueData.name,
						phone: venueData.contact.formattedPhone,
						address: venueData.location.formattedAddress
					}
					fourSquareData.push(placeInfo);
				} else {
					console.log("Error: " + data.meta.code);
				}
			});
	}
}



// view model
function viewModel(coffeeShops) {
	var self = this;
	self.selectedSpots = ko.observableArray(coffeeShops);
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

	// initialize list
	studySpotsFoursquare(studySpots);
	console.log(fourSquareData);

	// setup event listener for search button
	document.getElementById('search-neighborhood').addEventListener('click', function() {
		searchNeighbhorhood();
		ko.applyBindings(new viewModel(fourSquareData));
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
					map.setCenter(results[0].geometry.location);
					map.setZoom(15);
					marker = setMarker(results[0].geometry.location);
					findPlacesWithinTime(results);
				} else {
					window.alert('We could not find that location - try entering a more specific place');
				}
		});
	}
}

function findPlacesWithinTime(results){
	var distanceMatrixService = new google.maps.DistanceMatrixService;
	var origin = [results[0].formatted_address];
	var locations = [];
	var mode = document.getElementById('mode').value;
	var maxDuration = document.getElementById('max-duration').value;
	for (var i = 0; i < studySpots.length; i++) {
		locations[i] = studySpots[i].location; 
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
			for (var i = 0; i < origins.length; i++) {
				var results = response.rows[i].elements;
				for (var j = 0; j < results.length; j++) {
					var element = results[j];
					if (element.status == "OK") {
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
									var marker = setMarker(results[0].geometry.location);
									markers.push(marker);
									
									// create an info window
									var infowindow = new google.maps.InfoWindow({
										content: durationText + ' away, ' + distanceText
									});
									infowindow.open(map, marker);
									
									// close window on click
									markers.infowindow = infowindow;
									google.maps.event.addListener(marker, 'click', function() {
										this.infowindow.close();
									});
								}
								else {
									window.alert('We could not find any locations');
								}								
							});	
						}
					}
				}
			} 
		}
	});  
}


//////////////////////////////////////////
// model (i.e. study spots)
// var studySpots = [{
// 		name: 'Sergimmo Salumeria',
// 		location: {
// 	 		lat: 40.754273,
// 	 		lng: -73.9976406
// 		}
// 	},{
// 	 	name: 'Blu Café',
// 	 	location: {
// 	 		lat: 40.776528,
// 	 		lng: -73.9912892
// 	 	}
// 	},{
// 		name: 'Irving Farm Roasters',
// 		location: {
// 			lat: 40.7834379,
// 			lng: -73.9816515
// 		}
// 	},{
// 		name: 'La Colombe Noho',
// 		location: {
// 			lat: 40.7282208,
// 			lng: -73.9953544
// 		}
// 	},{
// 		name: 'Intelligentsia Coffee - Highline Hotel',
// 		location: {
// 			lat: 40.7457887,
// 			lng: -74.0052982
// 		}
// 	}
// ];

// initializing map variable
// var map;

// initializing the marker that will locate the center of a neighborhood
// var markers = [];


// function initMap() {
// 	// this is currently the fixed center
// 	var coords = {
// 		lat: 40.777841, 
// 		lng: -73.9887167
// 	};

// 	// initializing map
// 	map = new google.maps.Map(document.getElementById('map'), {
// 		center: coords,
// 		zoom: 13
// 	});
// 	document.getElementById('search-neighborhood').addEventListener('click', function() {
// 		searchNeighbhorhood();
//     });

// }

// Create Markers 
// function setMarker(coords) {
// 	marker = new google.maps.Marker({
// 		map: map,
// 		position: coords,
// 		animation: google.maps.Animation.DROP
// 	});
// 	return marker;
// }

// Zoom to the area that was typed in the search box
// function searchNeighbhorhood() {
// 	// initialize geocoder
// 	var geocode = new google.maps.Geocoder();
	
// 	// pull address from text field
// 	var address = document.getElementById('search-neighborhood-text').value;

// 	if (address == '') {
// 		window.alert('You must enter an area or address.');
// 	} else {
// 		geocode.geocode(
// 			{ address: address,
// 			  componentRestrictions: {locality: 'New York'}
// 			}, function(results, status) {
// 				if (status == google.maps.GeocoderStatus.OK) {
// 					map.setCenter(results[0].geometry.location);
// 					map.setZoom(15);
// 					marker = setMarker(results[0].geometry.location);
// 					findPlacesWithinTime(results);
// 				} else {
// 					window.alert('We could not find that location - try entering a more specific place');
// 				}
// 		});
// 	}
// }

// function findPlacesWithinTime_archive(results){
// 	var distanceMatrixService = new google.maps.DistanceMatrixService;
// 	var origin = [results[0].formatted_address];
// 	var locations = [];
// 	var mode = document.getElementById('mode').value;
// 	var maxDuration = document.getElementById('max-duration').value;
// 	for (var i = 0; i < studySpots.length; i++) {
// 		locations[i] = studySpots[i].location; 
// 	}

// 	distanceMatrixService.getDistanceMatrix(
// 	{
// 		origins: origin,
// 		destinations: locations,
// 		travelMode: google.maps.TravelMode[mode],
// 		unitSystem: google.maps.UnitSystem.IMPERIAL
// 	}, function (response, status) {
// 		if (status == 'OK') {
// 			var origins = response.originAddresses;
// 			var destinations = response.destinationAddresses;
// 			for (var i = 0; i < origins.length; i++) {
// 				var results = response.rows[i].elements;
// 				for (var j = 0; j < results.length; j++) {
// 					var element = results[j];
// 					if (element.status == "OK") {
// 						var distanceText = element.distance.text;
// 						var duration = element.duration.value/60;
// 						var durationText = element.duration.text;
// 						if (duration <= maxDuration) {
// 							var geocode = new google.maps.Geocoder();
// 								geocode.geocode(
// 							{ address: destinations[j],
// 							  componentRestrictions: {locality: 'New York'}
// 							}, function (results, status) {
// 								if (status == google.maps.GeocoderStatus.OK) {
// 									var marker = setMarker(results[0].geometry.location);
// 									markers.push(marker);
									
// 									// create an info window
// 									var infowindow = new google.maps.InfoWindow({
// 										content: durationText + ' away, ' + distanceText
// 									});
// 									infowindow.open(map, marker);
									
// 									// close window on click
// 									markers.infowindow = infowindow;
// 									google.maps.event.addListener(marker, 'click', function() {
// 										this.infowindow.close();
// 									});
// 								}
// 								else {
// 									window.alert('We could not find any locations');
// 								}								
// 							});	
// 						}
// 					}
// 				}
// 			} 
// 		}
// 	});  
// }

function displayMarkers(results){
	var timeDuration = document.getElementById('max-duration').value;
	var origin = response.originAddresses;
	console.log(results);
}