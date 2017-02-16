$(document).ready(function(){
	// TODO: Remove this. Default Manifest
	document.getElementById("URL").value = "https://purl.stanford.edu/rs424xq9888/iiif/manifest.json"

	/** GLOBALS **/
	var imageArray;
	var currentImage;
	var col = null;

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
		console.log(imageArray);
		updateImage();

	});


	$("#list").change(updateImage);

	function updateDimensions(){
		console.log("updating dim");
		var x = Math.floor($("#column").position().left)*(100/imgPct);
		var y = Math.floor($("#column").position().top)*(100/imgPct);
		var w = Math.floor($("#column").width())*(100/imgPct);
		var h = Math.floor($("#column").height())*(100/imgPct);

		$("#dim").text(x+","+y+","+w+","+h);
	}

	/** CANVAS **/

	function updateImage(){
		// clear rectangles & lines
		clearRect();

		// set image
		currentImage = $('#list').val();
		var url = imageArray[currentImage]["url"];
	   $('#target').attr("src", url);
	}

	function clearRect(){
		if (col !== null) col.remove();
		col = null;
	}

	draw(document.getElementById('canvas'));
	function draw(canvas) {
		function setMousePosition(e) {
			var ev = e || window.event; //Moz || IE
			if (ev.pageX) { //Moz
				mouse.x = ev.pageX - $("#canvas").offset().left;
				mouse.y = ev.pageY - $("#canvas").offset().top;
			} else if (ev.clientX) { //IE
				mouse.x = ev.clientX + document.body.scrollLeft;
				mouse.y = ev.clientY + document.body.scrollTop;
			}
		};
		var mouse = {
			x: 0,
			y: 0,
			startX: 0,
			startY: 0
		};
		var element = null;
		canvas.onmousemove = function (e) {
			setMousePosition(e);
			if (element !== null) {
				element.style.width = Math.abs(mouse.x - mouse.startX) + 'px';
				element.style.height = Math.abs(mouse.y - mouse.startY) + 'px';
				element.style.left = (mouse.x - mouse.startX < 0) ? mouse.x + 'px' : mouse.startX + 'px';
				element.style.top = (mouse.y - mouse.startY < 0) ? mouse.y + 'px' : mouse.startY + 'px';
			}
		}


		canvas.onclick = function (e) {
			if (document.getElementById("drawCol").checked == true){
				if (element !== null && col == null) { //ending column draw
					col = element;
					updateDimensions();
					element = null;
					canvas.style.cursor = "default";
				} else{	// starting column draw
					clearRect();
					mouse.startX = mouse.x;
					mouse.startY = mouse.y;
					element = document.createElement('div');
					element.className = 'rectangle'
					element.id = 'column';
					element.style.left = mouse.x + 'px';
					element.style.top = mouse.y + 'px';
					canvas.appendChild(element)
					canvas.style.cursor = "crosshair";
				}
			}
		}
	};

});
