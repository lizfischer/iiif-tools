$(document).ready(function(){
    $.getScript("../../js/iiif-manipulate.js", function(){
        console.log( "Load was performed." );
    });

    var img;
    var dragging = false;
    var deg = 0;
    var ref = false;
    var hasMoved = false;
    var target     = $('#rotate-target');
    var mainTarget = $('#mainTarget');

    /* When URL submitted... */
    $('#submit').click(function(){

        // Clear output box
        $('#output').val('');

        // Get input
        var url = document.getElementById("URL").value;
        img = new IIIFimg(url);
        ref = document.getElementById("ref").checked;

        // Scale containers
        var img_width = img.getWidth();
        var img_height = img.getHeight();
        var scale = 200/img_height; // 200 is from rotate.css, the height of the elements
        $('#mainTarget').css('width', img_width*scale);
        $('#mainTarget').css('top', 100);
        $('#footer').css('bottom', -img_width*scale+150);


        // Display image
        $('#target').attr("src", url);
        if (ref) $('#target').css({transform: 'scaleX(-1)'});
        $('#mainTarget').show();
    });

    /* Toggle Reflection */
    $('#ref').change(function(){
        if (img != null) {
            if (this.checked) {
                ref = true;
                $('#target').css({transform: 'scaleX(-1)'});
            }
            else {
                ref = false;
                $('#target').css({transform: 'scaleX(1)'});
            }
            $('#output').val(img.setRotation(deg, ref));
        }
    });

    var elOfs = mainTarget.offset();
    var cent  = {X: mainTarget.width()/2, Y: mainTarget.height()/2};
    var elPos = {X: elOfs.left, Y: elOfs.top};
    target.mousedown(function() {
        dragging = true;
        if (!hasMoved) hasMoved = true;
        $('#output').val('');
    });
    $(document).mouseup(function() {
        dragging = false;
        if (img != null){
            var rot = Math.round(deg*100)/100;
            if (rot < 0) rot = 360+rot;
            var newURL = img.setRotation(rot, ref);
            $('#output').val(newURL);
        }
    }).mousemove(function(e) {
        if(dragging) {
            var mPos    = {X: e.pageX-elPos.X, Y: e.pageY-elPos.Y};
            var getAtan = Math.atan2(mPos.X-cent.X, mPos.Y-cent.Y);
            deg  = -getAtan/(Math.PI/180) + 135;
            mainTarget.css({transform: 'rotate(' + deg + 'deg)'});
        }
    });
});

//You might have a variety of interests involving killing people, and probability can apply to those too.