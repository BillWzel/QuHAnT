# !/bin/bash
mput ~~/stor/QuHAnT/AnalysisModules/Ki67 -f Ki67-Analysis.sh
mput ~~/stor/QuHAnT/AnalysisModules/Ki67 -f DCPAH-Ki67.cpp
mput ~~/stor/QuHAnT/AnalysisModules/Ki67 -f makefile

#mfind -n '.*.tif' ~~/stor/Ki673/ | \
#	mjob create -w \
#        -s ~~/stor/QuHAnT/AnalysisModules/Ki67/DCPAH-Ki67.cpp \
#        -s ~~/stor/QuHAnT/AnalysisModules/Ki67/Ki67-Analysis.sh \
#        -s ~~/stor/QuHAnT/AnalysisModules/Ki67/makefile \
#	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/Ki67/* ./" \
#        -m "/assets/billwzel/stor/QuHAnT/AnalysisModules/Ki67/Ki67-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE'
