#!/bind/bash

while true
do
	sleep 1s
	MANTA_PATH=$(echo '/naultran/stor/cors_demo/')
	#INPUT_LIST=$(mfind -n '.*.tif' $MANTA_PATH)
	OUTPUT_LIST=$(mfind -n '.*.jpeg' $MANTA_PATH | sed 's/.jpeg/.tif/')
	LOCAL_LIST=$(find . -name '.*.jpeg' -type f | sed 's=./==' | sed 's/.jpeg/.tif/') 
	JOBID=''

	for image in $OUTPUT_LIST
	do
		imagit=$(echo $image | sed 's=/naultran/stor/cors_demo/==')
		if [[ $LOCAL_LIST =~ $imagit ]]
		then
			:
		else
			echo Get!: $imagit
			jpeg_in=$(echo $imagit | sed 's=.tif=.jpeg=')
			txt_in=$(echo $imagit | sed 's=.tif=.txt=')
			echo $MANTA_PATH$jpeg_in
			mget $MANTA_PATH$jpeg_in -o ./public/imgs/$jpeg_in
			mget $MANTA_PATH$txt_in -o ./public/imgs/$txt_in
		fi
	done
done
