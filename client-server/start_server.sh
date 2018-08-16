echo 'Starting Services'
#nohup bash manta_monitor_local.sh > local.log 2>&1&
echo "local file monitoring task id:"$! >> task_ids.txt

#nohup bash manta_monitor_jobs.sh > jobs.log 2>&1&
echo "job monitoring task id:"$! >> task_ids.txt

#nohup bash manta_monitor_results.sh > results.log 2>&1&
echo "result file monitoring task id:"$! >>task_ids.txt

echo 'Starting website'
nohup time node initServer.js > server.log 2>&1&
echo "node server instance task id:"$! >>task_ids.txt

