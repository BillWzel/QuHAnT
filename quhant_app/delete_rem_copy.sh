#!/bind/bash
#Code Review 01-27-17 Rance Nault, Daria Tarasova

echo $1 >> Monitoring/delete.log
if [ -d public/cors_demo/$1 ]; then
	echo $1 exists  >> Monitoring/delete.log
fi

echo '-x '$1 > public/services/manta-sync-ignore.txt

# Remove from manta and local
rm -r public/cors_demo/$1
mrm -r ~~/stor/cors_demo/$1

rm -r public/cors_demo/$1.set
mrm -r ~~/stor/cors_demo/$1.set

rm -r public/cors_demo/$1.intermediate
mrm -r ~~/stor/cors_demo/$1.intermediate

# clean up the manta ignore text file  
echo '-x jack/ignore/ignore ' > public/services/manta-sync-ignore.txt
grep -v $1 Monitoring/QC_SubList.tmp > temp && mv temp Monitoring/QC_SubList.tmp

sleep 1s

if [ ! -d public/cors_demo/$1 ]; then
	echo 'Successfully deleted' >> Monitoring/delete.log
else
	echo 'Not successful' >> Monitoring/delete.log
fi

echo '------------------------' >> Monitoring/delete.log
