// global variable for map
var map

var foursquareData = [];

// fixed center on initial load
var coords = {
		lat: 40.777841, 
		lng: -73.9887167
	};	

// view model
function viewModel() {
	var self = this;
	self.selectedSpots = ko.observableArray(foursquareData);
}

// load Google map
function initMap () {
	map = new google.maps.Map(document.getElementById('map'), {
		center: coords,
		zoom: 13
	});
	getFourSquareData(coords, query);

	document.getElementById('search-neighborhood').addEventListener('click', function() {
		var address = document.getElementById('search-neighborhood-text').value;
		
		if (address == '') {
			window.alert('You must enter an area or an address.')
		} else {
			// send address to geocode function to convert to lat lng
			geocodeAddress(address, function(){
				getFourSquareData(coords, query);
			});
		}
	});
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
				window.alert('Could not find the area. Please try again.')
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
	$.getJSON(base_url + '?ll=' + coords.lat + ',' + coords.lng 
		+ '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=' + version + 
		'&query=' + query, {}, function(result) {
			foursquareData = [];
			for (var i = 0; i < result.response.venues.length; i++) {
				coffeePlace = {
					name: result.response.venues[i].name,
					phone: result.response.venues[i].contact.formattedPhone,
					url: result.response.venues[i].url,
					address: [result.response.venues[i].location.formattedAddress[0],
					result.response.venues[i].location.formattedAddress[1],
					result.response.venues[i].location.formattedAddress[2]],
					latlng: new google.maps.LatLng(result.response.venues[i].location.lat, 
						result.response.venues[i].location.lng)
				};
				foursquareData.push(coffeePlace);
			}
			ViewModel.selectedSpots(foursquareData);
			console.log(foursquareData);
	});
}

// apply filter on fourquare data pull

function findDistance(mode, maxDuration) {
	var distanceMatrixService = new google.maps.DistanceMatrixService;
	var origin = [new google.maps.LatLng(parseFloat(coords.lat), parseFloat(coords.lng))];

	// create a temporary store for foursquareData
	var filteredList = [];
	for (var i = 0; i < foursquareData.length; i++) {
		(function outer(j) {
			latlng = [foursquareData[i].latlng];
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
						filteredList.push(foursquareData[j]);
					}
				} 
			});
		})(i)
	}

	// empty foursquareData array
	foursquareData = [];
	// set foursquareData array to filteredList
	foursquareData = filteredList;
	console.log(filteredList);
	// update to ViewModel
	ViewModel.selectedSpots(foursquareData);
}


var ViewModel = new viewModel();

// apply bindings
ko.applyBindings(ViewModel);


// var myName = [
// 	{name: "Deep"},
// 	{name: "Harini"},
// 	{name: "Minty"}
// ]

// var newName = [];

// function myViewModel() {
// 	var self = this;
// 	self.names = ko.observableArray(myName);	
// 	// self.names.push(newName);
// }

// function changeViewModel(nName) {
// 	addName = {
// 		name: nName
// 	};

// 	MyViewModel.names.push(addName);

// }

// var MyViewModel = new myViewModel();

// ko.applyBindings(MyViewModel);