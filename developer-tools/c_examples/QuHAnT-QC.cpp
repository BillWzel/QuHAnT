#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/features2d/features2d.hpp>
#include <iostream>
#include <fstream>

using namespace cv;
using namespace std;

Scalar Laplace(Mat);
vector<int> St_dev(Mat);
double Hough(Mat);

int main(int argc, char* argv[]) {
//checks if there is correct number of inputs
	if (argc < 2) {
		cout << "Usage: command input image" << endl;
		return -1;
	}
//records name to store output under file name with extension ".txt"
	string name = argv[1];
	string front_name = "/manta/naultran/stor/cors_demo/";
	string::size_type i = name.find(front_name);
	if (i != string::npos)
		name.erase(i, front_name.length());
	unsigned sz = name.size();
	name.resize(sz-4);
	name.append(".jpeg");
	
	Mat image = imread(argv[1], CV_LOAD_IMAGE_COLOR);
	Mat color = imread(argv[1], CV_LOAD_IMAGE_GRAYSCALE);
//check if input is accurate
	if (!image.data){
		cout << "Could not open or find image" << endl;
		return -1;
	}
//this process crops out black bars
	Mat gray;
	cvtColor(image, gray, CV_BGR2GRAY);
	threshold(gray, gray, 1, 255, CV_THRESH_BINARY);
	vector<vector<Point> > contours;
	vector<Vec4i> hierarchy; 
	findContours(gray, contours, CV_RETR_EXTERNAL, CV_CHAIN_APPROX_SIMPLE);
	vector<Point> cnt;
	Rect bounding = boundingRect(contours[0]);
	Mat crop  = image(bounding);
	imwrite("crop.png", crop);
//goes into standard deviation function
	vector<int> StdDevVar = St_dev(crop);
//goes into Hough function
	double HoughVar = Hough(color);
//goes into laplace function
	Scalar LaplaceVar = Laplace(crop);
//records information in a text file
	int BlurSum = 0;
	if (StdDevVar[0] != 0)
		BlurSum = (100* StdDevVar[1]/StdDevVar[0]);
	string Score= "GOOD";
	string ScoreStr = "";
	if (StdDevVar[0] <= 10)
	{
		Score = "BAD";
		ScoreStr.append("Emptiness");
	}
	if (HoughVar >= 60)
	{
		Score = "BAD";
		if (ScoreStr != "")
			ScoreStr.append(", Bubble Detected");
		else
			ScoreStr = "Bubble Detected";
	}
	if (LaplaceVar[0] < 500.0 || BlurSum >= 50)
	{	
		Score = "BAD";
		if (ScoreStr != "")
			ScoreStr.append(", Blurriness");
		else
			ScoreStr = "Blurriness";
	}
	//cout << LaplaceVar << endl;
	ofstream txt_str;
	string file_name = "output.txt";
	txt_str.open(file_name.c_str());
 	txt_str << name << "\tEmptiness\t" << 100 - StdDevVar[0] <<"%\n" 
		<< name << "\tBlurriness\t" << int(LaplaceVar[0]) << endl 
		<< name << "\tBlurriness Percentage\t" << BlurSum << "%\n"
		<< name << "\tBubble Detection\t" << int(HoughVar) << endl
		<< name << "\t" << Score << "\t" << ScoreStr << endl;
	txt_str.close();
	return 0;
}


Scalar Laplace (Mat crop) {
//Function takes the cropped image and returns the variance of Laplacian 
	Mat gray;
	cvtColor(crop, gray, CV_BGR2GRAY);
	Mat laplac;
	Laplacian(gray, laplac, CV_64F);
	Scalar mean, stddev;
	meanStdDev(laplac, mean, stddev); 
	return stddev[0]*stddev[0];
}

vector<int> St_dev(Mat crop) {
//Function takes the image and per block, finds the standard deviation
//returns percentage of blocks that were higher than threshold/not empty
	Mat kernel = Mat::zeros(1,1, CV_8UC1);
	Mat gray, erosion, dilation, laplace, scale, blurred, dilation3;

	cvtColor(crop,gray, CV_BGR2GRAY);
	erode(gray, erosion, kernel);
	dilate(erosion, dilation, kernel, Point(-1,-1), 2);

	
	Laplacian(crop, laplace, CV_64F);
	convertScaleAbs(laplace, scale);
	dilate(scale, dilation3, kernel);
	GaussianBlur(dilation3, blurred, Size(5,5), 5);
	
	double r = dilation.rows/10;
	double c = dilation.cols/10;
	Mat frame_empty;
	Mat frame_blur; 
	Scalar mean_empty;
	Scalar stddev_empty;
	Scalar mean_blur;
	Scalar stddev_blur;
	int count_empty = 0;
	int count_blur = 0;
	
	//imwrite("finalEmpty.tif", dilation);
	//imwrite("finalBlurred.tif", blurred);

	for (double i = 0; i < 10; i++)
	{
		for (double j = 0; j < 10; j++)
		{
			frame_empty = dilation(Range(i*r,(i+1)*r), Range(j*c, (j+1)*c));
			frame_blur = blurred(Range(i*r, (i+1)*r), Range(j*c, (j+1)*c));	
			meanStdDev(frame_empty, mean_empty, stddev_empty);
			//cout << stddev_empty[0] << endl;
			if (stddev_empty[0] >= 15.0)
			{
				count_empty +=1;
				meanStdDev(frame_blur, mean_blur, stddev_blur);
				if ((stddev_blur[0] + stddev_blur[1]+stddev_blur[2]) <= 20.0)
					count_blur +=1;
			}
		}
	}
	vector<int> Dev_vector;
	Dev_vector.push_back(count_empty);
	Dev_vector.push_back(count_blur);
	return Dev_vector;
}

double Hough(Mat gray) {
//Function creates mat, applies Hough Circle function on mask
//returns standard deviation of found circle
	Mat img, mask, masked_img;
	vector<Vec3f> circles;
	Scalar mean, stddev;

	resize(gray, img, Size(gray.cols/10,gray.rows/10));
	mask = Mat::zeros(img.size(), CV_8UC1);
	
	HoughCircles(img, circles, CV_HOUGH_GRADIENT, 1, 100, 60, 40, 0, 0);
	
	for (size_t i = 0; i < circles.size(); i++)
	{
		Point center(cvRound(circles[i][0]), cvRound(circles[i][1]));
		int radius = cvRound(circles[i][2]);
		circle(mask, center, radius, Scalar(255,255,255), -1);
	}
	bitwise_and(img, img, masked_img, mask=mask);
	meanStdDev(masked_img, mean, stddev);
	return stddev[0];
}
