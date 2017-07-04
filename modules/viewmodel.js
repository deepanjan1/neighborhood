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
				coffeeName = {
					name: result.response.venues[i].name
				};
				foursquareData.push(coffeeName);
			}
			ViewModel.selectedSpots(foursquareData);
	});
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