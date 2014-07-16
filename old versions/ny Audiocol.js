		/*
		var regex = /\{\{listen/i, result, listenP = [];
		while ( (result = regex.exec(content)) ) {
			listenP.push(result.index);
		}
		/*
		var regex = /\{\{multi-listen item/i, result, multilistenP = [];
		while ( (result = regex.exec(content)) ) {
			multilistenP.push(result.index);
		}
		*/
		
		
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
	
	
	getPage(link).done(function(data) { 
		pages = data.query.pages;
		pageid = Object.getOwnPropertyNames(pages);
    	rv = pages[pageid].revisions[0];
		content = rv["*"];

		var search = '{{listen';
		listenP = getIndicesOf(search, content, false);
		var search = '{{multi-listen item';
		multilistenP = getIndicesOf(search, content, false);
		
		
		console.log(listenP);
		console.log(multilistenP);
		
		if (listenP.length == 0 && multilistenP.length == 0) { failImage(); }
		else {
			var clipFile = []
			var clipDesc = []
			var clipTitle = []
		}
		
		if (listenP.length != 0){
			//do stuff
		}
		if (multilistenP.length != 0){
			//do stuff
		}
		
		for (pos in listenP){
			var stringTemp = content.substring(listenP[pos]+8);
			var end = stringTemp.search("}}");
			var listen = stringTemp.substring(0,end);
			listen = listen.replace(/\[[\w\séÉ]*\|/g, '');
			//listen = listen.replace(/\[.*\|/g, ''); // Next two rows in one, not sure why it doesn't work
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
						//var testid= Object.getOwnPropertyNames(pages);
						//clipFileURL.push(uData.query.pages[testid].imageinfo[0].url); 
						//clipFileURL.push(data.query.pages[19547758].imageinfo[0].url); //Special för Hildegard av Bingen
						//clipFileURL.push(data.query.pages[9263525].imageinfo[0].url); //Special för Aphex Twin
						
					}
					else {
						clipFileURL.push(data.query.pages[x].imageinfo[0].url);
					}
					x--;
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
	