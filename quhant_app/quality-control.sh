#!/bind/bash

function subJob() {
  echo "in job"
  echo 1000 > ${2}status.log
  echo -e 'Running' $(date) >> ${2}QC.log
  INPUT_LIST=$(mfind -n '.*.tif' ${1})
  echo $1 >> ${2}QC.log
  echo $2 >> ${2}QC.log
  OUTPUT_LIST=$(mfind -n '.*.jpeg' ${1} | sed 's/.jpeg/.tif/')
  SUBMIT_LIST=$(cat ${2}QC_SubList.tmp)

  echo $OUTPUT_LIST > ~/test1.lg
  echo $SUBMIT_LIST > ~/test2.lg

  echo '' > ${2}QC_TempList.tmp
  i=0
  for item in $INPUT_LIST
  do
    echo "comparing items "$item" : "$i >> ~/test.lg
    # if the image has a jpeg or is in the submitted list, do nothing!
    if [[ $OUTPUT_LIST =~ $item || $SUBMIT_LIST =~ $item ]]
      then
       :
      else
        # Appending non-QC'd image names to TempList until there are up to 990
        ((i++))
        echo $item >> ${2}QC_TempList.tmp
        if [[ $i > 990 ]]
          then
            # Too many images for a single joyent job - split it up into groups of 990
          break
        fi
    fi
  done
  echo $i done! >> ${2}count.tmp
  if [[ $i == 0 ]]
    then
      :
    else
      echo "about to submit job"
      cat ${2}QC_TempList.tmp >> ${2}QC_SubList.tmp
      echo 0 > ${2}status.log
      JOBID=$(cat ${2}QC_TempList.tmp |\
        mjob create -w \
        -n "QC $1" \
        -s ~~/stor/QuHAnT/QuHAnT-QC.cpp \
        -s ~~/stor/QuHAnT/QC-Analysis.sh \
        -s ~~/stor/QuHAnT/makefile \
        --init "cd /var/tmp && cp /assets/billwzel/stor/QuHAnT/* ./" \
        -m "/assets/billwzel/stor/QuHAnT/QC-Analysis.sh /var/tmp "'$MANTA_INPUT_FILE')
      echo "submitted job"
      echo $JOBID >> ${2}QC.log
  fi
  # TODO : if job is stuck, would status.log stay at 1000
  echo 'Finished' $(date) >> ${2}QC.log
  #echo 0 > ${2}status.log
}

while true
do
  sleep 10s
  redis-cli -a 'hist0l0gy!sC00l' -n 4 keys '*' > redistemp.out
  for LoggedUser in $(while read p; do redis-cli -a 'hist0l0gy!sC00l' -n 4 get "${p}" | json -a "username"; done < redistemp.out | sort | uniq)
  do
    if [ "$LoggedUser" != "null" ]
    echo $LoggedUser
    then
      # TODO FIX INTERUPPTIONS (THEY STAY AT 1000 INSTEAD OF 0)
      MANTA_PATH=$(echo '/billwzel/stor/cors_demo/'$LoggedUser'/')
      LOG_PATH=$(echo 'public/cors_demo/'$LoggedUser'/Monitoring/')
      if [ ! -f "${LOG_PATH}status.log" ]
      then
        echo 0 > $LOG_PATH'status.log'
      else
        :
      fi
      sTime=$(cat $LOG_PATH'status.log' | bc)
      echo $sTime
      if [ $sTime -eq 0 ]
      then
        subJob $MANTA_PATH $LOG_PATH & pid=$!
        { sleep 6000; kill $pid; } &
      else
        :
      fi
    fi
  done
done
