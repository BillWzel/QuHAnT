This is a instruction for download cordova and how to make it used in ios, android and osx platform

1.Cordova command-line runs on Node.js and is available on NPM.
2.Open a command prompt or Terminal. npm install -g cordova.
3.Create a blank Cordova project. cordova create <path> 
4.Going to the project directory, add the platform. cordova platform add <platform name> (if want ios, just type cordova platform add ios)
5.From the directory, run Cordova app. cordova run <platform name> (cordova run ios)
6.In the directory, thers is a main folder called www, all the code should be in here for multiple platform run on cordova.
7.If you want to use andorid platform on mac conputer, you need to install the android studio on mac first.
8.You need to run the app on android studio first then run the cordova app.
9.For the mac user for ios platform, you need to install the xcode first.
10.Reference to add jxcore on cordova to run node.js. https://github.com/jxcore/jxcore-cordova

