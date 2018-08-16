#!/bin/bash
echo "Manta object = $MANTA_INPUT_OBJECT"
echo "Manta file = $MANTA_INPUT_FILE"
manta_name=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif//')
#manta_name_summary=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif/_summary/')
manta_path=$(dirname $MANTA_INPUT_OBJECT)

echo $manta_path

echo "First Input=$1"
echo "Second Input=$2"
echo "Third Input=$3"

cd $1

if [[ -z "$3" ]]
then 
  set_str="set"
  img_str=$2
else
  set_str=$2
  img_str=$3
fi

echo "Making"
make
echo "Running"
./example.exe $img_str $set_str 

mv output.txt ${manta_name}.summary.analysis.json
mput  $manta_path/ -f ${manta_name}.summary.analysis.json

echo "DONE"

