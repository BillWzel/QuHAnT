#!/bin/bash
echo "Manta object = $MANTA_INPUT_OBJECT"
echo "Manta file = $MANTA_INPUT_FILE"
manta_name=$(basename $MANTA_INPUT_OBJECT)
manta_path=$(dirname $MANTA_INPUT_OBJECT)


echo $manta_name
echo $manta_path

echo "First Input=$1"

cd $1

mrm -r ${manta_path}/${manta_name}

echo "DONE"

