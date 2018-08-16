#i!/bin/bash
#Code Review 01-27-17 Rance Nault, Daria Tarasova
echo '' > nohup.out

Date=$(date)

nohup ./node_modules/forever/bin/forever -w app.js > nohup.out 2>&1&
echo '{service: website, task_id: '$!', date: ' $Date'}' >> Monitoring/services.json
 
