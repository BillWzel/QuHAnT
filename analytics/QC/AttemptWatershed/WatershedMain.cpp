#include <string>
#include <iostream>
#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include "WaterShedAlgorithm.cpp"

int main( int argc, char* argv[] )
{
	if (argc < 2)
	{
		std::cout << "Usage: command input image" << std::endl;
		return -1;
	}

	std::string imgName = argv[1];
	std::string name = imgName.substr(0, imgName.find(".",0)); 
	
	WaterShedAlgorithm myWatershed;
	cv::Mat pSrc = cv::imread(argv[1], CV_LOAD_IMAGE_UNCHANGED);
	if (!pSrc.data) {
		printf("Can't open image: %s \n", imgName.c_str());
		return -1;
	}
	pSrc = 255 - pSrc;
	//cv::GaussianBlur(pSrc, pSrc, cv::Size(3,3), 0,0);
	myWatershed.run(pSrc, imgName);	

	//cvShowImage(imgName.c_str(), pSrc);
	std::string inTmp;
	if (pSrc.channels() == 3) {
		inTmp = name + "_Gray.jpg";
		cv::Mat pGray = cv::Mat::zeros(pSrc.size(), CV_8UC1);
		//cvShowImage(inTmp.c_str(), pGray);
		//	cv::imwrite(inTmp.c_str(), pGray);
	}
	/*inTmp = name + "_BW.jpg";
	cv::Mat pBW = cv::imread(inTmp.c_str(), CV_LOAD_IMAGE_UNCHANGED);
	cv::imwrite(inTmp.c_str(), pBW);
	
	inTmp = name + "_WS.jpg";
	cv::Mat pWS = cv::imread(inTmp.c_str(), CV_LOAD_IMAGE_UNCHANGED);
	cv::imwrite(inTmp.c_str(), pWS);

	inTmp = name + "_Gray_WS.jpg";
	cv::Mat pGWS = cv::imread(inTmp.c_str(), CV_LOAD_IMAGE_UNCHANGED);
	cv::imwrite(inTmp.c_str(), pGWS);	
*/
	return 0;
}
