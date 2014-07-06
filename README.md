# Bluethroat

Music alarm clock that helps to wake up in the mornings.

## Installation

1. Install and configure [MPD](http://www.musicpd.org/)
2. Install required npm modules  
    ```$ npm install```
3. Copy configs/default_config.json to configs/config.json and update the
settings
4. Run the application  
    ```$ ./bin/bluethroatd start```

## Start with the system

There is an init.d script shipped with bluethroat, thus it can be easily started
with the system. Here is an example of how it can be done on Debian:

1. Copy init sctipt ```<bluethroat>/init.d/bluethroatd``` to ```/etc/init.d```.
2. Edit ```/etc/init.d/bluethroatd``` and change variable ```DAEMON``` to full
real path of the ```<bluethroat>/bin/bluethroatd``` daemon.
4. Run ```update-rc.d bluethroatd defaults``` to create symlinks that are needed
to start with the system.

## License

[GPL 2+](http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
