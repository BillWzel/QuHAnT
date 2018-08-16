#!/bind/bash

while true
do
	sleep 1s
	MANTA_PATH=$(echo '/naultran/stor/cors_demo/')
	INPUT_LIST=$(mfind -n '.*.tif' $MANTA_PATH)
	OUTPUT_LIST=$(mfind -n '.*.jpeg' $MANTA_PATH | sed 's/.jpeg/.tif/')

	for item in $INPUT_LIST
	do
		if [[ $OUTPUT_LIST =~ $item ]]
		then
			:		
		else
			echo Submit Image to Job: $item
			JOBID=$(echo $item | \
       				mjob create -w \
       				-s ~~/stor/QuHAnT/QuHAnT-QC.cpp \
       				-s ~~/stor/QuHAnT/QC-Analysis.sh \
       				-s ~~/stor/QuHAnT/makefile \
       				--init "cd /var/tmp && cp /assets/naultran/stor/QuHAnT/* ./" \
       				-m "/assets/naultran/stor/QuHAnT/QC-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE')

			time_stamp=$(date)
			echo $time_stamp,$item >> analysis.log
		fi
	done
done
