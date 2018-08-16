#!/bind/bash

# add .ignoresample files to avoid copying unecessary directories and overwriting directories.
for sampleproj in $(find public/cors_demo/sampletest/ -mindepth 1 -maxdepth 1 -type d '!' -exec test -e "{}/.ignoresample" ';' -print)
do 
  for user in $(find public/cors_demo/ -mindepth 1 -maxdepth 1 -type d '!' -exec test -e "{}/.ignoresample" ';' -print)
  do
    # creates a symbolic link to sample projects for each user.
    ln -sf $sampleproj $user
  done
done

