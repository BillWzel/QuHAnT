INCLUDES=-I/opt/local/include/opencv2 -I/opt/local/include/opencv2/core -I/opt/local/include/opencv2/highgui -I/opt/local/include 
LIBS=-lopencv_core -lopencv_highgui -lz -lopencv_imgproc -lopencv_features2d # -lopencv_imgcodecs

example.exe: QuHAnT-HE.cpp
	g++ -o example.exe $(INCLUDES) $(LIBS) QuHAnT-HE.cpp

test: example.exe
	./example.exe

clean:
	rm -f *.exe
