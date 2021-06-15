import { Server } from './../src/server';
import { Utils } from './utils';

describe('http api test for redis adapter', () => {
    afterEach(done => {
        Utils.flushServers().then(() => done());
    });

    Utils.shouldRun(process.env.TEST_ADAPTER === 'redis')('get api channels with redis adapter', done => {
        Utils.newServer({ port: 6001 }, (server: Server) => {
            Utils.newServer({ port: 6002 }, (server: Server) => {
                let client1 = Utils.newClient();
                let backend = Utils.newBackend();
                let channelName = Utils.randomChannelName();

                client1.connection.bind('connected', () => {
                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        backend.get({ path: '/channels' }).then(res => res.json()).then(body => {
                            expect(body.channels[channelName]).toBeDefined();
                            expect(body.channels[channelName].subscription_count).toBe(1);
                            expect(body.channels[channelName].occupied).toBe(true);

                            let client2 = Utils.newClient({}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    backend.get({ path: '/channels' }).then(res => res.json()).then(body => {
                                        expect(body.channels[channelName]).toBeDefined();
                                        done();
                                        expect(body.channels[channelName].subscription_count).toBe(2);
                                        expect(body.channels[channelName].occupied).toBe(true);

                                        client1.disconnect();
                                        client2.disconnect();

                                        Utils.wait(3000).then(() => {
                                            backend.get({ path: '/channels' }).then(res => res.json()).then(body => {
                                                expect(body.channels[channelName]).toBeUndefined();
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(process.env.TEST_ADAPTER === 'redis')('get api channel with redis adapter', done => {
        Utils.newServer({ port: 6001 }, (server: Server) => {
            Utils.newServer({ port: 6002 }, (server: Server) => {
                let client1 = Utils.newClient();
                let backend = Utils.newBackend();
                let channelName = Utils.randomChannelName();

                client1.connection.bind('connected', () => {
                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        backend.get({ path: '/channels/' + channelName }).then(res => res.json()).then(body => {
                            expect(body.subscription_count).toBe(1);
                            expect(body.occupied).toBe(true);

                            let client2 = Utils.newClient();

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    backend.get({ path: '/channels/' + channelName }).then(res => res.json()).then(body => {
                                        expect(body.subscription_count).toBe(2);
                                        expect(body.occupied).toBe(true);

                                        client1.disconnect();
                                        client2.disconnect();

                                        Utils.wait(3000).then(() => {
                                            backend.get({ path: '/channels/' + channelName }).then(res => res.json()).then(body => {
                                                expect(body.subscription_count).toBe(0);
                                                expect(body.occupied).toBe(false);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(process.env.TEST_ADAPTER === 'redis')('get api presence channel with redis adapter', done => {
        let user1 = {
            user_id: 1,
            user_info: {
                id: 1,
                name: 'John',
            },
        };

        let user2 = {
            user_id: 2,
            user_info: {
                id: 2,
                name: 'Alice',
            },
        };

        Utils.newServer({ port: 6001 }, (server: Server) => {
            Utils.newServer({ port: 6002 }, (server: Server) => {
                let client1 = Utils.newClientForPresenceUser(user1);
                let backend = Utils.newBackend();
                let channelName = `presence-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        backend.get({ path: '/channels/' + channelName }).then(res => res.json()).then(body => {
                            expect(body.subscription_count).toBe(1);
                            expect(body.occupied).toBe(true);

                            let client2 = Utils.newClientForPresenceUser(user2, {}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    backend.get({ path: '/channels/' + channelName }).then(res => res.json()).then(body => {
                                        expect(body.subscription_count).toBe(2);
                                        expect(body.user_count).toBe(2);
                                        expect(body.occupied).toBe(true);

                                        client1.disconnect();
                                        client2.disconnect();

                                        Utils.wait(3000).then(() => {
                                            backend.get({ path: '/channels/' + channelName }).then(res => res.json()).then(body => {
                                                expect(body.subscription_count).toBe(0);
                                                expect(body.user_count).toBe(0);
                                                expect(body.occupied).toBe(false);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(process.env.TEST_ADAPTER === 'redis')('get api presence users with redis adapter', done => {
        let user1 = {
            user_id: 1,
            user_info: {
                id: 1,
                name: 'John',
            },
        };

        let user2 = {
            user_id: 2,
            user_info: {
                id: 2,
                name: 'Alice',
            },
        };

        Utils.newServer({ port: 6001 }, (server: Server) => {
            Utils.newServer({ port: 6002 }, (server: Server) => {
                let client1 = Utils.newClientForPresenceUser(user1);
                let backend = Utils.newBackend();
                let channelName = `presence-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        backend.get({ path: '/channels/' + channelName + '/users' }).then(res => res.json()).then(body => {
                            expect(body.users.length).toBe(1);

                            let client2 = Utils.newClientForPresenceUser(user2, {}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    backend.get({ path: '/channels/' + channelName + '/users' }).then(res => res.json()).then(body => {
                                        expect(body.users.length).toBe(2);

                                        client1.disconnect();
                                        client2.disconnect();

                                        Utils.wait(3000).then(() => {
                                            backend.get({ path: '/channels/' + channelName + '/users' }).then(res => res.json()).then(body => {
                                                expect(body.users.length).toBe(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    Utils.shouldRun(process.env.TEST_ADAPTER === 'redis')('presence channel users should count only once for same-user multiple connections with redis adapter', done => {
        let user = {
            user_id: 1,
            user_info: {
                id: 1,
                name: 'John',
            },
        };

        Utils.newServer({ port: 6001 }, (server: Server) => {
            Utils.newServer({ port: 6002 }, (server: Server) => {
                let client1 = Utils.newClientForPresenceUser(user);
                let backend = Utils.newBackend();
                let channelName = `presence-${Utils.randomChannelName()}`;

                client1.connection.bind('connected', () => {
                    let channel = client1.subscribe(channelName);

                    channel.bind('pusher:subscription_succeeded', () => {
                        backend.get({ path: '/channels/' + channelName + '/users' }).then(res => res.json()).then(body => {
                            expect(body.users.length).toBe(1);

                            let client2 = Utils.newClientForPresenceUser(user, {}, 6002);

                            client2.connection.bind('connected', () => {
                                let channel = client2.subscribe(channelName);

                                channel.bind('pusher:subscription_succeeded', () => {
                                    backend.get({ path: '/channels/' + channelName + '/users' }).then(res => res.json()).then(body => {
                                        expect(body.users.length).toBe(1);

                                        client1.disconnect();
                                        client2.disconnect();

                                        Utils.wait(3000).then(() => {
                                            backend.get({ path: '/channels/' + channelName + '/users' }).then(res => res.json()).then(body => {
                                                expect(body.users.length).toBe(0);
                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});