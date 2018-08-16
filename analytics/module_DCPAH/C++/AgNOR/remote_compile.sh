#!/bin/bash
mput ~~/stor/QuHAnT/AnalysisModules/AgNOR -f AgNOR-Analysis.sh
mput ~~/stor/QuHAnT/AnalysisModules/AgNOR -f DCPAH-AgNOR.cpp
mput ~~/stor/QuHAnT/AnalysisModules/AgNOR -f makefile
#mput ~~/stor/QuHAnT/AnalysisModules/Ki67 -f Capture.tif
#mput ~~/stor/cors_demo/Jack/111111 -f Image.tif

#mfind -n '.*.tif' ~~/stor/cors_demo/Dasha/agnor_test/ | \
#	mjob create -w \
#	-s ~~/stor/QuHAnT/AnalysisModules/AgNOR/DCPAH-AgNOR.cpp \
#	-s ~~/stor/QuHAnT/AnalysisModules/AgNOR/AgNOR-Analysis.sh \
#	-s ~~/stor/QuHAnT/AnalysisModules/AgNOR/makefile \
#	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/* ./" \
#	-m "/assets/billwzel/stor/QuHAnT/AnalysisModules/AgNOR/AgNOR-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE'
