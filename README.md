# Bluethroat

[![Build Status](https://travis-ci.org/JustBlackBird/bluethroat.svg)](https://travis-ci.org/JustBlackBird/bluethroat)

Music alarm clock that helps to wake up in the mornings.

The program is named after a little singing bird with a beautiful voice.

## Installation

1. Install and configure [MPD](http://www.musicpd.org/)

2. Install and configure [CouchDB](http://couchdb.apache.org/)

3. Install required npm modules
    ```shell
    npm install
    ```

4. Run Gulp to build the project (notice you need to install Gulp globaly if you don't have it yet)
    ```shell
    gulp default
    ```

5. Copy configs/default_config.json to configs/config.json and update the
settings

6. Run the application
    ```shell
    ./bin/bluethroatd start
    ```

## Start with the system

There is an init.d script shipped with bluethroat, thus it can be easily started
with the system. Here is an example of how it can be done on Debian:

1. Copy init sctipt ```<bluethroat>/init.d/bluethroatd``` to ```/etc/init.d```.
2. Edit ```/etc/init.d/bluethroatd``` and change variable ```DAEMON``` to full
real path of the ```<bluethroat>/bin/bluethroatd``` daemon.
4. Run ```update-rc.d bluethroatd defaults``` to create symlinks that are needed
to start with the system.

## Terms of Use

Bluethroat is licensed under the terms of [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
