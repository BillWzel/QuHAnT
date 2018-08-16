#!/bind/bash/
#Code Review 01-27-17 Rance Nault, Daria Tarasova
read -p "Enter your name and press [ENTER]: " User
User=$(echo $User | sed 's/ /_/g')
read -p  "Enter the username you are creating the code for and press [ENTER]: " Username
Username=$(echo $Username | sed 's/ /_/g')
read -p "Enter charge code value and press [ENTER]: " Value
Value=$(echo $Value)
read -p "Provide a brief description of the purpose of the code and press [ENTER]: " Description
Description=$(echo $Description | sed 's/ /_/g')

# Calls db/chargecodes to create a new charge code for the user. 
node -e 'require("./db/chargecodes").createCCode("'$User'","'$Username'", '$Value', "'$Description'")'

