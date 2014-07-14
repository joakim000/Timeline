//Objects for storing data
function composer(link, title, born, died, name, bornL, diedL, was, extract, wikitext, clips, images){
	//Used on timeline
	this.link = link;
	this.title = title;
	this.born = born;
	this.died = died;
	//Used in infobox
	this.name = name;
	this.bornL = bornL;
	this.diedL = diedL;
	this.was = was;
	this.extract = extract;
	this.wikitext = wikitext;
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
				document.getElementById('imgdiv').appendChild(imgContainer);
			} 
		});
	}); // End of getImages
}
	