#!/bin/bash
echo 'First Input=$1'

cd $1

manta_path=$(dirname $MANTA_INPUT_OBJECT)

mkdir $MANTA_JOB_ID 

mv *.csv $MANTA_JOB_ID

mv data_analysis.R $MANTA_JOB_ID

mv README.txt $MANTA_JOB_ID

cd $MANTA_JOB_ID

R < data_analysis.R --save

for f in *.csv
do
  echo $f
  newName=$(echo $f | sed 's/.csv/.out.csv/')
  echo $newName
  mv $f $newName
done

cd ..

zip -r $MANTA_JOB_ID.zip $MANTA_JOB_ID

mput -H 'access-control-allow-headers: access-control-allow-origin, accept, origin, content-type' -H 'access-control-allow-methods: PUT,GET,HEAD,DELETE' -H 'access-control-allow-origin: *' $manta_path/ -f $MANTA_JOB_ID.zip

mrm $manta_path/results_full_background.csv
mrm $manta_path/results_summary_background.csv
mrm $manta_path/results_full.csv
mrm $manta_path/results_metadata.csv
mrm $manta_path/results_summary.csv 

echo "Done"
