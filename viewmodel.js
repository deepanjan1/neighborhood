// model (i.e. study spots)
var studySpots = [{
		name: 'Sergimmo Salumeria',
		location: {
	 		lat: 40.754273,
	 		lng: -73.9976406
		}
	},{
	 	name: 'Blu Café',
	 	location: {
	 		lat: 40.776528,
	 		lng: -73.9912892
	 	}
	},{
		name: 'Irving Farm Roasters',
		location: {
			lat: 40.7834379,
			lng: -73.9816515
		}
	},{
		name: 'La Colombe Noho',
		location: {
			lat: 40.7282208,
			lng: -73.9953544
		}
	},{
		name: 'Intelligentsia Coffee - Highline Hotel',
		location: {
			lat: 40.7457887,
			lng: -74.0052982
		}
	}
];


// console.log(studySpots[1].location.lat);

// initializing map variable
var map;

// initializing the marker that will locate the center of a neighborhood
var marker;


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
	document.getElementById('search-neighborhood').addEventListener('click', function() {
		searchNeighbhorhood();
    });
	// checking if location is turned on browser
	// if (navigator.geolocation) {
	// 	navigator.geolocation.getCurrentPosition(function(pos) {
	// 		var coords = {
	// 			lat: pos.coords.latitude,
	// 			lng: pos.coords.longitude
	// 		};
	// 		console.log(coords);
	// 		// setting the center of the map to the current locaiton
	// 		map.setCenter(coords);
	// 		marker = setMarker(coords);
	// 		});
	// }

}

// Create Markers 
function setMarker(coords) {
	marker = new google.maps.Marker({
		map: map,
		position: coords,
		animation: google.maps.Animation.DROP
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
					marker = setMarker(results[0].geometry.location)
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
	console.log(origin);
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
					console.log(element);
					// var distance = element.distance.text;
					// var duration = element.duration.text;
					// var from = origin[i];
					// var to = destinations[j];
				}
			}
		}
	});
}

function displayMarkers(results){
	var timeDuration = document.getElementById('max-duration').value;
	var origin = response.originAddresses;
	console.log(results)
}