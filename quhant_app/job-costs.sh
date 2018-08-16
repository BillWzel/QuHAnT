#!/bind/bash
# Code Review - 1/27/17 - Daria Tarasova - Rance Nault

echo '' > cost_monitoring/successful_checkjobs.txt
echo '' > cost_monitoring/jobcost_success.log
while true
do
  sleep 10800s
  echo $(date) >> cost_monitoring/jobcost_success.log
  checkedjobs=$(cat cost_monitoring/successful_checkjobs.txt)
  for jobid in $(mjob list)
  do
    if [[ $checkedjobs =~ $jobid ]]
    then
    :
    else
      DATE=$(date +%Y%m%d)
      JobJSON=$(mjob get $jobid)
      NAME=$(echo $JobJSON | json name)
      jobState=$(echo $JobJSON | json state)
      timeCreated=$(echo $JobJSON | json timeCreated)
      inputNum=$(echo $JobJSON | json stats | json tasks)
      errorNum=$(echo $JobJSON | json stats | json errors)
      if [[ $errorNum > 0 ]]; then
        jobState='error'
      fi

      if [[ $jobName == *'mjobcost'* ]]; then
        :
      else
        jobCost=$(mjob cost $jobid)	
        echo $jobid >> cost_monitoring/successful_checkjobs.txt
        jobid=$(echo $jobid | sed 's=/==')
        newJob=$(echo '{"jobid":"'$jobid'","timeCreated":"'$timeCreated'","state":"'$jobState'","name":"'$jobName'","tasks":'$inputNum',"jobCost":"'$jobCost'"}')
        sed -i "s=]=,${newJob}]=" ./public/db/jobcosts.json
        sed -i "s/\[,/[/" ./public/db/jobcosts.json
      fi  
    fi
  done
  echo $(date) >> cost_monitoring/jobcost_success.log
done
