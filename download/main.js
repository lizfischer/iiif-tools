var Promise = window.Promise;
if (!Promise) {
    Promise = JSZip.external.Promise;
}

/**
 * Fetch the content and return the associated promise.
 * @param {String} url the url of the content to fetch.
 * @return {Promise} the promise containing the data.
 */
function urlToPromise(url) {
    return new Promise(function(resolve, reject) {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if(err) {
                reject(err);
            } else {
                resolve(data);
                console.log(url);
            }
        });
    });
}

//https://stacks.stanford.edu/image/iiif/fh878gz0315%2F198_214_V_TC_46/full/pct:20/0/default.jpg
function getSize(){
    var size;
    const sizeType = $('#sizeType option:selected').val();
    if (sizeType === "full"){
        size = "full";
    } else if (sizeType === "pct") {
        var p = +$('#pct input').val();
        if (isNaN(p)){
            return;
        }
        size = "pct:"+p
    } else if (sizeType === "max") {
        var w = +$('#width input').val();
        var h = +$('#height input').val();
        if (isNaN(w) || isNaN(h)){
            return;
        }
        size = "!"+w+","+h;
    }
    return size;
}

function resizeURL(url, size){
    var bits = url.split('/');
    bits[bits.length-3] = size;
    return bits.join('/');
}

$(document).ready(function (){
    $('#sizeType').change(function(){
        console.log("Changed!");
        var val = $('#sizeType option:selected').val();
        if (val === "full") {
            $('#size-value').hide();
            $('#pct').hide();
            $('#width').hide();
            $('#height').hide();
        } else if (val === "pct"){
            $('#size-value').hide();
            $('#pct').show();
            $('#width').hide();
            $('#height').hide();
        } else if (val === "max"){
            $('#size-value').hide();
            $('#pct').hide();
            $('#width').show();
            $('#height').show();
        } else {
            console.log("Whoops");
        }
    });


    $('#submit').click(function(){
        $('#submit').prop("disabled", true);
        resetMessage();

        var url = $('#url').val();

        $.getJSON(url, function(data){
            const label = decodeURI(data.label);
            const attr = data.attribution;
            const size = getSize();
            if (size === ""){
                showError();
                return;
            }

            var zip = new JSZip();
            showMessage("Getting images...");

            /**  Iterate over canvases finding images */
            var canvases = data['sequences'][0]['canvases'];
            for (i in canvases){
                //console.log(canvases[i].images[0].resource['@id'])
                var imgURL = canvases[i].images[0].resource['@id'];
                imgURL = resizeURL(imgURL, size);
                var filename = canvases[i].label + ".jpg";
                zip.file(filename, urlToPromise(imgURL), {binary:true});
            }

            /** Save attribution */
            zip.file("attribution.txt", attr);            

            // when everything has been downloaded, we can trigger the zip dl
            zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
                var msg = "Creating .zip : " + metadata.percent.toFixed(2) + " %";
                if(metadata.currentFile) {
                    msg += ", current file = " + metadata.currentFile;
                }
                showMessage(msg);
                updatePercent(metadata.percent|0);
            })
                .then(function callback(blob) {
                    // see FileSaver.js
                    saveAs(blob, label + "-" + size + ".zip");

                    showMessage("done !");

                    $('#submit').prop("disabled", false);
                }, function (e) {
                    console.log(e);
                    showError();
                });

            return false;
        });
    })
});


/**
 * Reset the message.
 */
function resetMessage () {
    $("#result")
        .removeClass()
        .text("");
}
/**
 * show a successful message.
 * @param {String} text the text to show.
 */
function showMessage(text) {
    resetMessage();
    $("#result")
        .addClass("alert alert-success")
        .text(text);
}
/**
 * show an error message.
 * @param {String} text the text to show.
 */
function showError() {
    var text = "Whoops, something went wrong. " +
        "Double check that your manifest is valid and you entered valid numbers for size";
    resetMessage();
    $("#result")
        .addClass("alert alert-danger")
        .text(text);
}
/**
 * Update the progress bar.
 * @param {Integer} percent the current percent
 */
function updatePercent(percent) {
    $("#progress_bar").removeClass("hide")
        .find(".progress-bar")
        .attr("aria-valuenow", percent)
        .css({
            width : percent + "%"
        });
}

if(!JSZip.support.blob) {
    showError("This demo works only with a recent browser !");
    //return;
}