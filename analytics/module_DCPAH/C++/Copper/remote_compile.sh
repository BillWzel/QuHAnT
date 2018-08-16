#!/bin/bash
mput ~~/stor/QuHAnT/AnalysisModules/Copper -f Copper-Analysis.sh
mput ~~/stor/QuHAnT/AnalysisModules/Copper -f DCPAH-Copper.cpp
mput ~~/stor/QuHAnT/AnalysisModules/Copper -f makefile
#mput ~~/stor/QuHAnT/AnalysisModules/Ki67 -f Capture.tif
#mput ~~/stor/cors_demo/Jack/111111 -f Image.tif

#mfind -n '.*.tif' ~~/stor/cors_demo/Dasha/ki67-test/ | \
#	mjob create -w \
#	-s ~~/stor/QuHAnT/AnalysisModules/Copper/DCPAH-Copper.cpp \
#	-s ~~/stor/QuHAnT/AnalysisModules/Copper/Copper-Analysis.sh \
#	-s ~~/stor/QuHAnT/AnalysisModules/Copper/makefile \
#	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/* ./" \
#	-m "/assets/billwzel/stor/QuHAnT/AnalysisModules/Copper/Copper-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE'
