#!/bin/bash
echo "Manta object = $MANTA_INPUT_OBJECT"
echo "Manta file = $MANTA_INPUT_FILE"
manta_name=$(basename $MANTA_INPUT_OBJECT | sed 's/.tif//')
manta_path=$(dirname $MANTA_INPUT_OBJECT)

echo $manta_name
echo $manta_path

echo "First Input=$1"
echo "Second Input=$2"

cd $1
touch $manta_name.jpeg
mput $manta_path/ -f $manta_name.jpeg

echo "Making example.exe"
make
echo "running example.exe"
./example.exe $2

convert crop.png -resize 350x crop2.jpeg
mv crop2.jpeg $manta_name.jpeg
mv output.txt $manta_name.txt
mput  $manta_path/ -f $manta_name.txt
mput $manta_path/ -f $manta_name.jpeg

echo "DONE"

