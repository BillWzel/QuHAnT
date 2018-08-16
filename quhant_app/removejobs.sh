for item in $(mls ~~/jobs); do echo $item; mrm -r ~~/jobs/$item; done
