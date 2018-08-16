echo "Updating profile"
echo "export MANTA_URL=https://us-east.manta.joyent.com" >> $HOME/.bash_profile
echo "export MANTA_USER=naultran" >> $HOME/.bash_profile
echo "export MANTA_KEY_ID=$(ssh-keygen -l -f $HOME/quhant-joyent/client_key.pub | awk '{print $2}')" >> $HOME/.bash_profile
echo "alias ipadd='ifconfig net1 | grep broadcast | sed "s/netmask.*//"'" >> $HOME/.bash_profile

echo "Managing Keys"
cp ~/quhant-joyent/client_key.pub ~/.ssh/

echo "Sourcing bash profile" 
source $HOME/.bash_profile

#bash ./start_site.sh

#echo 'Starting Services'
#nohup bash manta_monitor_local.sh > local.log &
#nohup bash manta_monitor_jobs.sh > jobs.log &
#nohup bash manta_monitor_results.sh > results.log &

