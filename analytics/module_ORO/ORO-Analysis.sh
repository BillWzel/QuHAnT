#!/bin/bash
echo "Manta object = $MANTA_INPUT_OBJECT"
echo "Manta file = $MANTA_INPUT_FILE"
echo "Set Name = $2"
manta_name=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif//')
manta_name_full=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif/_full/')
manta_name_summary=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif/_summary/')
manta_path=$(dirname $MANTA_INPUT_OBJECT)


echo $manta_name
echo $manta_path

echo "First Input=$1"
echo "Second Input=$3"

cd $1

echo "Making"
make
echo "Running"
./example.exe $3 Capture.tif 225 50 125 255 0 255 $2 0 255 20 255 0 255

mv output.feature.full.txt ${manta_name}.feature.full.analysis.json
mv output.feature.summary.txt ${manta_name}.feature.summary.analysis.json
mv output.background.full.txt ${manta_name}.background.full.analysis.json
mv output.background.summary.txt ${manta_name}.background.summary.analysis.json
mput $manta_path/ -f ${manta_name}.feature.full.analysis.json
mput $manta_path/ -f ${manta_name}.feature.summary.analysis.json
mput $manta_path/ -f ${manta_name}.background.full.analysis.json
mput $manta_path/ -f ${manta_name}.background.summary.analysis.json

echo "DONE"

