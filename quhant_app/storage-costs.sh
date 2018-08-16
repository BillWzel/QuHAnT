# Calculated how much storage is used by user.
# Code Review 1/27/17 - Daria Tarasova - Rance Nault

# Reset the temporary json file
cd $1
echo [] > $1/public/db/storagebilling.temp

# log the start
echo $(date) >> $1/Monitoring/storagecost_success.log

# Finding the peak usage by directory over a day
summary=$(cut -f 2- $1/Monitoring/storage_total.txt | awk '$2>0 {print $2"\t"$1}' | sort -k2 -nrk 1 | uniq -f1 | awk '{print $2","$1}')

#Total data size on Manta for a day
total=$(echo "$summary" | awk 'BEGIN {FS=","}; {sum+=$2} END {print sum}')

DATE=$(date +"%Y-%m-%d")
echo -e $DATE"\t"$total >> $1/Monitoring/total-costs.txt

# Creating a main storage cost estimate for a user
for item in $(grep 'cors_demo' $summary | grep -v 'analysis_modules\|/db\|/results')
do 
  # Separating item and placing different parts into json file
  useritem=$(echo $item | sed 's=/billwzel/stor/cors_demo/={"=' | sed 's/,/", "bytes":/' | sed 's=/=", "project":"=' | sed 's/{/{"username": /' | awk -v date="$(date +"%Y-%m-%d")" '{print $0", \"date\":\""date"\"}"}')
  
  sed -i -e "s/]/,${useritem}]/" $1/public/db/storagebilling.json
  sed -i -e "s/]/,${useritem}]/" $1/public/db/storagebilling.temp
done
sed -i "s/\[,/[/" $1/public/db/storagebilling.temp
sed -i "s/\[,/[/" $1/public/db/storagebilling.json

# Updating the json array for each user
for user in $(json -f $1/public/db/storagebilling.temp | grep 'username' | sed 's/"username": //' | sed 's/"//g' | sed 's/,//' | sort | uniq)
do
  node -e 'require("'$1'/db/receipts").CalcUserStorage("'$user'",function(err,out){})'
done

#reset storage total
echo '' > $1/Monitoring/storage_total.txt

#log the end of it
echo $(date) >> $1/Monitoring/storagecost_success.log
