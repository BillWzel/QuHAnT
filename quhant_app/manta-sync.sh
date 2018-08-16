#!/bind/bash
# IS this the solution
function subJob() {
    #echo -e $1 $2 >> Monitoring/better_sync.log
    if [[ -f public/cors_demo/$1/$2/ignore_manta_to_local.sync ]]
    then
      echo 1 > public/cors_demo/$1/$2/sync_status.log

      ignore_to_local=$(cat public/cors_demo/$1/$2/ignore_manta_to_local.sync)
      ignore_to_manta=$(cat public/cors_demo/$1/$2/ignore_manta_to_manta.sync)
      to_local=''
      to_manta=''
      for i in $ignore_to_local
      do
        set -f
        to_local=$(echo -e "$to_local -x *$i")
      done
      for i in $ignore_to_manta
      do
        set -f
        to_manta=$(echo -e "$to_manta -x *$i")
      done
      find_local_set=$(ls public/cors_demo/$1/$2/*.set | wc -l)
      count_set=$(grep 'set' public/cors_demo/$1/$2/ignore_manta_to_local.sync | wc -l)
      if [ $find_local_set -eq $count_set ]
      then
        :
      else
        echo '.tif .set .intermediate .sync' > public/cors_demo/$1/$2/ignore_manta_to_local.sync
      fi

      manta-sync $to_local -r ~~/stor/cors_demo/$1/$2/ public/cors_demo/$1/$2/ > public/cors_demo/$1/$2/sync_to_local.log
      sleep 1s
      manta-sync $to_manta public/cors_demo/$1/$2/ ~~/stor/cors_demo/$1/$2/ > public/cors_demo/$1/$2/sync_to_manta.log
      echo 0 > public/cors_demo/$1/$2/sync_status.log
    fi
}


while true
do
  sleep 15s
  redis-cli -a 'hist0l0gy!sC00l' -n 4 keys '*' > redistemp.out
  for LoggedUser in $(while read p; do redis-cli -a 'hist0l0gy!sC00l' -n 4 get "${p}" | json -a "username" "project_name" | sed 's/ /,/g'; done < redistemp.out | sort | uniq)
  do 
    LoggedUserName=$(echo $LoggedUser | cut -d ',' -f 1)
    ProjectName=$(echo $LoggedUser | cut -d ',' -f 2)
 
    if [ "$LoggedUserName" != "null" ] && [ "$ProjectName" != "" ]
    then
      
      if [ ! -f "public/cors_demo/'$LoggedUserName'/'$ProjectName'/sync_status.log" ]
      then
        echo 0 > public/cors_demo/$LoggedUserName/$ProjectName/sync_status.log
      fi
        
      status=$(cat public/cors_demo/$LoggedUserName/$ProjectName/sync_status.log | bc)
      echo $LoggedUserName $ProjectName $status                  
      if [ $status -eq 0 ]
      then
        subJob $LoggedUserName $ProjectName & pid=$!
        echo $pid >> Monitoring/pid.log
        { sleep 1000; kill $pid; } &
      fi
    fi
    
    if [ ! -f "public/cors_demo/'$LoggedUserName'/results/sync_status.log" ]
    then
      echo 0 > public/cors_demo/$LoggedUserName/results/sync_status.log
    fi
        
    status=$(cat public/cors_demo/$LoggedUserName/results/sync_status.log | bc)
    if [ $status -eq 0 ]
    then
      echo $LoggedUserName "results" 
      subJob $LoggedUserName "results" & pid=$!
      echo $pid >> Monitoring/pid.log
      { sleep 1000; kill $pid; } &
    fi
    
  done
done
