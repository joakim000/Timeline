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













BACKUP
======

		if (clipFile.length != 0){
			// Build list of files to get URLs for
			var fileCount = 0;
			var fileList = ""
			for (f in clipFile) {
				fileList = fileList + "File:" + clipFile[f] + "|"
				fileCount++;
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
				console.log(clipFileURL);
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