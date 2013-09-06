  
var geocoder;
var person;
var location;
var hordes;
var map;
var directionDisplay;
var directionsService;
var stepDisplay;

var markersArray = [];
var position;
var marker = null;
var polyline = null;
var poly2 = null;
var speed = 0.000005
var wait = 0;

var myPano;   
var panoClient;
var nextPanoId;
var timerHandle = null;
var steps = []
var bounds;

var autoLocations = [
	'lodging',
	'park',
	'parking',
	'doctor',
	'gas_station',
	'police',
	'food'
];
       
var infowindow =  new google.maps.InfoWindow({
    content: ''
});

//plot initial point using geocode instead of coordinates (works just fine)
function initialize() {
	
    geocoder = new google.maps.Geocoder();
    bounds = new google.maps.LatLngBounds ();
	
	// Instantiate a directions service.
	directionsService = new google.maps.DirectionsService();
	
	// Set Lat Long via Database Vaules
	var Latitude = 52.584240;
	var Longitude = 1.696565;
	var address = '53, el alamein way, bradwell, NR31 8SX';
	
	var myLatlng = new google.maps.LatLng(Latitude, Longitude);
	
    var myOptions = {
        zoom: 18, 
		center: myLatlng,
		minZoom: 18,
		maxZoom: 18,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
		draggable: false,
		//disableDefaultUI: true
    };
	
    map = new google.maps.Map(document.getElementById("gmaps-container"), myOptions);

//    geocoder.geocode( {'latLng': myLatlng}, function(results, status) {
    geocoder.geocode( { 'address': address }, function(results, status) { // Preferably needs to be LAT / LONG not Address
		
        if (status == google.maps.GeocoderStatus.OK) {
			
//			person = new google.maps.MarkerImage('map.png',
//				// size of marker
//				new google.maps.Size(16, 32),
//				// store location is at pin
//				new google.maps.Point(0, 0),
//				// info window anchor
//				new google.maps.Point(0, 0)
//			);
			
            map.setCenter(results[0].geometry.location);
			
			var PlayerLocation = results[0].geometry.location;
			
			//Player Icon
			playermarker = new google.maps.Marker({
				position: PlayerLocation,
				map: map,
				icon: 'person.png' // Temp for development
			});
			 
			// Place Auto Markers
			for (var i = 0; i < autoLocations.length; i++) {
				plotAutoMarkers( PlayerLocation, autoLocations[i] );
			}

            bounds.extend( PlayerLocation );

            markersArray.push( playermarker );
			
			// Clicking on the map for movement and 
			google.maps.event.addListener(map, 'click', function(event) {
				
				var pos = playermarker.getPosition();
				var goto = event.latLng;
				/*
				 * -- Position --
				 * pos.jb
				 * pos.kb
				 * 
				 * -- Goto --
				 * goto.jb
				 * goto.kb
				 */
				document.getElementById('start').value = pos.jb + ', ' + pos.kb;
				document.getElementById('end').value = goto.jb + ', ' + goto.kb;
				
				//openAction();
				
				// Create a renderer for directions and bind it to the map.
				var DirectionsRendererOptions = {
					map: map,
//					PolylineOptions: {
//						visible: false
//					}
				};
				directionsDisplay = new google.maps.DirectionsRenderer( DirectionsRendererOptions );
				//PolylineOptions = new google.maps.PolylineOptions( {strokeOpacity: 0.0} );

				polyline = new google.maps.Polyline({
					path: [],
					//strokeColor: '#FF0000',
					//strokeWeight: 3
				});
				poly2 = new google.maps.Polyline({
					path: [],

				});
				
			});

        }
        else{
            alert("Geocode was not successful for the following reason: " + status);
        }
		
    });
	
	// Plot Set locations
    plotMarkers();
	
	// Place Hordes on map
	plotHords();

}

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

function calculateDistances() {
  var service = new google.maps.DistanceMatrixService();
  var start = document.getElementById("start").value;
  var end = document.getElementById("end").value;
  var origin = new google.maps.LatLng(start);
  var destination = new google.maps.LatLng(end);
  
//  console.log( origin );
//  console.log( destination );
  
  service.getDistanceMatrix(
    {
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.BICYCLING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      avoidHighways: false,
      avoidTolls: false
    }, callback);
}
// The calculate
function callback(response, status) {
	
	console.log( 'hello' );
	console.log( response );
	
  if (status != google.maps.DistanceMatrixStatus.OK) {
    alert('Error was: ' + status);
  } else {

    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
//    var outputDiv = document.getElementById('outputDiv');
	
//    outputDiv.innerHTML = '';

    for (var i = 0; i < origins.length; i++) {
		
      var results = response.rows[i].elements;

//      addMarker(origins[i], false);
      for (var j = 0; j < results.length; j++) {

//        addMarker(destinations[j], true);
        outputDiv.innerHTML += origins[i] + ' to ' + destinations[j]
            + ': ' + results[j].distance.text + ' in '
            + results[j].duration.text + '<br>';
	
		console.log( 'hello' );
	
      }
	  
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

function plotAutoMarkers( myLatlng, locType ){
	var request = {
		location: myLatlng,
		radius: 500,
		types:[locType]
	};

	var service = new google.maps.places.PlacesService(map);
	service.nearbySearch(request, callback);
}

var infowindow = new google.maps.InfoWindow();

function callback(results, status) {
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i],autoLocations[i]);
		}
	}
}

function createMarker( place, locType ) {

	var placeLoc = place.geometry.location;

	var markers = new google.maps.Marker({
		map: map,
		position: placeLoc,
		icon: locType + '.png'
	});

	google.maps.event.addListener(markers, 'click', function() {
		infowindow.setContent(place.name);
		infowindow.open(map, this);
	});
}

function calcRoute(){
	
	calculateDistances();

	if (timerHandle) { clearTimeout(timerHandle); }
	
	if (playermarker) { playermarker.setMap(null);}
	
	polyline.setMap(null);
	poly2.setMap(null);
	directionsDisplay.setMap(null);
	
	polyline = new google.maps.Polyline({
		path: [],
		strokeColor: '#FF0000',
		strokeWeight: 1,
		strokeOpacity: 0.0,
		visible:false
	});
	
	poly2 = new google.maps.Polyline({
		path: [],
		strokeColor: '#00ff00',
		strokeWeight: 1,
		strokeOpacity: 0
	});
	
	// Create a renderer for directions and bind it to the map.
//	directionsDisplay = new google.maps.DirectionsRequest({map: map});
	directionsDisplay = new google.maps.DirectionsRenderer({map: map});

	var start = document.getElementById("start").value;
	var end = document.getElementById("end").value;
	var travelMode = google.maps.DirectionsTravelMode.BICYCLING;

	var request = {
		origin: start,
		destination: end,
		travelMode: travelMode
	};

	// Route the directions and pass the response to a
	// function to create markers for each step.
	directionsService.route(request, function(response, status) {
	  if (status == google.maps.DirectionsStatus.OK){
		  
		directionsDisplay.setDirections(response);
//		console.log(response);
			  var bounds = new google.maps.LatLngBounds();
			  var route = response.routes[0];
			  startLocation = new Object();
			  endLocation = new Object();

		  // For each route, display summary information.
		  var path = response.routes[0].overview_path;
		  var legs = response.routes[0].legs;

			  for (i=0;i<legs.length;i++) {

				if (i == 0) {

				  startLocation.latlng = legs[i].start_location;
				  startLocation.address = legs[i].start_address;

				  playermarker = new google.maps.Marker({
					  position: startLocation.latlng,
					  map: map,
					  icon: 'person.png' // Temp for development
				   });

				}

				endLocation.latlng = legs[i].end_location;
				endLocation.address = legs[i].end_address;

				var steps = legs[i].steps;

				for (j=0;j<steps.length;j++) {

				  var nextSegment = steps[j].path;
				  
				  for (k=0;k<nextSegment.length;k++) {
					polyline.getPath().push(nextSegment[k]);
					bounds.extend(nextSegment[k]);
				  }
				}
			  }
			  
			  //polyline.setMap( map );
			  
			  map.fitBounds(bounds);

			//map.setZoom(18);

		  startAnimation();
	  }                                                    
   });
}
  

  
var step = 5; // 5; // metres
var tick = 100; // milliseconds
var eol;
var k=0;
var stepnum=0;
var speed = "";
var lastVertex = 1;

//========================================================================================
//============================== animation functions =====================================
//========================================================================================

function updatePoly(d) {
  // Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
  if (poly2.getPath().getLength() > 20) {
	poly2=new google.maps.Polyline([polyline.getPath().getAt(lastVertex-1)]);
	// map.addOverlay(poly2)
  }

  if (polyline.GetIndexAtDistance(d) < lastVertex+2) {
	 if (poly2.getPath().getLength()>1) {
	   poly2.getPath().removeAt(poly2.getPath().getLength()-1)
	 }
	 poly2.getPath().insertAt(poly2.getPath().getLength(),polyline.GetPointAtDistance(d));
  } else {
	poly2.getPath().insertAt(poly2.getPath().getLength(),endLocation.latlng);
  }
}

//========================================================================================

function animate(d) {
	// alert("animate("+d+")");
	
	if (d>eol) {
	  map.panTo( endLocation.latlng );
	  playermarker.setPosition( endLocation.latlng );
	  return;
	}
	
	var p = polyline.GetPointAtDistance(d);
		map.panTo(p);
		playermarker.setPosition(p);
		//updatePoly(d);
		timerHandle = setTimeout("animate("+(d+step)+")", tick);
}

//========================================================================================

function startAnimation() {
	eol = polyline.Distance();
	map.setCenter(polyline.getPath().getAt(0));
	poly2 = new google.maps.Polyline({path: [polyline.getPath().getAt(0)],strokeOpacity: 0.0,});
	
	setTimeout("animate(5)",2000);  // Allow time for the initial map display
}
//========================================================================================
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var locationsArray = [
//		['Playing Fields', 'The Playing Fields, Mill Lane, Great Yarmouth NR31 8HS', 'location-23'],
		['Bradwell Fuel Station', 'Blackbird Close, Great Yarmouth, Norfolk NR31 8RU', 'location-34']
	];
var hordeArray = [
		['Small Horde', '54 Blackbird Close, Bradwell, Great Yarmouth, Norfolk NR31 8RU, UK', 'horde-56'],
		['Large Horde', 'Blackbird Close, Bradwell, Great Yarmouth, Norfolk NR31 8RT, UK', 'horde-12'],
		['Small Horde', '141 El Alamein Way, Bradwell, Great Yarmouth, Norfolk NR31 8SX, UK', 'horde-78'],
		['Large Horde', '3 El Alamein Way, Bradwell, Great Yarmouth, Norfolk NR31 8SX, UK', 'horde-92']
	];

function plotMarkers(){
    var i;
    for(i = 0; i < locationsArray.length; i++){
        codeAddresses(locationsArray[i]);
    }
}
function plotHords(){
    var i;
    for(i = 0; i < hordeArray.length; i++){
        codeHordeMovment(hordeArray[i]);
    }
}

function codeAddresses(address){
	
    geocoder.geocode( { 'address': address[1]}, function(results, status) { 
        if (status == google.maps.GeocoderStatus.OK) {
			
            marker = new google.maps.Marker({
                map: map,
				icon: 'location.png',
                position: results[0].geometry.location
            });
			
			marker.set("id", address[2]);

            google.maps.event.addListener(marker, 'click', function() {
//                infowindow.setContent(address[0]);
//                infowindow.open(map, this);

				openScreen( address[2] );
            });

            bounds.extend(results[0].geometry.location);

            markersArray.push(marker); 
        }
        else{
            alert("Geocode was not successful for the following reason: " + status);
        }

        map.fitBounds(bounds);
    });
}

function codeHordeMovment(address){
	
    geocoder.geocode( { 'address': address[1]}, function(results, status) { 
        if (status == google.maps.GeocoderStatus.OK) {
			
            marker = new google.maps.Marker({
                map: map,
				icon: 'horde.png',
                position: results[0].geometry.location
            });
			
			marker.set("id", address[2]);

            google.maps.event.addListener(marker, 'click', function() {
//                infowindow.setContent(address[0]);
//                infowindow.open(map, this);
				
				openScreen( address[2] );
				
            });

            bounds.extend(results[0].geometry.location);

            markersArray.push(marker); 
        }
        else{
            alert("Geocode was not successful for the following reason: " + status);
        }

        map.fitBounds(bounds);
    });
}

google.maps.event.addDomListener(window, 'load', initialize);


  //]]>
  function openScreen( theid ){
  
//	alert( 'Open Dialog and information box for ID: ' + theid );
//	console.log( theid );
	
	$('#dialog-box').fadeIn().html( theid );

  }
  function openAction( e ){
	  
	//$('#action-box').fadeIn();
	$('#action-box').fadeIn().css(({ left:  e.pageX, top: e.pageY }));
	
  }
  
  
  $(document).ready(function(){
	  
	  $('#gmaps-container').click( openAction );
	  
	$('.move').click(function(){
		//move to selected location
		$('#action-box').fadeOut('slow',function(){
			calcRoute();
		});
		
	});
	
	$('.look').click(function(){
		//move to then look for supplies
	});
	
	$('.cancel').click(function(){
		//close box do nothing
		$('#action-box').fadeOut();
	});
	
});