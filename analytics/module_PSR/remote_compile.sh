#!/bin/bash
mput ~~/stor/QuHAnT/AnalysisModules/PSR -f PSR-Analysis.sh
mput ~~/stor/QuHAnT/AnalysisModules/PSR -f PSR-Foreground.cpp
mput ~~/stor/QuHAnT/AnalysisModules/PSR -f makefile 
#mput ~~/stor/cors_demo/Jack/111111 -f Image.tif

#mfind -n '.*.tif' ~~/stor/cors_demo/Jack/92DRecovery/ | \
#	mjob create -w \
#	-s ~~/stor/QuHAnT/AnalysisModules/PSR/Analysis-Foreground.cpp \
#	-s ~~/stor/QuHAnT/AnalysisModules/PSR/PSR-Analysis.sh \
#	-s ~~/stor/QuHAnT/AnalysisModules/PSR/makefile \
#	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/PSR/* ./" \
#	-m "/assets/billwzel/stor/QuHAnT/AnalysisModules/PSR/PSR-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE'
