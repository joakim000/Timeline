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


