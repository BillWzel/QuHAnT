#redis-cli -a 'hist0l0gy!sC00l' -n 4 DEL sess:PvILVpz5DOKtTF7xAqhK_sf0w-ji8_Sg
while read p; do echo $p; redis-cli -a 'hist0l0gy!sCOOl' -n 4 get "${p}"; if '"username":null' then DEL "${p}" fi ; done < redistemp.out
