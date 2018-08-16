#!/bin/bash
echo "Manta object = $MANTA_INPUT_OBJECT"
echo "Manta file = $MANTA_INPUT_FILE"
manta_name=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif//')
manta_path=$(dirname $MANTA_INPUT_OBJECT)

echo $manta_path

echo "First Input=$1"
echo "Second Input=$2"
echo "Third Input=$3"

cd $1

echo "Making"
make
echo "Running"
./example.exe $3 $2

mv output.summary.txt ${manta_name}.summary.analysis.json
mput $manta_path/ -f ${manta_name}.summary.analysis.json
mv output.full.txt ${manta_name}.full.analysis.json
mput $manta_path/ -f ${manta_name}.full.analysis.json

echo "DONE"
