// Global constants
var URL = "http://en.wikipedia.org/w/api.php?format=json&callback=?"
var MARGIN = 3;
var CURRENTYEAR = new Date().getFullYear();
var svgNS = "http://www.w3.org/2000/svg";  
var xlinkNS = "http://www.w3.org/1999/xlink";
var RIGHTMARGIN = 39; //Avoid horiz scrollbar when vertical scrollbar appears. Chrome:39  Firefox:33

//Global variables
var cc = {};	//composer cache
var scale = 1;

//Objects for storing data
function composer(link, title, dob, dod, name, dobL, dodL, pob, pod, was, extract, wikitext, clips, images){
	//Used on timeline
	this.link = link;
	this.title = title;
	this.dob = dob;
	this.dod = dod;
	//Discovered but not used on timeline
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
// Get categories on page
// http://en.wikipedia.org/w/api.php?format=jsonfm&action=parse&prop=categories&page=PAGETITLE
function getCats(link) { // Get categories on article-page
	return $.getJSON(URL, {
		action:"parse",
		prop:"categories",
		page:link,
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
	var dodL = getInfo(content, 'DATE OF DEATH');
	if (dodL) { var dod = shortFromLong(dodL); }
	var pob = getInfo(content, 'PLACE OF BIRTH');
	var pod = getInfo(content, 'PLACE OF DEATH');
	
	// Add checks for content in vars, if undef try and fill with getExtract + mangling
	if (dob && dod) {
		return {dob:dob, pob:pob, dod:dod, pod:pod, dobL:dobL, dodL:dodL};
	}
	else {
		if (content.search(/\[\[Category:Living people\]\]/) != -1) {
			dod = -1;
		}
	return {dob:dob, pob:pob, dod:dod, pod:pod, dobL:dobL, dodL:dodL};
	}
}

//Paint info coloum in infobox
function infoCol(link){
	/*var c = link;
	console.log('cc[' + c + ']: ' + cc[c]);
	if (cc[c]) {
		//if (cc[c].link || cc[c].title || cc[c].dob || cc[c].dod) {
		//	paintComposerBox(cc[c].link, cc[c].title, cc[c].dob, cc[c].dod, low, high, expandFactor);
		//	//console.log('Painted cbox from memory: ' + c );
		//	continue;
		//}
		console.log("Yay, hittade cc!");
	}*/
	
	getExtract(link).done(function(data) { //Get basic information ASYNC
		pages = data.query.pages;
		pageid = Object.getOwnPropertyNames(pages);
		extract = pages[pageid].extract;
		fullName = extract.substring(3,extract.indexOf("</b>"));
		//fullName = extract.substring(3,extract.indexOf(/\<\/b\>/i));  // For case insensitive: <b> and <B>. Can't get it to work.
		
		var indicies = [];
		wasIndex = extract.indexOf("was a "); if (wasIndex != -1) {indicies.push(wasIndex)};
		wasIndex = extract.indexOf("was an "); if (wasIndex != -1) {indicies.push(wasIndex)}; 
		wasIndex = extract.indexOf("is a "); if (wasIndex != -1) {indicies.push(wasIndex)};
		wasIndex = extract.indexOf("is an "); if (wasIndex != -1) {indicies.push(wasIndex)};
		sorted = indicies.sort(function(a, b){return a-b});
		wasIndex = sorted[0];
		
		was = extract.substring(wasIndex + 5);
		firstSentenceEnd = was.indexOf('.')+1;
		var summaryText = was.substring(firstSentenceEnd);
		was = was.substring(0,firstSentenceEnd);
		was = was.charAt(1).toLocaleUpperCase() + was.slice(2);
		
		var yearPattern = /\d\d\d\d/;
		var pos = extract.search(yearPattern);
		var born = extract.substring(pos, pos+4);
		var stringTemp = extract.substring(pos+4);
		pos = stringTemp.search(yearPattern);
		var died = stringTemp.substring(pos, pos+4); 
		var namelink = '<a href="https://en.wikipedia.org/wiki/' + link + '" target="_blank">' + fullName + '</a>';
		/**	var deletelink = '<span style="color:red;" onclick="deleteComposer(\''+link+'\')">&nbsp;&nbsp;&nbsp;Remove</span>' */
		document.getElementById('infoname').innerHTML = namelink;//  + deletelink;			
		document.getElementById('infowas').innerHTML = was;		
		document.getElementById('summary').innerHTML = summaryText;				

		
    });
	getPage(link).done(function(data) { //Get details on born & died, get audiofiles ASYNC
		pages = data.query.pages;
		pageid = Object.getOwnPropertyNames(pages);
    	rv = pages[pageid].revisions[0];
		content = rv["*"];
		
		var bornAndDied = getBornAndDied(link, content);
		var dob = bornAndDied.dob;
		var pob = bornAndDied.pob;
		var dod = bornAndDied.dod;
		var pod = bornAndDied.pod;
		var dobL = bornAndDied.dobL;
		var dodL = bornAndDied.dodL;
		if (dod == -1) { dod = false; }
		if (dob != false && pob != false) {
			document.getElementById('borntext').innerHTML = '&nbsp;' + dobL + ' <em>in</em> ' + pob; 
		}
		else if (dob != false) { 
			document.getElementById('borntext').innerHTML = '&nbsp;' + dobL; 
		}
		if (dod != false && pod != false) {
			document.getElementById('diedtext').innerHTML = '&nbsp;' + dodL + ' <em>in</em> ' + pod; 
		}
		else if (dod != false) { 
			document.getElementById('diedtext').innerHTML = '&nbsp;' + dodL; 
		}
		else { //Falltrough, there is no information on death, remove infodied-div
			$('#infodied').empty();
		}
		//bornImage = document.createElement('img');
		//bornImage.src('birth-symbol.png');
		//bornImage.width('20'); bornImage.height('20');
		//document.getElementById('bornimg').appendChild(bornImage);	
	});
}	

//Paint audio column in infobox
function audioCol(link){
	function failImage() {	// load no music-image
		var img = document.createElement('img');
		img.id = 'nomusic';
		img.src = 'nomusic.png';
		img.width = '320';
		document.getElementById('musicdiv').appendChild(document.createElement('br'));
		document.getElementById('musicdiv').appendChild(document.createElement('br'));
		document.getElementById('musicdiv').appendChild(img);
	}

	getPage(link).done(function(data) { //Get details on born & died, get audiofiles ASYNC
		pages = data.query.pages;
		pageid = Object.getOwnPropertyNames(pages);
    	rv = pages[pageid].revisions[0];
		content = rv["*"];

		var search = '{{listen';
		listenP = getIndicesOf(search, content, false);
		var search = '{{multi-listen item';
		multilistenP = getIndicesOf(search, content, false);
		
		
		if (listenP.length == 0 && multilistenP.length == 0) { failImage(); }
		else {
			var clipFile = []
			var clipDesc = []
			var clipTitle = []
		}
		if (listenP.length != 0){
			for (pos in listenP){
				var stringTemp = content.substring(listenP[pos]+8);
				end = stringTemp.search("}}");
				var listen = stringTemp.substring(0,end);
				listen = listen.replace(/\[[\w\séÉ]*\|/g, '');
				//listen = listen.replace(/\[.*\|/g, '');
				listen = listen.replace(/\[/g, '');
				listen = listen.replace(/\]/g, '');
				var L = listen.split("|");			
				for (s in L) {
					if (/filename/i.test(L[s])) {
						pos = L[s].search("=");
						L[s] = L[s].substring(pos+1).trim();
						clipFile.push(L[s]);
					}
					if (/description/i.test(L[s])) {
						pos = L[s].search("=");
						L[s] = L[s].substring(pos+1).trim();
						clipDesc.push(L[s]);
					}
					if (/title/i.test(L[s])) {
						pos = L[s].search("=");
						L[s] = L[s].substring(pos+1).trim();
						clipTitle.push(L[s]);
					}	
				}
			}
		}
		if (multilistenP.length != 0){
			for (pos in multilistenP){
				var stringTemp = content.substring(multilistenP[pos]+19);
				//console.log(liste
				end = stringTemp.search("}}");
				var listen = stringTemp.substring(0,end);
				listen = listen.replace(/\[[\w\séÉ]*\|/g, '');
				//listen = listen.replace(/\[.*\|/g, '');
				listen = listen.replace(/\[/g, '');
				listen = listen.replace(/\]/g, '');
				var L = listen.split("|");			
				for (s in L) {
					if (/filename/i.test(L[s])) {
						pos = L[s].search("=");
						L[s] = L[s].substring(pos+1).trim();
						clipFile.push(L[s]);
					}
					if (/description/i.test(L[s])) {
						pos = L[s].search("=");
						L[s] = L[s].substring(pos+1).trim();
						clipDesc.push(L[s]);
					}
					if (/title/i.test(L[s])) {
						pos = L[s].search("=");
						L[s] = L[s].substring(pos+1).trim();
						clipTitle.push(L[s]);
					}	
				}
			}
		}
		if (clipFile != undefined){
			// Build list of files to get URLs for
			var fileCount = 0;
			var fileList = ""
			for (f in clipFile) {
				fileList = fileList + "File:" + clipFile[f] + "|"
				fileCount++;
			}
			fileList = fileList.slice(0,-1);
			
			var clipFileURL = []
			getFileURL(fileList).done(function(data) {
				pages = data.query.pages;
				for (prop in pages) {		
					if (!pages.hasOwnProperty(prop)) { continue;}
					clipFileURL.push(pages[prop].imageinfo[0].url);
				}
				for (i in clipFileURL) {
					var clip = document.createElement('div');
					document.getElementById('musicdiv').appendChild(clip);
					clip.id = 'clip' + i;
					clip.class = 'clip';
					clip.style = 'width:290px; padding:5px; margin-top:5px; margin-bottom:5px; border:3px outset lightblue; border-radius:15px;'
					//clip.appendChild(document.createElement('hr'));
						
						var player = document.createElement('div');
						player.id = 'player' + i;
						//player.style = "width:100%; height:100%";	
							var audio = document.createElement('audio')
							audio.id = 'audio' + i;
							audio.controls = "true";
							audio.preload = "none";
							audio.style = "width:289px";		
								var source = document.createElement('source');
								source.type = 'audio/ogg';
								source.src = clipFileURL[i];
							audio.appendChild(source);
						player.appendChild(audio);	
					clip.appendChild(player);
						
						var title = document.createElement('div');
						title.id = 'title' + i;
						//title.style = "width:100%; height:100%";
						title.innerHTML = clipTitle[i];
					clip.appendChild(title);
						
						var desc = document.createElement('div');
						desc.id = 'desc' + i;
						//desc.style = 'width:100%; height:100%; ';
						desc.innerHTML = '&nbsp;<em>'+clipDesc[i]+'</em>';
					clip.appendChild(desc);
				}
			});
		}	
	});
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
	var living = false;
	if (dod == -1) {
		dod = CURRENTYEAR;
		living = true;
	}
	
	function rightRoundedRect(x, y, width, height, radius) {
		return "M" + x + "," + y
		   + "h" + (width - radius)
		   + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
		   + "v" + (height - 2 * radius)
		   + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
		   + "h" + (radius - width)
		   + "z";
	}
	
	if (!(dob)) { alert('No date of birth; failed adding: ' + link); }
	else if (!(dod)) { alert('No date of death; failed adding: ' + link); }
	else if (!(link)) { alert('No link; failed adding: ' + link); }
	else if (!(title)) { alert('No title; failed adding: ' + link); }
	else {
		
		var bornI = parseInt(dob); var diedI = parseInt(dod); 				
		var translatePx = ((bornI - low)*expandFactor + MARGIN);
		var tlWidth = (high-low)*expandFactor - RIGHTMARGIN;
		
		var box = document.createElementNS(svgNS, 'svg');
		box.setAttributeNS(null, 'id', link);
		box.setAttributeNS(null, 'class', 'box');
		box.setAttributeNS(null, 'height', '53');
		box.setAttributeNS(null, 'width', tlWidth); 
			
			var linkedRect = document.createElementNS(svgNS, 'a');
			composerlink = title.replace(/ /g, '_');

			linkedRect.setAttributeNS(xlinkNS, 'xlink:href', 'info.html?composer='+link);
			linkedRect.setAttributeNS(null, 'target', 'infoframe'); 

				var w = (dod - dob) * expandFactor;	
				// Special for living persons 
				if (living) { 
					var shape = document.createElementNS(svgNS, 'rect');
					shape.setAttributeNS(null, 'x', translatePx); 
					shape.setAttributeNS(null, 'y', '0');
					shape.setAttributeNS(null, 'height', '50');
					shape.setAttributeNS(null, 'width', w+25); //hides rounding on right side
					shape.setAttributeNS(null, 'rx', '25');
					shape.setAttributeNS(null, 'ry', '25'); 
				}
				else { // for not living persons
					var shape = document.createElementNS(svgNS, 'rect');
					shape.setAttributeNS(null, 'x', translatePx); 
					shape.setAttributeNS(null, 'y', '0');
					shape.setAttributeNS(null, 'rx', '25');
					shape.setAttributeNS(null, 'ry', '25'); 
					shape.setAttributeNS(null, 'height', '50');
					shape.setAttributeNS(null, 'width', w);
				}		
				shape.setAttributeNS(null, 'style', 'fill:lightblue;stroke:black;stroke-width:0;opacity:1.0');
				//shape.setAttributeNS(null, 'style', 'box-shadow: 10px 10px 5px #888888;');					
				shape.setAttributeNS(null, 'id', link);
				//shape.onClick('alert("Alert!")');
				//$('rect#link).on('click', function(){
				//	alert('alert! alert!');
				//});
			linkedRect.appendChild(shape);
			
				var name = document.createElementNS(svgNS, 'text');
				name.setAttributeNS(null, 'id', link);
				name.setAttributeNS(null, 'class', 'name');
				name.setAttributeNS(null, 'font-size','17');
				name.setAttributeNS(null, 'font-weight','bold');
				name.setAttributeNS(null, 'font-family','Segoe UI');
				name.setAttributeNS(null, 'fill', 'black');
				name.setAttributeNS(null, 'x', translatePx+13);
				name.setAttributeNS(null, 'y', '22');
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
				name.setAttributeNS(null, 'font-family','Segoe UI Light');
				years.setAttributeNS(null, 'x', translatePx+20);
				years.setAttributeNS(null, 'y', '40');
				if (living) {
					years.innerHTML = 'Born ' + dob;
				}
				else { years.innerHTML = dob + ' - ' + dod; }
				
			linkedRect.appendChild(years);
		
		box.appendChild(linkedRect);
		container.appendChild(box);
	}
}

// Paint axis of time with periods
function timeAxis(low, high, expandFactor){
	function period(name, start, end, color){
		this.name = name;
		this.start = start;
		this.end = end;
		this.color = color;
	}
	
	var periods =  [new period('Medieval', 1000, 1400, 'orange'), new period('Renaissance', 1400, 1600, 'yellow'),
					new period('Baroque', 1600, 1745,'brown'), new period('Classical', 1745, 1820, 'gray'),
					new period('Romantic', 1820, 1900, 'red'),	new period('Modern', 1900, 1930, 'pink'),
					new period('Contemporary', 1975, CURRENTYEAR, 'khaki')];
	
	tlWidth = (high-low)*expandFactor - RIGHTMARGIN;
	var tl = document.createElementNS(svgNS, 'svg');
	tl.setAttributeNS(null, 'height', '25');
	tl.setAttributeNS(null, 'width', tlWidth+MARGIN*2);
	document.getElementById('container').style = 'width:' + tlWidth + 'px;';
	
	for (i in periods){
			var pp = document.createElementNS(svgNS, 'rect');// pp: Paint Period
			var translatePx = ((periods[i].start - low) * expandFactor + MARGIN);
			var w = (periods[i].end - periods[i].start) * expandFactor;
			pp.setAttributeNS(null, 'height', '17');
			pp.setAttributeNS(null, 'style', 'fill:'+periods[i].color+';stroke:black;stroke-width:0;opacity:1.0');
			pp.setAttributeNS(null, 'id', 'period' + [i]);
			pp.setAttributeNS(null, 'x', translatePx + MARGIN); 
			//pp.setAttributeNS(null, 'y', '28');
			pp.setAttributeNS(null, 'y', '5');
			pp.setAttributeNS(null, 'width', w);
		tl.appendChild(pp);
			var ppT = document.createElementNS(svgNS, 'text');
			ppT.setAttributeNS(null, 'class', 'legend');
			ppT.setAttributeNS(null, 'font-size', '14'); 
			ppT.setAttributeNS(null, 'fill', 'black');
			ppT.setAttributeNS(null, 'y', '18');
			if (periods[i].start < low){
				ppT.setAttributeNS(null, 'x',  + MARGIN);
				ppT.innerHTML = '&#8666; ' + periods[i].name;
			}
			else {
				ppT.setAttributeNS(null, 'x', translatePx + 17);
				ppT.innerHTML = periods[i].name;
			}
		tl.appendChild(ppT);
	}
		var line = document.createElementNS(svgNS, 'line');
		line.setAttributeNS(null, 'id', 'line');
		line.setAttributeNS(null, 'x1', 0);
		line.setAttributeNS(null, 'y1', '3');
		line.setAttributeNS(null, 'x2', tlWidth + MARGIN*2);
		line.setAttributeNS(null, 'y2', '3');
		line.setAttributeNS(null, 'style', 'stroke:white;stroke-width:5');
	tl.appendChild(line);

	container.appendChild(tl);
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

//Delete composer from timeline
function deleteComposer(link) {
	console.log(link);
	//var pos = composers.indexOf(link);
	//console.log(pos);
	//console.log(composers);
}	

//	Get all indices of string in string. Code by Tim Down @ SO.
function getIndicesOf(searchStr, str, caseSensitive) {
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    if (!caseSensitive) {
        str = str.toLowerCase();
        searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}






		