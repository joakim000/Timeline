// Global constants
var URL = "http://en.wikipedia.org/w/api.php?format=json&callback=?"
var MARGIN = 3;
var CURRENTYEAR = new Date().getFullYear();
var svgNS = "http://www.w3.org/2000/svg";  
var xlinkNS = "http://www.w3.org/1999/xlink";

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

//Paint info coloum in infobox
function infoCol(link){
	getExtract(link).done(function(data) { //Get basic information ASYNC
		pages = data.query.pages;
		pageid = Object.getOwnPropertyNames(pages);
		extract = pages[pageid].extract;
		fullName = extract.substring(3,extract.indexOf("("));
		wasIndex = extract.indexOf("was a");
		if (extract.charAt(wasIndex+5) == 'n') { wasIndex++; };
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
		var namelink = '<a href="https://en.wikipedia.org/wiki/' + link + '" target="_blank">' + fullName + '</a>'
		
		document.getElementById('infoname').innerHTML = namelink;			
		document.getElementById('infowas').innerHTML = was;		
		//document.getElementById('borntext').innerHTML = '&nbsp;' + born;
		//document.getElementById('bornimg').innerHTML = '<img src="birth-symbol.png" width="20" height="20" />'		
		//document.getElementById('diedtext').innerHTML = '&nbsp;' + died;		
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
		if (dob != false && pob != false) {
			document.getElementById('borntext').innerHTML = '&nbsp;' + dob + ' <em>in</em> ' + pob; 
		}
		else if (dob != false) { 
			document.getElementById('borntext').innerHTML = '&nbsp;' + dob; 
		}
		if (dod != false && pod != false) {
			document.getElementById('diedtext').innerHTML = '&nbsp;' + dod + ' <em>in</em> ' + pod; 
		}
		else if (dod != false) { 
			document.getElementById('diedtext').innerHTML = '&nbsp;' + dod; 
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
	getPage(link).done(function(data) { //Get details on born & died, get audiofiles ASYNC
		pages = data.query.pages;
		pageid = Object.getOwnPropertyNames(pages);
    	rv = pages[pageid].revisions[0];
		content = rv["*"];

		var pos = content.search(/\{\{listen/i); //Add check here, if pos == -1 then there are no clips found

		if (pos == -1) {
			// load no music-image
			var img = document.createElement('img');
			img.id = 'img' + i;
			img.src = 'nomusic.png';
			img.width = '320';
			document.getElementById('musicdiv').appendChild(document.createElement('br'));
			document.getElementById('musicdiv').appendChild(document.createElement('br'));
			document.getElementById('musicdiv').appendChild(img);
			
		}
		else {
			var stringTemp = content.substring(pos+8);
			pos = stringTemp.search("}}");
			var listen = stringTemp.substring(0,pos);
			
			listen = listen.replace(/\[[\w\s��]*\|/g, '');
			//listen = listen.replace(/\[.*\|/g, '');
			listen = listen.replace(/\[/g, '');
			listen = listen.replace(/\]/g, '');
			var L = listen.split("|");
			
			var clipFile = []
			var clipDesc = []
			var clipTitle = []
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
			// Build list of files to get URLs for
			var fileList = ""
			for (f in clipFile) {
				fileList = fileList + "File:" + clipFile[f] + "|"
			}
			fileList = fileList.slice(0,-1);
			
			clipFileURL = []
			getFileURL(fileList).done(function(data) {
				x = -1
				for (i in clipFile) {
					//console.log(data);
					if (data.query.pages[x] == undefined) {
						//console.log(Object.getOwnPropertyNames(pages));
						//console.log(Object.keys(pages));
						var testid= Object.getOwnPropertyNames(pages);
						clipFileURL.push(data.query.pages[19547758].imageinfo[0].url); //Special f�r Hildegard av Bingen
						//clipFileURL.push(uData.query.pages[testid].imageinfo[0].url); //Special f�r Hildegard av Bingen
					}
					else {
						clipFileURL.push(data.query.pages[x].imageinfo[0].url);
					}
					x--;
				}		
				for (i in clipFile) {
					var clip = document.createElement('div');
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

					document.getElementById('musicdiv').appendChild(clip);
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

// Paint axis of time with periods
function timeAxis(low, high, expandFactor){
	function period(name, start, end, color){
		this.name = name;
		this.start = start;
		this.end = end;
		this.color = color;
	}
	
	var periods =  [new period('Medieval', 1200, 1400, 'orange'), new period('Renaissance', 1400, 1600, 'yellow'),
					new period('Baroque', 1600, 1745,'brown'), new period('Classical', 1745, 1820, 'gray'),
					new period('Romantic', 1820, 1900, 'red'),	new period('Modern', 1900, 1930, 'pink'),
					new period('Contemporary', 1975, CURRENTYEAR, 'khaki')];
		
	tlWidth = (high-low)*expandFactor;
	var tl = document.createElementNS(svgNS, 'svg');
	tl.setAttributeNS(null, 'height', '72');
	tl.setAttributeNS(null, 'width', (tlWidth+MARGIN*2).toString());
	document.getElementById('container').style = 'width:' + (tlWidth+30) + 'px;';
	
	for (i in periods){
			var pp = document.createElementNS(svgNS, 'rect');// pp: Paint Period
			var translatePx = ((periods[i].start - low) * expandFactor + MARGIN);
			var w = (periods[i].end - periods[i].start) * expandFactor;
			pp.setAttributeNS(null, 'height', '17');
			pp.setAttributeNS(null, 'style', 'fill:'+periods[i].color+';stroke:black;stroke-width:0;opacity:1.0');
			pp.setAttributeNS(null, 'id', 'period' + [i]);
			pp.setAttributeNS(null, 'x', translatePx + MARGIN); 
			pp.setAttributeNS(null, 'y', '28');
			pp.setAttributeNS(null, 'width', w);
		tl.appendChild(pp);
			var ppT = document.createElementNS(svgNS, 'text');
			ppT.setAttributeNS(null, 'class', 'legend');
			ppT.setAttributeNS(null, 'font-size', '16'); 
			ppT.setAttributeNS(null, 'fill', 'black');
			ppT.setAttributeNS(null, 'y', '42');
			if (periods[i].start < low){
				ppT.setAttributeNS(null, 'x', MARGIN + 10);
				ppT.innerHTML = '<< ' + periods[i].name;
			}
			else {
				ppT.setAttributeNS(null, 'x', translatePx + 10);
				ppT.innerHTML = periods[i].name;
			}
		tl.appendChild(ppT);
	}
		var line = document.createElementNS(svgNS, 'line');
		line.setAttributeNS(null, 'id', 'line');
		line.setAttributeNS(null, 'x1', MARGIN);
		line.setAttributeNS(null, 'y1', '25');
		line.setAttributeNS(null, 'x2', tlWidth + MARGIN);
		line.setAttributeNS(null, 'y2', '25');
		line.setAttributeNS(null, 'style', 'stroke:black;stroke-width:5');
	tl.appendChild(line);
		var beL = document.createElementNS(svgNS, 'line');
		beL.setAttributeNS(null, 'id', 'bookendL');
		beL.setAttributeNS(null, 'x1', MARGIN);
		beL.setAttributeNS(null, 'y1', '5');
		beL.setAttributeNS(null, 'x2', MARGIN);
		beL.setAttributeNS(null, 'y2', '45');
		beL.setAttributeNS(null, 'style', 'stroke:black;stroke-width:5');
	tl.appendChild(beL);
		var beR = document.createElementNS(svgNS, 'line');
		beR.setAttributeNS(null, 'id', 'bookendR');
		beR.setAttributeNS(null, 'x1', tlWidth + MARGIN);
		beR.setAttributeNS(null, 'y1', '5');
		beR.setAttributeNS(null, 'x2', tlWidth + MARGIN);
		beR.setAttributeNS(null, 'y2', '45');
		beR.setAttributeNS(null, 'style', 'stroke:black;stroke-width:5');
	tl.appendChild(beR);
		var yearL = document.createElementNS(svgNS, 'text');
		yearL.setAttributeNS(null, 'class', 'legend');
		yearL.setAttributeNS(null, 'font-size', '16'); 
		yearL.setAttributeNS(null, 'fill', 'black');
		yearL.setAttributeNS(null, 'x', MARGIN + 4);
		yearL.setAttributeNS(null, 'y', '20');
		yearL.innerHTML = low.toString();
	tl.appendChild(yearL);
		var yearR = document.createElementNS(svgNS, 'text');
		yearR.setAttributeNS(null, 'class', 'legend');
		yearR.setAttributeNS(null, 'font-size', '16');
		yearR.setAttributeNS(null, 'fill', 'black');
		yearR.setAttributeNS(null, 'x', tlWidth + MARGIN - 45);
		yearR.setAttributeNS(null, 'y', '20');
		yearR.innerHTML = high.toString();
	tl.appendChild(yearR);
		
	container.appendChild(tl);
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


		