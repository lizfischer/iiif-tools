$(document).ready(function(){
	// TODO: Remove this. Default Manifest
	document.getElementById("URL").value = "https://purl.stanford.edu/rs424xq9888/iiif/manifest.json"

	/** GLOBALS **/
	var jcrop_api = null;
	var imageArray;
	var currentIndex;
	var col = null;
    var currentID = 0;
    var firstNote = 0;
    var output = "";
	/* When URL submitted... */
	$('#submit').click(function(){


		// Remove img styling-- clears out the 'display: none' when first image is loaded.
		$('#target').removeAttr('style');

		// Clear output box
		$('#output').val('');

		// Get input
		var url = document.getElementById("URL").value;
		// Get Manifest
		imageArray = getImages(url);
		var select = document.getElementById("list");
		for (i in imageArray){
			var opt = document.createElement("option");
			opt.text = imageArray[i]["name"];
			opt.value = i;
			select.add(opt);
		}
		updateImage();

	});

    $("#annotate").click(function(){
        getAnnotation();
    });

	$("#list").change(updateImage);
    $("#output").change(function(){
        output=$("#output").val();
    })
    $("#id").change(function(){
        currentID=$("#id").val();
    })
	/** CANVAS **/

	function clearURL(){
		$('#output').val("");
	}

    function updateImage(){
		// If there was an instance of jcrop, start fresh it
		if (jcrop_api != null){
			jcrop_api.destroy();
		}

		// set image
		currentIndex = $('#list').val();
		var url = imageArray[currentIndex]["url"];
		$('#target').removeAttr('style');

		$('#target').attr("src", url);

		// Start jcrop
		$('#target').Jcrop({
			boxHeight:700,
			allowSelect: true,
			allowMove: true,
			allowResize: true
		}, function(){
			jcrop_api=this;
		});
	}
    
    /* Get text from annotation box and produce output.*/
    
    function getAnnotation(){
        var lang = $("#lang").val();
        var annotation = $("#annotation").val();
        var canvas = imageArray[currentIndex]["id"];

        // Get and scale bounding box
        var sc = scaleCoords(jcrop_api.tellSelect()); // scaled coordinates
		var tc = translateCoords(sc);
		var xywh = tc.x.toString() + ","+ tc.y.toString()+","+tc.w.toString()+","+tc.h.toString();
        
        // Generate IDs
        var id1 = currentID++;
        var id2 = currentID++;
        
        $("#id").val(currentID);
        
        // Concat
        if (firstNote !== 0){
            output += ",\n"
        } else firstNote = 1;
        output += "{\n\
    \"@id\": \""+id1+"\",\n\
    \"@type\": \"oa:Annotation\",\n\
    \"motivation\": \"sc:painting\",\n\
    \"resource\": {\n\
        \"@id\": \""+id2+"\",\n\
        \"@type\": \"cnt:ContentAsText\",\n\
        \"format\": \"text/html\",\n\
        \"chars\": \""+annotation+"\",\n\
        \"language\": \""+lang+"\"\n\
    \},\n\
    \"on\": \""+canvas+"#"+xywh+"\"\n\
\}"
        $("#output").val(output);
        
    }

	/* Adjusts for IIIF image scaling (pct:40, for example) */
	function scaleCoords(c){
        var url = $("#target").attr("src");
		var x = c.x;
		var y = c.y;
		var w = c.w;
		var h = c.h;
		var split = url.split('/');
		var pctStr = split[split.length-3];
		if (pctStr != "full"){
			var pct = pctStr.split(':')[1];
			var scale = 100/pct;
			x *= scale;
			y *= scale;
			w *= scale;
			h *= scale;
		}
		x = Math.round(x);
		y = Math.round(y);
		w = Math.round(w);
		h = Math.round(h);

		return {'x':x, 'y':y, 'w':w, 'h':h}
	}

	/* Moves box over/down already cropped URLs. Takes scaled coordinates */
	function translateCoords(sc){
        var url = $("#target").attr("src");
		var x = parseInt(sc.x);
		var y = parseInt(sc.y);
		var w = parseInt(sc.w);
		var h = parseInt(sc.h);

		var oldCoords = url.split('/')[url.split('/').length - 4]

		if (oldCoords != "full"){
			var split = oldCoords.split(',');
			x += parseInt(split[0]);
			y += parseInt(split[1]);
		}
		return {'x':x, 'y':y, 'w':w, 'h':h}
	}




	/* Trigger URL submit with ENTER */
	$("#URL").keyup(function(event){
		if(event.keyCode == 13){
			$("#submit").click();
		}
	});


	/** CLIPBOARD **/

	var clipboard = new Clipboard('.btn');

	clipboard.on('success', function(e) {
		$('#copy-tip-text').text('Copied!');
		$('#copy-tip-text').fadeIn(300).delay(1000).fadeOut(300);
	});

	clipboard.on('error', function(e) {
		$('#copy-tip-text').text('Ctrl+C to copy');
		$('#copy-tip-text').fadeIn(300).delay(1000).fadeOut(300);
	});
});
