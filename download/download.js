//import { jsPDF } from "jspdf";

var Promise = window.Promise;
if (!Promise) {
    Promise = JSZip.external.Promise;
}

window.jsPDF = window.jspdf.jsPDF;

/** Check which version of IIIF the manifest uses **/
function getIIIFVersion(data) {
    let context = data?.["@context"];

    // If context is an array, take the last item
    if (Array.isArray(context)) {
        context = context.at(-1); // .at(-1) works for last element
    }

    if (typeof context !== 'string') {
        throw new Error(`Invalid IIIF context: ${context}`);
    }

    if (context.endsWith("2/context.json")) return 2;
    if (context.endsWith("3/context.json")) return 3;

    throw new Error(`Unsupported IIIF version (context: ${context})`);
}

function find_images_v2(data){
    let all_urls = []
    const canvases = data['sequences'][0]['canvases'];
    for (let canvas of canvases){
        const images = canvas["images"]
        for (let i in images){
            let imgURL = images[i]["resource"]["service"]['@id'];
            // let filename = canvases[i].label + "_" + img + ".jpg";
            const suffix = images.length > 1 ? `_${i}` : '';
            const filename = `${canvas.label}${suffix}.jpg`;
            all_urls.push({"filename": filename, "url": imgURL, "apiVersion": 2});
        }
    }
    return all_urls
}

function find_images_v3(data){
    let all_urls = []
    const canvases = data['items'];
    for (let canvas of canvases){
        const annotationPages = canvas["items"]
        const canvasLabel = Object.values(canvas["label"])[0][0];
        for (let page of annotationPages){
            const images = page["items"];
            for (let img in images) {
                if (images[img]['body']["type"] === "Image"){
                    // Service may be an array or object, and may use "id" (v3) or "@id" (v2)
                    const svc = [].concat(images[img]['body']['service'])[0];
                    let imgURL = svc['id'] || svc['@id'];
                    // Image API version comes from the service, not the manifest:
                    // v3 manifests can still point at Image API 2 servers (e.g. BL)
                    const svcType = svc['type'] || svc['@type'] || '';
                    const svcProfile = Array.isArray(svc['profile']) ? svc['profile'][0] : (svc['profile'] || '');
                    const apiVersion = (svcType === 'ImageService3' || /image\/3\//.test(String(svcProfile)) || svcProfile === 'level0' || svcProfile === 'level1' || svcProfile === 'level2') ? 3 : 2;
                    // let filename = canvases[i].label + "_" + img + ".jpg";
                    const suffix = images.length > 1 ? `_${img}` : '';
                    const filename = `${canvasLabel}${suffix}.jpg`;
                    all_urls.push({"filename": filename, "url": imgURL, "apiVersion": apiVersion});
                }
            }
        }
    }
    return all_urls
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
function getSize(iiif_version) {
    const sizeType = $('#sizeType').val(); // 'option:selected' is redundant
    const w = $('#width input').val().trim();
    const h = $('#height input').val().trim();
    const p = $('#pct input').val().trim();

    const handlers = {
        full: () => "full",  // resolved per image in resizeURLs (full for Image API 2, max for 3)
        pct:  () => isNaN(p) ? undefined : `pct:${p}`,
        max:  () => (isNaN(w) || isNaN(h)) ? undefined : `${w || ''},${h || ''}`
    };

    return handlers[sizeType]?.();
}

function resizeURL(url, size){
    return url + "/full/" + size + "/0/default.jpg";
}

function resizeURLs(items, size) {
    return items.map(item => ({
        ...item,
        url: item.url + `/full/${(size === "full" && item.apiVersion === 3) ? "max" : size}/0/default.jpg`
    }));
}

$(document).ready(function (){
    /** Show/hide fields **/
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


    /* PROCESS FORM */
    $('#submit').click(function(){
        $('#submit').prop("disabled", true);
        resetMessage();

        var url = $('#url').val();

        // Get JSON from URL, then...
        $.getJSON(url, function(data){
            // Check IIIF version
            const iiif_version = getIIIFVersion(data);
            console.log("IIIF version:", iiif_version);

            // Get label and attribution from manifest
            let label, attr;
            if (iiif_version === 2) {
                label = decodeURI(data.label);
                attr = data["attribution"];
            }
            else if (iiif_version === 3) {
                label = Object.values(data["label"])[0][0];  // Get first label from first language--expected?
                const rs = data["requiredStatement"];
                if (!rs || !rs.label || !rs.value) {
                    attr = '';
                }
                else {
                    // Grab all label strings
                    const labelStrings = Object.values(rs.label).flat();

                    // Grab all value strings
                    const valueStrings = Object.values(rs.value).flat();

                    // Combine them into one string
                    attr = [...labelStrings, ...valueStrings].join(' ');
                }
            }

            // List all canvases
            // Get all image URLs for the requested size
            /**  Iterate over canvases finding images */
            let all_urls;
            switch (iiif_version) {
                case 2:
                    all_urls = find_images_v2(data);
                    break;
                case 3:
                    all_urls = find_images_v3(data);
                    break;
                default:
                    throw new Error(`Unsupported IIIF version: ${iiif_version}`);
            }

            // Get size selected in UI
            const size = getSize(iiif_version);
            if (size === ""){
                showError();
                return;
            }
            all_urls = resizeURLs(all_urls, size);

            // Create ZIP
            if ($('#outputFormat option:selected').val() == "zip"){

                var zip = new JSZip();
                showMessage("Getting images...");
                /**  Iterate over canvases finding images */
                for (let image of all_urls){
                    console.log(image)
                    // var imgURL = canvases[i].images[0].resource.service['@id'];
                    // imgURL = resizeURL(imgURL, size);
                    // //console.log(imgURL);
                    // var filename = canvases[i].label + ".jpg";
                    zip.file(image["filename"], urlToPromise(image["url"]), {binary:true});
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

            }
            // Create PDF
            else {
                showMessage("Getting images...");
                var pdf = new jsPDF(unit="px");
                let pageWidth = pdf.internal.pageSize.getWidth()
                /**  Iterate over canvases finding images */

                function getImage(i){
                    if (i >= all_urls.length){
                        pdf.deletePage(1);
                        pdf.save(label + "-" + size + ".pdf");
                        return true;
                    }
                    // var imgURL = all_urls[i].images[0].resource.service['@id'];
                    // imgURL = resizeURL(imgURL, size);
                    // var filename = all_urls[i].label + ".jpg";
                    let imgURL = all_urls[i]["url"];
                    let filename = all_urls[i]["filename"];

                    let img = new Image();
                    img.onError = function() {
                        alert('Cannot load image: "'+url+'"');
                        return false;
                    };
                    img.onload = function (){
                        const orientation = img.width >= img.height ? 'l' : 'p'
                        pdf.addPage([img.width, img.height], orientation);
                        pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
                        i += 1;
                        return getImage(i);
                    }
                    img.src = imgURL;
                    updatePercent(Math.floor(i/all_urls.length*100));
                }
                return getImage(0);
            }
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