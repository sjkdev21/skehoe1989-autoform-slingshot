/**
 * Created by stevenkehoe on 4/22/16.
 */

AutoForm.addInputType('slingshotUpload', {
    template: "afSlingshot",
    valueOut: function(){
        var fileRecord = Session.get(this.attr('data-schema-key') + "_fileRecord");
        return fileRecord;

    }
});

let template;

let _getFileFromInput = ( event ) => event.target.files[0];

let _setPlaceholderText = ( string = "Click or Drag a File Here to Upload" ) => {
    template.find( ".alert span" ).innerText = string;
};

let _uploadFileToAmazon = (file, directive, name, schemaKey) => {
    const uploader = new Slingshot.Upload( directive );

    uploader.send( file, ( error, url ) => {
        if ( error ) {
            alert( error.message);
            _setPlaceholderText();
        } else {

            if (_.contains(["image/png", "image/jpeg", "image/gif"], file.type) ) {
                let img = new Image();
                img.onload = function() {
                    var fileRecord = Session.get(schemaKey + "_fileRecord");
                    fileRecord[name] = {
                        src: url,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        directive: directive,
                        width: this.width,
                        height: this.height
                    };
                    Session.set(schemaKey + "_fileRecord", fileRecord);
                }
                img.src = url;
            } else {
                var fileRecord = Session.get(schemaKey + "_fileRecord");
                fileRecord[name] = {
                    src: url,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    directive: directive,
                };
                Session.set(schemaKey + "_fileRecord", fileRecord);
            }

        }
    });
};

let uploadToAmazonS3 = ( options ) => {
    template = options.template;
    let file = _getFileFromInput( options.event );

    _setPlaceholderText( `Uploading ${file.name}...` );
    if(options.onBeforeUpload){
        options.onBeforeUpload(file, function(file){
            _uploadFileToAmazon(file, options.directive, options.name,  options.schemaKey);
        });
    }
    else {
        _uploadFileToAmazon(file, options.directive, options.name, options.schemaKey);
    }


};

Template.afSlingshot.events({
    'change input[type="file"]' ( event, template ) {
        /*
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.onload = function(fileLoadEvent) {
            Meteor.call('largeThumbImage', file, reader.result);
        };
        reader.readAsBinaryString(file);
         */
        var directives = this.atts.slingshotdirective;
        for(var key in directives){
            if (directives.hasOwnProperty(key) && (typeof directives[key] === "object")) {
                uploadToAmazonS3( { event: event, template: template, directive: directives[key].directive, name:key, onBeforeUpload: directives[key].onBeforeUpload, schemaKey:this.atts['data-schema-key'] } );
            }
            else if(directives.hasOwnProperty(key) && (typeof directives[key] === "string")){
                uploadToAmazonS3( { event: event, template: template, directive: directives[key], name:key, schemaKey:this.atts['data-schema-key'] } );
            }
        }

    },
    'click .file-upload-clear' : function(e) {
        Session.set(this.atts['data-schema-key'] + "_fileRecord", {});
    }
});

Template.afSlingshot.helpers({
   schemaKey: function(){
       return this.atts['data-schema-key'];
   },
    thumbnail: function(){
        var fileRecord = Session.get(this.atts['data-schema-key'] + "_fileRecord");
        if(fileRecord[this.atts.thumbnail]){
            return fileRecord[this.atts.thumbnail].src;
        }
    },
    filePath: function () {
        if (this.atts.showPath) {
            var fileRecord = Session.get(this.atts['data-schema-key'] + "_fileRecord");
            if(fileRecord.file){
                return fileRecord.file.src;
            }
        }
    }
});



Template.afSlingshot.onCreated(function(){
    if(this.data.value){
        Session.set(this.data.atts['data-schema-key'] + "_fileRecord", this.data.value);
    }
    else {
        Session.set(this.data.atts['data-schema-key'] + "_fileRecord", {});
    }
});
