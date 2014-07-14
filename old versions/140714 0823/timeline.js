//Objects for storing data
function composer(link, title, dob, dod, name, dobL, dodL, pob, pod, was, extract, wikitext, clips, images){
	//Used on timeline
	this.link = link;
	this.title = title;
	this.dob = dob;
	this.dod = dod;
	//Disoveded but not used on timeline
	this.wikitext = wikitext;
	this.dobL = dobL;
	this.dodL = dodL;
	this.pob = pob;
	this.pod = pod;
	//Used in infobox
	this.name = name;
	this.was = was;
	this.extract = extract;
	this.clips = [];
	this.images = [];
}
function clip(title, desc, url){
	this.title = title;
	this.desc = desc;
	this.url = url;
}
function image(desc, url){
	this.desc = desc;
	this.url = url;
}

function getExtract(pipeSeparatedListComposers) { //Get basic information
	return $.getJSON(URL, {
		action:"query",
		prop:"extracts",
		exintro:"",
		titles:pipeSeparatedListComposers,
	})
}
function getPage(link) {  //Get details on born & died, get audiofiles
	return $.getJSON(URL, {
		action:"query",
		prop:"revisions",
		rvprop:"content",
		titles:link,
	})
}
function getFileURL(file) { //Get real URLs for audiofiles
	return $.getJSON(URL, {
		action:"query",
		prop:"imageinfo",
		iiprop:"url",
		titles:file,
	})
}
// Get images on page
// http://en.wikipedia.org/w/api.php?format=jsonfm&action=parse&prop=images&page=PAGETITLE
function getImages(link) { // Get images on article-page
	return $.getJSON(URL, {
		action:"parse",
		prop:"images",
		iiprop:"url",
		page:link,
	})
}
// Get URLs and metainfo
//http://en.wikipedia.org/w/api.php?action=query&format=jsonfm&titles=File:FILENAME&prop=imageinfo&iiprop=url|extmetadata
function getFileMetaAndURL(file) { //Get real URLs and descriptions for images
	return $.getJSON(URL, {
		action:"query",
		prop:"imageinfo",
		iiprop:"url\|extmetadata",
		titles:file,
	})
}
	

//Extract dates and places of birth and death
function getBornAndDied(link, content){
	function getInfo(content, searchString){	
		var pos = content.search(searchString);
		if (pos != -1) {
			r = content.substring(pos);
			r = r.substring(r.search('=')+1);
			pos = r.search('\n');
			posPipe = r.search(/\|/);
			if (posPipe != -1) { pos = Math.min(pos, posPipe); }
			r = r.substring(0,pos);
			r = r.replace(/\[/g, '');
			r = r.replace(/\]/g, '');
			return r;
		}
		else { return false; }	
	}
	function shortFromLong(dateString){
		var yearPattern = /\d\d\d\d/;
		var pos = dateString.search(yearPattern);
		var shortDate = dateString.substring(pos, pos+4);
		return shortDate;
	}	
	
	var dobL = getInfo(content, 'DATE OF BIRTH');
	if (dobL) { var dob = shortFromLong(dobL); }
	var pob = getInfo(content, 'PLACE OF BIRTH');
	var dodL = getInfo(content, 'DATE OF DEATH');
	if (dodL) { var dod = shortFromLong(dodL); }
	var pod = getInfo(content, 'PLACE OF DEATH');
	// Add checks for content in vars, if undef try and fill with getExtract + mangling
	/* Might be able to reuse this:
		getExtract(link).done(function(data) {
			pages = data.query.pages;
			pageid = Object.getOwnPropertyNames(pages);
			extract = pages[pageid].extract;	
			var yearPattern = /\d\d\d\d/;
			var pos = extract.search(yearPattern);
			var born = extract.substring(pos, pos+4);
			var stringTemp = extract.substring(pos+4);
			pos = stringTemp.search(yearPattern);
			var died = stringTemp.substring(pos, pos+4); 
	*/
	return {dob:dob, pob:pob, dod:dod, pod:pod, dobL:dobL, dodL:dodL};
}

//Paint image column in infobox
function imageCol(link){
	getImages(link).done(function(data) { 
		images = data.parse.images;
		// Build list of files to get URLs for
		var imgCount = 0;
		var imgList = ""
		for (i in images) {
			var ext = images[i].substr(images[i].search(/\.(?!.*\.)/g)+1).toLocaleLowerCase(); //RE finds final . in string
			//console.log(ext);
			if (ext == 'jpg' || ext == 'jpeg' || ext == 'png') {
				imgList = imgList + "File:" + images[i] + "|"
				imgCount++;
			}
		}
		imgList = imgList.slice(0,-1);
		//console.log(imgList);
		//console.log(imgCount);		
		var imgURL = []
		var imgDesc = []
		getFileMetaAndURL(imgList).done(function(data) {
			for (i = 1; i <= imgCount; i++) {
				if (data.query.pages[-i] == undefined) { break; }
				imgURL.push(data.query.pages[-i].imageinfo[0].url);
				if (data.query.pages[-i].imageinfo[0].extmetadata.ImageDescription == undefined) {
					imgDesc.push('No description.');
				}
				else {
					imgDesc.push(jQuery('<p>' + data.query.pages[-i].imageinfo[0].extmetadata.ImageDescription.value + '</p>').text());
				}
			}
			//console.log(imgURL);
			//console.log(imgDesc);
			for (i in imgURL) {
				var imgContainer = document.createElement('div');
				imgContainer.id = 'imgContainer' + i;
				imgContainer.class = 'imgContainer';
				imgContainer.style = 'width:305px; padding:5px; margin-top:5px; margin-bottom:5px; '
				//imgContainer.appendChild(document.createElement('hr'));
				document.getElementById('imgdiv').appendChild(imgContainer);
					var img = document.createElement('img');
					img.id = 'img' + i;
					img.src = imgURL[i];
					img.width = '305';
				imgContainer.appendChild(img);	
					var desc = document.createElement('div');
					desc.id = 'imgDesc' + i;
					//desc.style = 'width:100%; height:100%; ';
					desc.innerHTML = '<em>'+imgDesc[i]+'</em><br /><br />';
				imgContainer.appendChild(desc);
			} 
		});
	}); // End of getImages
}

// Paint composerbox on timeline
function paintComposerBox(link, title, dob, dod, low, high, expandFactor){
	var bornI = parseInt(dob); var diedI = parseInt(dod); 				
	var translatePx = ((bornI - low)*expandFactor + MARGIN);
	var tlWidth = (high-low)*expandFactor;
	
	var box = document.createElementNS(svgNS, 'svg');
	box.setAttributeNS(null, 'id', link);
	box.setAttributeNS(null, 'class', 'box');
	box.setAttributeNS(null, 'height', '53');
	box.setAttributeNS(null, 'width', tlWidth); 
		
		var linkedRect = document.createElementNS(svgNS, 'a');
		composerlink = title.replace(/ /g, '_');

		linkedRect.setAttributeNS(xlinkNS, 'xlink:href', 'info.html?composer='+link);
		linkedRect.setAttributeNS(null, 'target', 'infoframe'); 
		
			var shape = document.createElementNS(svgNS, 'rect');
			shape.setAttributeNS(null, 'rx', '25');
			shape.setAttributeNS(null, 'ry', '25');
			shape.setAttributeNS(null, 'height', '50');
			shape.setAttributeNS(null, 'style', 'fill:lightblue;stroke:black;stroke-width:0;opacity:1.0');
			//shape.setAttributeNS(null, 'style', 'box-shadow: 10px 10px 5px #888888;');					
			shape.setAttributeNS(null, 'id', link);
			shape.setAttributeNS(null, 'x', translatePx); 
			shape.setAttributeNS(null, 'y', '1');
			var w = (dod - dob) * expandFactor;
			shape.setAttributeNS(null, 'width', w);
			//shape.onClick('alert("Alert!")');
			//$('rect#link).on('click', function(){
			//	alert('alert! alert!');
			//});
		linkedRect.appendChild(shape);
		
			var name = document.createElementNS(svgNS, 'text');
			name.setAttributeNS(null, 'id', link);
			name.setAttributeNS(null, 'class', 'name');
			name.setAttributeNS(null, 'font-size','17');
			name.setAttributeNS(null, 'fill', 'black');
			name.setAttributeNS(null, 'x', translatePx+13);
			name.setAttributeNS(null, 'y', '23');
			name.innerHTML = title;
			// Handle names that don't fit
			var nameTooLong = false;
			if (title=='Wolfgang Amadeus Mozart'||title=='Felix Mendelssohn'||title=='Pyotr Ilyich Tchaikovsky'||title=='Lili Boulanger') { 
				nameTooLong = true; 
			} // Testing
			if (nameTooLong){
				splitTitle = title.split(' ');
				lastName = splitTitle[splitTitle.length-1];
				initialsLastName = '';
				for (n in splitTitle){
					initialsLastName = initialsLastName + splitTitle[n][0];
				}  
				initialsLastName = initialsLastName.substr(0,initialsLastName.length-1);
				initialsLastName = initialsLastName + ' ' + lastName;
				name.innerHTML = lastName;
				name.innerHTML = initialsLastName;
			}
		linkedRect.appendChild(name);
		
			var years = document.createElementNS(svgNS, 'text');
			years.setAttributeNS(null, 'id', link);
			years.setAttributeNS(null, 'class', 'years');
			years.setAttributeNS(null, 'font-size', '13');
			years.setAttributeNS(null, 'fill', 'black');
			years.setAttributeNS(null, 'x', translatePx+15);
			years.setAttributeNS(null, 'y', '42');
			years.innerHTML = dob + ' - ' + dod;
		linkedRect.appendChild(years);
	
	box.appendChild(linkedRect);
	container.appendChild(box);
	container.appendChild(document.createElement('br'));
}

//Read GET, return variables
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0; i<vars.length; i++) {
    var pair = vars[i].split("=");
    try {
		pair[0] = decodeURIComponent(pair[0]);
		pair[1] = decodeURIComponent(pair[1]); 
	}	
	catch(error) {
		console.log(error);
		if (error.message = 'URI malformed') {
			pair[0] = unescape(pair[0]);
			pair[1] = unescape(pair[1]);
		}
	}
	if (pair[0] == variable) {
      return pair[1];
    }
  } 
  return(false);
}


		