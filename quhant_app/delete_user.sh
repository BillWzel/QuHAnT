#!/bind/bash

for line in $(cat Monitoring/delete_user.log)
do
  echo $line
  if [ -n $line ]; then
    echo $line
    # Remove user from directories
    rm -r public/cors_demo/$line
    mrm -r ~~/stor/cors_demo/$line
    #remove from users.json
    node -e 'require("./db/users").delete_user("'$line'", function(err, res){})'
  fi
done
