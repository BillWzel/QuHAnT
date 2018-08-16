#!/bin/sh  
#Code Review 01-27-17 Rance Nault, Daria Tarasova
i=30
while true
do
  sleep ${i}s
  errors=$(grep -i 'terminated' ./Monitoring/*.log)
  # If errors variable is empty
  if [[ -z $errors ]]; then
    echo 'no errors'
    i=30
  else
    # e-mail someone when there is an error
    node -e 'require("./models/user").sendmail("QuHAnT","Error Detected","'${errors}'","quhant@gmail.com","", function(err,res){})'
    # kill service if there is an error and try restarting it
    newError=$(echo $errors | cut -d '/' -f 3 | cut -d ':' -f 1 | sed 's/.log//')
    ./manage_services -k $newError
    ./manage_services -r $newError
    # Replace text to prevent same error logging multiple times
    sed -i 's/erminated/-killed/g' ./Monitoring/$newError.log
    # Time to recorver from error
    i=$(echo "$i + 360" | bc -l)
  fi
done
