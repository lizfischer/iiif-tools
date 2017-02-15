$(document).ready(function(){
    
    // TODO: Remove this. Default Manifest
    document.getElementById("URL").value = "https://purl.stanford.edu/rs424xq9888/iiif/manifest.json"
    
    
    /* When URL submitted... */
	$('#submit').click(function(){
		// Remove img styling-- clears out the 'display: none' when first image is loaded.
		$('#target').removeAttr('style');
        
		// Clear output box
		$('#output').val('');

		// Get input
		var url = document.getElementById("URL").value;
        // Get Manifest
        var images = getImages(url);
        var select = document.getElementById("list");
        for (i in images){
            var opt = document.createElement("option");
            opt.text = images[i]["name"];
            opt.value = images[i]["url"];
            select.add(opt);
        }
        console.log(images);
        updateImage();
        
	});
    
    function updateImage(){
        var url = $('#list').val();
        console.log(url);
       $('#target').attr("src", url);
    }
    
    $("#list").change(updateImage);

});
