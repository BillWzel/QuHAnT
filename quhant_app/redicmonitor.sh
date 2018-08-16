while true
do
  sleep 3600s
  date >> redis.tmp.del
  wc -l redistemp.out >> redis.tmp.del
done
