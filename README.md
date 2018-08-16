This project is a prototype of a client server for the Quantitative Histological Analysis 
Tool. The server is intended to be used on a Joyent-Manta instance running the nodejs image. 
Testing and development of this client server was developed with image version 15.1.2.

1. Start your instance on the Joyent website and note the ipaddress

2. Copy the "client_key" to the .ssh directory  
   This is the key that was provided on a USB drive.
   NOTE: NEVER E-MAIL OR TRANSFER THIS FILE OVER AN UNSECURE NETWORK. 
	 ONLY PHYSICAL COPIES SHOULD BE COPY/PASTED
	scp client_key root@72.2.114.101:~/.ssh/

3. login using the IP address and forward your authentication
    	ssh -A root@ipaddress

4. Change permissions to the "client-key" file
	chmod 600 ~/.ssh/client_key

5. Use git to download this repository. Switch to https over ssh. 
	 git clone https://gitlab.msu.edu/naultran/quhant-joyent.git

6. install opencv on joyent instance (if needed)
	 pkgin install opencv 

7. install redis-se
         pkgin install redis

8. Change to the quhant_app directory
	cd ~/quhant-joyent/quhant_app

9. Run the appsetup script 
	./appsetup

10. Update the .bash_profile source (follow directions output by script)
	source ~/.bash_profile

11. Update the redis config default password at /opt/local/etc/redis.conf to match app.js (search for requirepass .....) 
	Use the app.js password to replace the config default password at line "requirepass foobared"


12. Start the server instance:
	./startapp

13. Connect to your server from the web browser using the ipaddress and port (80)

---
SET UP WEBSITE ENVIRONMENT

1. Create 'sampletest' username
 

---
Directory Descriptions:

   analytics - Tested code for the QuHAnT analytics organized by module and module version (if applicable)
   
   client-server - Most recent end-to-end client server code
   
   developer-tools - Development and testing area for new code. Can be organized by developer name and/or function being developed/tested

---
Useful Tips:
   Update git global configurations using bash UpdateGitUser.sh
      bash UpdateGitUser 'email@something.com' 'My Name'

   After running profile_update.sh use ipadd to obtain your ip address
