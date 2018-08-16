#!/bin/bash
mput ~~/stor/ -f randomjob.sh

#mfind -t d --maxdepth 1 ~~/jobs | \

mfind -n '.*.json' ~~/stor/cors_demo/kfader\@msu.edu/Prj147_Liver_ORO | \
mjob create -w \
-s ~~/stor/randomjob.sh \
--init "cd /var/tmp" \
-m "/assets/billwzel/stor/randomjob.sh /var/tmp "'$MANTA_INPUT_FILE'

