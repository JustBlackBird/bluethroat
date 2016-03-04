var gulp = require('gulp'),
    bower = require('bower'),
    browserify = require('browserify'),
    vinylSource = require('vinyl-source-stream'),
    vinylBuffer = require('vinyl-buffer'),
    babelify = require('babelify');

gulp.task('default', ['install-bower', 'build-client-app'], function(done) {
    // This task is nothing more than an agregate.
    done();
});

// Installs bower packages.
gulp.task('install-bower', function(callback) {
    bower.commands.install([], {}, {})
        .on('error', function(error) {
            callback(error);
        })
        .on('end', function() {
            callback();
        });
});

gulp.task('build-client-app', function() {
    return browserify('./client_side/app.jsx', {standalone: 'Application'})
        .transform(babelify.configure({
            presets: ['react']
        }))
        .bundle()
        .pipe(vinylSource('application.js'))
        .pipe(vinylBuffer())
        .pipe(gulp.dest('./public'));
});
