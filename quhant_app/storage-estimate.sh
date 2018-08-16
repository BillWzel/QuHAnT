#!/bind/bash
#Code Review - 1/27/17 - Daria Tarasova - Rance Nault

echo '' > Monitoring/billingstorage_success.log
while true
do
  sleep 10800s
  echo $(date) >> Monitoring/billingstorage_success.log
  DATE=$(date +%Y%m%d)
  for d in $(mfind -t d ~~/stor/)
  do
    # goes through each directory and adds up the size of files in directory
    dirSize=$(mls -l --type o $d | awk '{sum+=$4} END {print sum}')
    echo -e $(date)'\t'$d'\t'$dirSize >> Monitoring/storage_total.txt
  done
  echo $(date) >> Monitoring/billingstorage_success.log
done
