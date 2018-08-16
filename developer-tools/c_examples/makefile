INCLUDES=-I/opt/local/include/opencv2 -I/opt/local/include/opencv2/core -I/opt/local/include/opencv2/highgui -I/opt/local/include
LIBS=-lopencv_core -lopencv_highgui -lz

example.exe: Analysis-Foreground.cpp
	g++ -o example.exe $(INCLUDES) $(LIBS) Analysis-Foreground.cpp

test: example.exe
	./example.exe

clean:
	rm -f *.exe
