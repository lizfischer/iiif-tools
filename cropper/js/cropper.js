$(document).ready(function(){

	var jcrop_api = null;

	$("#URL").keyup(function(event){
		if(event.keyCode == 13){
			$("#submit").click();
		}
	});

	$('#submit').click(function(){
		if (jcrop_api != null){
			jcrop_api.destroy();
		}
		$('#target').removeAttr('style');
		var url = document.getElementById("URL").value;
		$('#target').attr("src", url);
		$('#target').Jcrop({
			boxHeight:700,
			onSelect: getURL,
			onChange: clearURL,
			allowSelect: true,
			allowMove: true,
			allowResize: true
		}, function(){
			jcrop_api=this;
		});
	});

		function clearURL(){
			$('#output').val("");
		}
	// Get the new URL from JCrop coordinates
		function getURL(c){
			var oldURL = $('#target').attr('src');
			var split = oldURL.split('/');
			var sc = scaleCoords(c, oldURL); // scaled coordinates
			var tc = translateCoords(sc, oldURL);

			var coordStr = tc.x.toString() + ","+ tc.y.toString()+","+tc.w.toString()+","+tc.h.toString();
			split[split.length - 4] = coordStr;
			var newURL = split.join("/");
			$('#output').val(newURL);
		}

		// Adjusts for IIIF image scaling (pct:40, for example)
		function scaleCoords(c, url){
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

		// Takes scaled coordinates
		function translateCoords(sc, oldURL){
			var x = parseInt(sc.x);
			var y = parseInt(sc.y);
			var w = parseInt(sc.w);
			var h = parseInt(sc.h);

			var oldCoords = oldURL.split('/')[oldURL.split('/').length - 4]

			if (oldCoords != "full"){
				var split = oldCoords.split(',');
				x += parseInt(split[0]);
				y += parseInt(split[1]);
			}
			return {'x':x, 'y':y, 'w':w, 'h':h}
		}


});
