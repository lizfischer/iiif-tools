/**
 * Created by Liz on 4/21/2018.
 */

var url = "";
var images = []


function getManifest(){
    var url = document.getElementById("url").value;
    $.getJSON(url, function(manifest){
        //console.log(JSON.stringify(manifest));
        //console.log(he.decode(manifest.label))
        document.getElementById("obj-label").innerHTML = "<b>Label: </b>" + manifest.label;
        document.getElementById("obj-desc").innerHTML = "<b>Description: </b>" + manifest.description;
        document.getElementById("obj-attr").innerHTML = "<b>Attribution: </b>" + manifest.attribution;
        //document.getElementById("obj-logo").setAttribute("src", manifest.logo["@id"])

        document.getElementById("img-container").innerHTML = "";
        for (i in manifest["sequences"][0]["canvases"]) {
            var img = manifest["sequences"][0]["canvases"][i]["images"][0]["resource"];
            var info = img["service"]["@id"];
            if (info.substring(info.length - 10) != "/info.json") info += "/info.json";
            var htmlString =
                "<div>Label: "+manifest["sequences"][0]["canvases"][i]["label"]+"</div>"+
                "<div>Direct link: "+img["@id"]+"</div>"+
                "<div>Image info link: " + info + "</div>"
                +"</br>";
            //+"<div>Thumbnail:</div>";
            console.log(htmlString);
            document.getElementById("img-container").innerHTML += htmlString;
            
        }
    });
    document.getElementById("head-wrapper").style.visibility = "visible";
}

