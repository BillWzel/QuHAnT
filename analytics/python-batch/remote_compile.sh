#!/bin/bash
mput ~~/stor/QuHAnT/AnalysisModules -f Test_Red_HPC.py

mfind -n '.*.tif' ~~/stor/cors_demo/Tarasova/Testing_5/ | \
	mjob create -w \
	-s ~~/stor/QuHAnT/AnalysisModules/Test_Red_HPC.py \
	--init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/AnalysisModules/* ./" \
	-m "/assets/billwzel/stor/QuHAnT/AnalysisModules/python-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE'
