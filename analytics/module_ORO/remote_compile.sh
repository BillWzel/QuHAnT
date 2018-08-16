#!/bin/bash
mput ~~/stor/QuHAnT/AnalysisModules -f ORO-Analysis.sh
mput ~~/stor/QuHAnT/AnalysisModules -f Analysis-Foreground.cpp
mput ~~/stor/QuHAnT/AnalysisModules -f makefile 
mput ~~/stor/QuHAnT/AnalysisModules -f Capture.tif
#mput ~~/stor/cors_demo/Jack/111111 -f Image.tif

#mfind -n '.*.tif' ~~/stor/cors_demo/rnault/TEST-A | \
#	mjob create -w \
#	-s ~~/stor/QuHAnT/AnalysisModules/Analysis-Foreground.cpp \
#	-s ~~/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh \
#	-s ~~/stor/QuHAnT/AnalysisModules/makefile \
#	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/* ./" \
#	-m "/assets/billwzel/stor/QuHAnT/AnalysisModules/ORO-Analysis.sh /var/tmp 'set_name' "'$MANTA_INPUT_FILE'

