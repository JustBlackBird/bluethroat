// Show 404 page
exports.notFound = function(req, res, next) {
    res.send(404, 'Page not found.');
}

// Show 5xx page
exports.serverError = function(err, req, res, next) {
    console.dir(err);
    res.status(err.status || 500);
    res.send('Server error. Try again later.');
}
