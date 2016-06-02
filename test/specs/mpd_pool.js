var events = require('events'),
    should = require('should'),
    sinon = require('sinon'),
    mpd = require('mpd'),
    Promise = require('bluebird'),
    FakeMpdClient = require('../mocks/mpd_client'),
    MpdPool = require('../../lib/mpd_pool');

describe('MpdPool', function() {
    var connectStub = null;

    beforeEach(function() {
        connectStub = sinon.stub(mpd, 'connect', function() {
            var client = new FakeMpdClient();

            setTimeout(function() {
                client.emit('connect');
                client.emit('ready');
            }, 10);

            return client;
        });
    });

    afterEach(function() {
        mpd.connect.restore();
    });

    describe('connecting', function() {
        it('should run mpd.connect with correct arguments', function() {
            var mpdPool = new MpdPool({
                host: '1.2.3.4',
                port: 1234
            });

            return mpdPool.getClient().then(function(client) {
                connectStub.callCount.should.be.aboveOrEqual(1);

                var connectOptions = null;
                for (var i = 0; i < connectStub.callCount; i++) {
                    connectStub.getCall(i).args.should.have.length(1);
                    connectOptions = connectStub.firstCall.args[0];
                    connectOptions.should.have.property('host').which.is.equal('1.2.3.4');
                    connectOptions.should.have.property('port').which.is.equal(1234);
                }
            });
        });

        it('should connect to localhost:6600 by default', function() {
            var mpdPool = new MpdPool();

            return mpdPool.getClient().then(function(client) {
                connectStub.callCount.should.be.aboveOrEqual(1);

                var connectOptions = null;
                for (var i = 0; i < connectStub.callCount; i++) {
                    connectStub.getCall(i).args.should.have.length(1);
                    connectOptions = connectStub.firstCall.args[0];
                    connectOptions.should.have.property('host').which.is.equal('localhost');
                    connectOptions.should.have.property('port').which.is.equal(6600);
                }
            });
        });

        it('should return MPD client', function() {
            var mpdPool = new MpdPool();

            return mpdPool.getClient().then(function(client) {
                client.should.be.instanceof(FakeMpdClient);
            });
        });

        it('should return MPD client\'s error "as is"', function() {
            var mpdPool = new MpdPool(),
                clientError = new Error('Test');

            // Use custom stub to return client's with error.
            mpd.connect.restore();
            connectStub = sinon.stub(mpd, 'connect', function() {
                var client = new FakeMpdClient();

                setTimeout(function() {
                    client.emit('error', clientError);
                }, 10);

                return client;
            });

            return mpdPool.getClient().catch(function(err) {
                err.should.be.equal(clientError);
            });
        });
    });

    describe('co-working', function() {
        var mpdPool = null;

        beforeEach(function() {
            mpdPool = new MpdPool({size: 2});
        });

        afterEach(function() {
            mpdPool = null;
        });

        it('should create as many connections as specified in options', function() {
            var firstClient = null;

            return mpdPool.getClient().then(function(client) {
                firstClient = client;

                return mpdPool.getClient();
            }).then(function(secondClient) {
                connectStub.calledTwice.should.be.true;
                firstClient.should.not.be.equal(secondClient);
            });
        });

        it('should not create/retrieve new connections once limit is reached', function() {
            var pool = new MpdPool({size: 1});

            var done = new Promise(function(resolve, reject) {
                // Give the system some time to get one more client and fail the
                // check.
                setTimeout(function() {
                    resolve();
                }, 100);
            });

            return pool.getClient().then(function(client) {
                var getClient = pool.getClient().then(function() {
                    return Promise.reject(new Error('This should not be called.'));
                });

                return Promise.race([
                    getClient,
                    done
                ]);
            });
        });

        it('should share connection after release', function() {
            var everCreatedClients = [];

            return Promise.all([
                mpdPool.getClient(),
                mpdPool.getClient()
            ]).then(function(clients) {
                everCreatedClients = clients;

                clients.forEach(function(client) {
                    mpdPool.releaseClient(client);
                });

                // Get one more client
                return mpdPool.getClient();
            }).then(function(client) {
                everCreatedClients.should.containEql(client);
                connectStub.callCount.should.be.equal(2);
            });
        });
    });

    describe('cleaning', function() {
        var mpdPool = null;

        beforeEach(function() {
            mpdPool = new MpdPool({size: 1});
        });

        afterEach(function() {
            mpdPool = null;
        });

        it('should remove errored connections from the pool', function() {
            var firstClient = null;

            return mpdPool.getClient().then(function(client) {
                firstClient = client;

                // Push the client back to pool to make it available for others.
                mpdPool.releaseClient(client);

                // Kill the client.
                var error = new Error('Foo bar baz!');
                error.code = 'FOO_BAR_BAZ';
                firstClient.emit('error', error);

                return mpdPool.getClient();
            }).then(function(client) {
                connectStub.calledTwice.should.be.true;
                client.should.not.be.equal(firstClient);
            });
        });

        it('should remove ended connections from the pool', function() {
            var firstClient = null;

            return mpdPool.getClient().then(function(client) {
                firstClient = client;

                // Push the client back to pool to make it available for others.
                mpdPool.releaseClient(firstClient);

                // Kill the client connection.
                firstClient.emit('end');

                return mpdPool.getClient();
            }).then(function(client) {
                connectStub.calledTwice.should.be.true;
                client.should.not.be.equal(firstClient);
            });
        });
    });
});
