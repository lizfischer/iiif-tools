

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
                currentImageImage=new IIIFimg(url);
                console.log(currentImage);
                var width = currentImage.getWidth();
                var height = currentImage.getHeight();
                var num = currentImage.getIdentifier().split('_')[1];
                images.push({
                    url:url,
                    name:num,
                    w: width,
                    h: height
                });
            }
            imageURLs = images;
        }
    });
    return imageURLs;
}

