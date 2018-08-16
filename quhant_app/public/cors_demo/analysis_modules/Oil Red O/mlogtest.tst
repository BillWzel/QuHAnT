    1  mget /billwzel/stor/QuHAnT/AnalysisModules/Analysis-Foreground.cpp > Analysis-Foreground.cpp
    2  mget /billwzel/stor/QuHAnT/AnalysisModules/makefile > makefile
    3  mget /billwzel/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh > oror.sh
    4  mget /billwzel/stor/QuHAnT/AnalysisModules/Capture.tif > Capture.tif
    5  mget ~~/stor/cors_demo/rnault/WooHoo-ItWorks/93_Default_001_083_Image.tif > im.tif
    6  clear
    7  make
    8  cat oror.sh
    9  ./example.exe im.tif Capture.tif 225 50 125 255 0 255
   10  ls -lrth
   11  vi oror.sh
   12  clear
   13  history
