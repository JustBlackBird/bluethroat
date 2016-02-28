var gulp = require('gulp'),
    bower = require('bower');

gulp.task('default', ['bower-install'], function(done) {
    // This task is nothing more than an agregate.
    done();
});

// Installs bower packages.
gulp.task('bower-install', function(callback) {
    bower.commands.install([], {}, {})
        .on('error', function(error) {
            callback(error);
        })
        .on('end', function() {
            callback();
        });
});
