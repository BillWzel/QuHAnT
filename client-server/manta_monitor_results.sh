#!/bind/bash

while true
do
	sleep 1s
	MANTA_PATH=$(echo '/naultran/stor/cors_demo/')
	#INPUT_LIST=$(mfind -n '.*.tif' $MANTA_PATH)
	OUTPUT_SUMMARY_LIST=$(mfind -n 'summary.txt' $MANTA_PATH)
	LOCAL_SUMMARY_LIST=$(find . -name '.*.summary.txt' -type f | sed 's=./==') 

	OUTPUT_FULL_LIST=$(mfind -n 'full.txt' $MANTA_PATH)
	LOCAL_FULL_LIST=$(find . -name '*full.txt' -type f | sed 's=./==') 

	for result in $OUTPUT_SUMMARY_LIST
	do
		resit=$(echo $result | sed 's=/naultran/stor/cors_demo/==')
		if [[ $LOCAL_SUMMARY_LIST =~ $resit ]]
		then
			:
		else
			echo Get!: $resit
			summary_in=$(echo $resit)
			path_name=$(dirname $resit)
			echo $MANTA_PATH$summary_in
			echo ${path_name}
			mget $MANTA_PATH$summary_in -o ./public/results/$summary_in
			tail -n 1 ./public/results/$summary_in | sed 's/\t/,/' | awk '{print $0}' >> ./public/results/${path_name}/summary_out.txt
		fi
	done


	for result in $OUTPUT_FULL_LIST
	do
		resit=$(echo $result | sed 's=/naultran/stor/cors_demo/==')
		if [[ $LOCAL_FULL_LIST =~ $resit ]]
		then
			:
		else
			echo Get!: $resit
			full_in=$(echo $resit | sed 's=summary=full=')
			echo $MANTA_PATH$full_in
			mget $MANTA_PATH$full_in -o ./public/results/$full_in
		fi
	done
done
