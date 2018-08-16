#!/bind/bash
#Code Review - 01/27/17 - Daria Tarasova - Rance Nault

# Checking manta usage
cd $1
source ~/.bash_profile

echo '' > HEAD.del
echo '' > DELETE.del
echo '' > GET.del
echo '' > LIST.del
echo '' > OPTIONS.del
echo '' > POST.del
echo '' > PUT.del
echo '' > TOTAL.del

mm=$(date +"%m")
dd=$(date +"%d")


for i in {00..23}
do
  echo $i
  mget ~~/reports/usage/request/2017/${mm}/${dd}/${i}/h${i}.json | json requests | json -a type > usagetemp.json
  json -f usagetemp.json HEAD >> HEAD.del
  json -f usagetemp.json | json DELETE >> DELETE.del
  json -f usagetemp.json | json GET >> GET.del
  json -f usagetemp.json | json LIST >> LIST.del
  json -f usagetemp.json | json OPTIONS >> OPTIONS.del
  json -f usagetemp.json | json POST >> POST.del
  json -f usagetemp.json | json PUT >> PUT.del
done

for f in *.del
do
  awk -v fname=$f '{s+=$1}END{print fname"\t"s}' $f >> TOTAL.del
done

