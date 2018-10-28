$.getScript("js/iiif-manipulate.js", function(){
	console.log("script loaded but not necessarily executed.");
});

var imgPct = 25;

var getImages = function(iiifManifest){
	var data;
	var imageURLs;
	$.ajax({
		dataType:"json",
		async: false,
		url: iiifManifest,
		data: data,
		success:function(data){
			var images = [];
			var canvases = data["sequences"][0]["canvases"];
			var currentImage;
			for (i in canvases){
				var url = canvases[i]["images"][0]["resource"]["@id"];
				currentImage = new IIIFimg(url);
                var id = canvases[i]["@id"];
				var width = currentImage.getWidth();
				var height = currentImage.getHeight();
				var num = currentImage.getIdentifier().split('_')[1];
				var smaller = currentImage.setSize(imgPct);
				images.push({
					url:smaller,
					name:num,
					w: width,
					h: height,
                    id: id
				});
			}
			imageURLs = images;
		}
	});
	return imageURLs;
}

