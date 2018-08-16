INCLUDES=-I/opt/local/include/opencv2 -I/opt/local/include/opencv2/core -I/opt/local/include/opencv2/highgui -I/opt/local/include 
LIBS=-lopencv_core -lopencv_highgui -lz -lopencv_imgproc -lopencv_features2d

test.exe: WatershedMain.cpp
	g++ -std=c++11 -o test.exe $(INCLUDES) $(LIBS) WatershedMain.cpp

test: test.exe
	./test.exe

clean:
	rm -f *.exe
