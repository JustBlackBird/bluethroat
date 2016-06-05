var should = require('should'),
    nano = require('nano'),
    mockCouch = require('mock-couch'),
    Settings = require('../../lib/settings');

describe('Settings', function() {
    var couchdb = null,
        settings = null;

    beforeEach(function(done) {
        // On some environments (like RaspberryPi 1) running mock-couch can
        // took a long time. Give some more time to setup test environment.
        this.timeout(3000);

        couchdb = mockCouch.createServer();
        couchdb.addDB('settings', []);

        couchdb.listen(15984, function(err) {
            settings = new Settings(nano('http://127.0.0.1:15984/settings'));

            done(err);
        });
    });

    afterEach(function(done) {
        settings = null;

        couchdb.close(function() {
            couchdb = null;
            done();
        });
    });

    it('should create doc in couch if it does not exist', function() {
        return settings.set('foo', 'bar').then(function() {
            couchdb.databases.settings.foo.value.should.be.equal('bar');
        });
    });

    it('should update doc in couch if it exists', function() {
        couchdb.addDoc('settings', {_id: 'foo', value: 'bar'});

        return settings.set('foo', 'baz').then(function() {
            couchdb.databases.settings.foo.value.should.be.equal('baz');
        });
    });

    it('should return correct value from couchdb', function() {
        couchdb.addDoc('settings', {_id: 'foo', value: 'bar'});

        return settings.get('foo').then(function(value) {
            value.should.be.equal('bar');
        });
    });

    it('should return undefined for unknown values', function() {
        return settings.get('foo').then(function(value) {
            should(value).be.undefined;
        });
    });
});
