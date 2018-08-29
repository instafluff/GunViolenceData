var express = require('express');
var fs = require('fs');
var request = require('request');
var unfluff = require('unfluff');
var csv = require("fast-csv");
var router = express.Router();

var statePopulation = {
"Alabama": 4863300,
"Alaska": 741894,
"American Samoa": 54343,
"Arizona": 6931071,
"Arkansas": 2988248,
"California": 39250017,
"Colorado": 5540545,
"Connecticut": 3576452,
"Delaware": 952065,
"District of Columbia": 681170,
"Florida": 20612439,
"Georgia": 10310371,
"Guam": 161785,
"Hawaii": 1428557,
"Idaho": 1683140,
"Illinois": 12801539,
"Indiana": 6633053,
"Iowa": 3134693,
"Johnston Atoll": 40,
"Kansas": 2907289,
"Kentucky": 4436974,
"Louisiana": 4681666,
"Maine": 1331479,
"Maryland": 6016447,
"Massachusetts": 6811779,
"Michigan": 9928300,
"Midway Atoll": 75,
"Minnesota": 5519952,
"Mississippi": 2988726,
"Missouri": 6093000,
"Montana": 1042520,
"Nebraska": 1907116,
"Nevada": 2940058,
"New Hampshire": 1334795,
"New Jersey": 8944469,
"New Mexico": 2081015,
"New York": 19745289,
"North Carolina": 10146788,
"North Dakota": 757952,
"Northern Mariana Islands": 52344,
"Ohio": 11614373,
"Oklahoma": 3923561,
"Oregon": 4093465,
"Palmyra Atoll": 20,
"Pennsylvania": 12784227,
"Puerto Rico": 3411307,
"Rhode Island": 1056426,
"South Carolina": 4961119,
"South Dakota": 865454,
"Tennessee": 6651194,
"Texas": 27862596,
"U.S. Virgin Islands": 103574,
"Utah": 3051217,
"Vermont": 624594,
"Virginia": 8411808,
"Wake Island": 188,
"Washington": 7288000,
"West Virginia": 1831102,
"Wisconsin": 5778708,
"Wyoming": 585501,
};

/* GET home page. */
router.get('/', function(req, res, next) {
	let allData = [];
	csv.fromPath("2016.csv", {headers: true})
 .on("data", function(data){
     // console.log(data);
		 allData.push(data);
 })
 .on("end", function(){
     console.log("done");

		 var now = new Date();
		var start = new Date(now.getFullYear(), 0, 0);
		var diff = now - start;
		var oneDay = 1000 * 60 * 60 * 24;
		var dayOfYear = 365;// Math.floor(diff / oneDay); // Use 365th day for calculating other years than current

		 let totalDied = 0, totalHurt = 0;
		 let stateIncidents = {};
		 let statesSortedByIncident = [], statesSortedByIncidentOverPopulation = [];
		 let dailyIncidents = {}, monthlyIncidents = {};
		 let daysSortedByIncident = [], monthsSortedByIncident = [];
		 let dailyIncidentTotal = 0;
		 allData.forEach( stat => {
			 totalDied += parseInt(stat[ "# Killed" ]);
			 totalHurt += parseInt(stat[ "# Injured" ]);
			 stateIncidents[ stat[ "State" ] ] = ( stateIncidents[ stat[ "State" ] ] || 0 )
			 	+ 1;
				dailyIncidents[ stat[ "Incident Date" ] ] = ( dailyIncidents[ stat[ "Incident Date" ] ] || 0 )
 			 	+ 1;
				let month = stat[ "Incident Date" ].split(" ")[ 0 ];
				monthlyIncidents[ month ] = ( monthlyIncidents[ month ] || 0 ) + 1;
		 });
		 for( var state in stateIncidents ) {
			 statesSortedByIncident.push( { state, "numIncidents" : stateIncidents[ state ] } );
			 statesSortedByIncidentOverPopulation.push( { state, "incidentsPerPerson" : stateIncidents[ state ] / statePopulation[ state ] } );
		 }
		 statesSortedByIncident.sort( (a, b) => { return b[ "numIncidents" ] - a[ "numIncidents" ]  } );
		 statesSortedByIncidentOverPopulation.sort( (a, b) => { return b[ "incidentsPerPerson" ] - a[ "incidentsPerPerson" ]  } );
		 for( var day in dailyIncidents ) {
			 daysSortedByIncident.push( { day, "numIncidents": dailyIncidents[ day ] } );
			 dailyIncidentTotal += dailyIncidents[ day ];
		 }
		 daysSortedByIncident.sort( (a, b) => { return b[ "numIncidents" ] - a[ "numIncidents" ] } );
		 for( var month in monthlyIncidents ) {
			 monthsSortedByIncident.push ( { month, "numIncidents": monthlyIncidents[ month ] } );
		 }
		 monthsSortedByIncident.sort( (a, b) => { return b[ "numIncidents" ] - a[ "numIncidents" ] } );

		 res.render("index", { title: "Gun Violence Data Analysis",
		 data: {
			 totalDied,
			 totalHurt,
			 statesSortedByIncident,
			 statesSortedByIncidentOverPopulation,
			 incidentsPerDay: dailyIncidentTotal / dayOfYear,
			 monthsSortedByIncident
		 }
	 });
		 // res.send(allData);
 });

	// calculateSentiment( url, ( text, score ) => {
	// 	res.render('index', { title: 'SENTIENT SENTIMENT CALCULATOR FROM THE MATRIX', text: text, score: score.toFixed(2) });
	// })
});

function calculateSentiment( url, callback ) {
	fs.readFile( "AFINN-111.txt", (err, data) => {
		let words = data.toString().split('\n');
		let wordsWithFriends = {};
		for( var i = 0, len = words.length; i < len; i++ ) {
			let parts = words[ i ].split('\t');
			wordsWithFriends[ parts[ 0 ] ] = parseInt( parts[ 1 ] );
		}

		request.get( url, ( e, r, body ) => {
			var content = unfluff(body);
			var allTheWords = content["text"].split(' ');
			let totalScore = 0, totalCount = 0;
			for( var i = 0, len = allTheWords.length; i < len; i++ ) {
				var currentWord = allTheWords[ i ];
				if( wordsWithFriends[ currentWord ] ) {
					totalScore += wordsWithFriends[ currentWord ];
					totalCount++;
				}
			}
			callback( content["text"], ( totalScore / totalCount + 5 ) / 10 );
		});
	});
}

module.exports = router;
