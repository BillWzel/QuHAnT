# For Manta, hide imgcodecs -- For joyent use, include it
INCLUDES=-I/opt/local/include/opencv2 -I/opt/local/include/opencv2/core -I/opt/local/include/opencv2/highgui -I/opt/local/include
LIBS=-lopencv_core -lopencv_highgui -lz -lopencv_imgproc #-lopencv_imgcodecs

example.exe: DCPAH-Ki67.cpp
	g++ -o example.exe $(INCLUDES) $(LIBS) DCPAH-Ki67.cpp

test: example.exe
	./example.exe

clean:
	rm -f *.exe
