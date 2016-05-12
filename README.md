# autoform-slingshot#
An autoform wrapper for autoform-slingshot.

## Motivation##
There are several other autoform-slingshot packages for Meteor, but I encountered bugs in all of them when it came to supporting multiple slingshot directives and/or image resizing.  I found the code in many of the other packages to be unnecessarily complex and decided to rewrite the package from scratch.  This version is based on the [MeteorChef tutorial](https://themeteorchef.com/recipes/uploading-files-to-amazon-s3/) on how to upload images to S3.

## Setup##
This package uses the [edgee:slingshot](https://github.com/CulturalMe/meteor-slingshot/) package to upload the files to Amazon S3 (all done client side).  Refer to the [edgee:slingshot](https://github.com/CulturalMe/meteor-slingshot/) documentation on how to set up Amazon AWS S3, as well as how to store your credentials in the Meteor Settings file.  All the client side work is done for you by the autoform-slingshot package, but you will need to define your own server-side Slingshot directives.  If you want to do client-side image resizing (to create thumbnails or create images of a uniform size) I suggest using [thinksoftware:image-resize-client](https://github.com/thinksoftware/meteor-image-resize-client/).  It is an imperfect solution and does not work as well as a back end solution like imagemagick or graphicsmagick but it's better than nothing!

Install the package:
```meteor:add skehoe1989:autoform-slingshot```

## autoform-slingshot api##
```javascript
BlogPostsSchema = new SimpleSchema({
    title: {
        type: String
    },
    createdBy: {
        type: String,
        autoValue: function() {
            if (this.isInsert) {
                return Meteor.userId();
            }
        }
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            }
        }
    },
    updatedAt: {
        type: Date,
        optional: true,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        }
    },
    content: {
        type: String,
        autoform: {
            rows: 20,
            type: 'summernote',
            settings: {
                height: '300px',
                maximumImageFileSize: '510000'
            }
        }
    },
    picture: {
        type: Object,  // Stores metadata and s3 source locations for each directive
        label: "Picture",
        blackbox: true,
        autoform: {
            type: 'slingshotUpload', // (required)
            removeLabel: 'Remove', // (optional, defaults to "Remove")
            thumbnail: 'largeThumbS3', // Specify which slingshotdirective to present as thumbnail (inside autoform) when this picture is uploaded.
            slingshotdirective: {
                largeThumb: { // <-- This will be the key stored in the final object for this image
                    directive: "largeThumbS3",
                    onBeforeUpload: function(file, callback) {  // Optional to include onBeforeUpload, this is your hook for doing image resizing or any other file manipulation before uploading it. Make sure to invoke the callback with the final file.
                        Resizer.resize(file, {  // Refer to thinksoftware:image-resize-client documentation for more info on how to resize the image.
                            width: 370,
                            height: 269,
                            cropSquare: false
                        }, function(err, file) {
                            if (err) {
                                console.error(err);
                            }
                            callback(file);  // return the resized file
                        });
                    }
                },
                smallThumb: {  // Same as above, except this one produces a 70x70px small thumbnail
                    directive: "smallThumbS3",
                    onBeforeUpload: function(file, callback) {
                        Resizer.resize(file, {
                            width: 70,
                            height: 70,
                            cropSquare: false
                        }, function(err, file) {
                            if (err) {
                                console.error(err);
                            }
                            callback(file);
                        });
                    }
                },
                original: "originalS3"  //just upload the original file using the originalS3 directive with no further modifications
            };
        }
    }

});
```

## Setting up slingshot directives##
It is best to follow the documentation at [edgee:slingshot](https://github.com/CulturalMe/meteor-slingshot/) on this, however below I will paste the three directives used in the example above: largeThumb3, smallThumbS3 and originalS3.  Choosing to use one directive (or several) comes down to if you want to set different max size limits and/or want to store different sized images in different folders.  All directives should be set up only on the Meteor server side.

```javascript
Slingshot.fileRestrictions( "largeThumbS3", {  // Attach a maxSize and restrict the file types allowed for this directive
    allowedFileTypes: [ "image/png", "image/jpeg", "image/gif" ],
    maxSize: 1 * 1024 * 512
});

Slingshot.createDirective( "largeThumbS3", Slingshot.S3Storage, {  // create the largeThumbs3 directive
    bucket: "bittigerimages", // Amazon s3 bucket
    acl: "public-read",  // Default permissions for this file - public-read is required if we want all users to be able to see the image when we embed it later on.
    AWSAccessKeyId: Meteor.settings.private.AWSAccessKeyId,  // AWSAccessKeyId from our Meteor.settings file.
    AWSSecretAccessKey: Meteor.settings.private.AWSSecretAccessKey,  // AWSSecretAccessKey from our Meteor.settings file.
    authorize: function () {   // Authorization function for security.  In my app, I have a function isUserAdmin(userId) that will only return true if the user is a site admin
        return isUserAdmin(Meteor.userId());
    },
    key: function ( file ) {  // the file name in s3 will be whatever you return from this function.  In my case, I wanted each file name to be unique, so I prepend a GUID to the filename.  Also I wanted all three of my directives to use separate folders in my AWS S3 bucket.
        return "largeThumbs/" + Meteor.uuid() + "-" + file.name;
    }
});

Slingshot.fileRestrictions( "smallThumbS3", {
    allowedFileTypes: [ "image/png", "image/jpeg", "image/gif" ],
    maxSize: 1 * 1024 * 512
});

Slingshot.createDirective( "smallThumbS3", Slingshot.S3Storage, {
    bucket: "bittigerimages",
    acl: "public-read",
    AWSAccessKeyId: Meteor.settings.private.AWSAccessKeyId,
    AWSSecretAccessKey: Meteor.settings.private.AWSSecretAccessKey,
    authorize: function () {
        return isUserAdmin(Meteor.userId());
    },
    key: function ( file ) {
        return "smallThumbs/" + Meteor.uuid() + "-" + file.name;
    }
});

Slingshot.fileRestrictions( "originalS3", {
    allowedFileTypes: [ "image/png", "image/jpeg", "image/gif" ],
    maxSize: 1 * 1024 * 512
});

Slingshot.createDirective( "originalS3", Slingshot.S3Storage, {
    bucket: "bittigerimages",
    acl: "public-read",
    AWSAccessKeyId: Meteor.settings.private.AWSAccessKeyId,
    AWSSecretAccessKey: Meteor.settings.private.AWSSecretAccessKey,
    authorize: function () {
        return isUserAdmin(Meteor.userId());
    },
    key: function ( file ) {
        return "originals/" + Meteor.uuid() + "-" + file.name;
    }
});

```

## Output Object Example##
Below is what a typical output would look like for the picture field

```javascript
{
   "smallThumb":{
      "src":"https://mybucket.s3.amazonaws.com/smallThumbs/a026c6d5-1fcc-47c0-b8a4-7ad5fd058558-black_widow.jpeg",
      "name":"black_widow.jpeg",
      "size":3003,
      "type":"image/jpeg",
      "directive":"smallThumbS3",
      "width":70,
      "height":55
   },
   "largeThumb":{
      "src":"https://mybucket.s3.amazonaws.com/largeThumbs/6ae86ac9-325c-4703-a758-61e2137c6f68-black_widow.jpeg",
      "name":"black_widow.jpeg",
      "size":26899,
      "type":"image/jpeg",
      "directive":"largeThumbS3",
      "width":370,
      "height":291
   },
   "original":{
      "src":"https://mybucket.s3.amazonaws.com/originals/84cd7e78-85c4-4570-8210-7d4d02b14c62-black_widow.jpeg",
      "name":"black_widow.jpeg",
      "size":59668,
      "type":"image/jpeg",
      "directive":"originalS3",
      "width":794,
      "height":626
   }
}
```

Maintained by [BitTiger](http://bittiger.io)
![BitTiger Logo](https://raw.githubusercontent.com/oohaysmlm/autoform-relations/master/readme/small_logo.png)
