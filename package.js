Package.describe({
  name: 'skehoe1989:autoform-slingshot',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: 'An autoform input for edgee:slingshot',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/oohaysmlm/skehoe1989-autoform-slingshot',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('session')
  api.use('blaze-html-templates');
  api.use('aldeed:autoform@5.7.1');
  api.use('edgee:slingshot');
  api.addFiles('client/autoform-slingshot.html', 'client');
  api.addFiles('client/autoform-slingshot.js', 'client');
});

