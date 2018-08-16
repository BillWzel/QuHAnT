#!/bin/bash
echo "Manta object = $MANTA_INPUT_OBJECT"
echo "Manta file = $MANTA_INPUT_FILE"
manta_name_full=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif//')
manta_name_summary=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif/_summary/')
manta_path=$(dirname $MANTA_INPUT_OBJECT)

echo $manta_name
echo $manta_path

echo "First Input=$1"
echo "Second Input=$2"

cd $1

python Test_Red_HPC.py $2

mv Red_Test.txt $manta_name_full.txt
mput  $manta_path/ -f $manta_name_full.txt

echo "DONE"

