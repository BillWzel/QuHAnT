#!/bin/bash
mput ~~/stor/QuHAnT -f QC-Analysis.sh
mput ~~/stor/QuHAnT -f QuHAnT-QC.cpp
mput ~~/stor/QuHAnT -f makefile 
#mput ~~/stor/QuHAnT -f Image.tif

#mfind -n '.*.tif' ~~/stor/QuHAnT | \
#	mjob create -w \
#	-s ~~/stor/QuHAnT/QuHAnT-QC.cpp \
#	-s ~~/stor/QuHAnT/QC-Analysis.sh \
#	-s ~~/stor/QuHAnT/makefile \
#	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/* ./" \
#	-m "/assets/billwzel/stor/QuHAnT/QC-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE'

