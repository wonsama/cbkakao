const readline = require('readline');

let fn = {};

fn.getBLen = (str)=>{
	let count = 0;
	let ch = '';
	for(let i = 0; i < str.length; i++) {
		ch = str.charAt(i);
		if(escape(ch).length == 6) {
			count ++;
		} 
		count ++;           
	}        
	return count;
}

fn.isEmpty = (source)=>{
	if(source&&source.trim()!=''){
		return false;
	}
	return true;
}

fn.isNotEmpty = (source)=>{
	return !fn.isEmpty(source);
}

fn.question = (msg)=>{
  return new Promise((resolve, reject)=>{
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try{
      rl.question(msg, answer=>{
          rl.close();
          resolve(answer);
      });
    }catch(e){
      reject(e);
    }
  });
}

fn.uniqBy = (a, key) =>{
  let seen = new Set();
  return a.filter(item => {
      let k = key(item);
      return seen.has(k) ? false : seen.add(k);
  });
}

/*
* sleep
* @param ms time to sleep
*/
fn.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
* input source change to number
* @param source input string
* @return number
*/
fn.getNumber = (source) =>{  
  if(!source || isNaN(source)){
    return null;
  }
  return Number(source);
}

/*
* check input value is true
* @param source text value
* @return is true ?
*/
fn.toBoolean = (source) =>{
	try{
		return JSON.parse(source.toLowerCase())===true;
	}catch(e){
		return false;
	}
}

/*
* return random integer value
* if end value is empty then run with 1 to start
* @param start start int value
* @param end end int value (optional)
* @return random value 
*/
fn.rndInt = (start, end) => {	
	if(start==end){
		start = 1;
	}
	if(!end){
		return Math.ceil(Math.random() * start);
	}else{
		let gap = end - start;
		return Math.round(Math.random() * gap + start);
	}	
}

/*
* await error handler
* @param promise promise object
* @return results [err, data]
*/
fn.to = (promise) =>{
  return promise
  .then(data=>[null,data])
  .catch(err=>[err]);
}

fn.csvToArray = (strData, strDelimiter )=>{

	// see : https://gist.github.com/thcreate/5672000

  // Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			(strMatchedDelimiter != strDelimiter)
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}


		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			var strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}

module.exports = fn;