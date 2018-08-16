INCLUDES=-I/opt/local/include/opencv2 -I/opt/local/include/opencv2/core -I/opt/local/include/opencv2/highgui -I/opt/local/include 
LIBS=-lopencv_core -lopencv_highgui -lz -lopencv_imgproc #-lopencv_imgcodecs

example.exe: DCPAH-AgNOR.cpp
	g++ -o example.exe $(INCLUDES) $(LIBS) DCPAH-AgNOR.cpp

test: example.exe
	./example.exe

clean:
	rm -f *.exe
