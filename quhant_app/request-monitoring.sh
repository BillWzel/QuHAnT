#!/bind/bash
#Code Review 01-27-17 Rance Nault, Daria Tarasova
while true
do
  sleep 1s
#  sTime=$(cat Monitoring/inactive-time.txt)
  elapsedTime=$(expr `date +%s` - `stat -c %Y Monitoring/express-access.log`)
  elapsedTime=$(echo $elapsedTime + 0 | bc)
  elapsedTimePlus=$(echo $elapsedTime + 123301 | bc)

  redis-cli -a 'hist0l0gy!sC00l' -n 4 keys '*' > ./Monitoring/redis.tmp
  ActiveUsers=$(while read p; do redis-cli -a 'hist0l0gy!sC00l' -n 4 get "${p}"; done < ./Monitoring/redis.tmp | grep 'username' | awk -F"," '{for(i=1;i<=NF;i++){if ($i ~ /username/){print $i}}}' | cut -d ':' -f 2 | grep -v '""')
  if ([ -z "$ActiveUsers" ] || [ $elapsedTime -gt 301 ]); then
    echo $elapsedTimePlus > Monitoring/inactive-time.txt
  else
    echo '0' > Monitoring/inactive-time.txt
  fi
done
