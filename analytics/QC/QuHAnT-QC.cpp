#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/features2d/features2d.hpp>
#include <iostream>
#include <fstream>
#include <cmath>

// Definitions for "Magic Numbers"
#define EMPTY_THRESHOLD 10
#define HOUGH_THRESHOLD 60
#define BLUR_THRESHOLD 25
#define BLOCK_DIVISION 10
#define NOT_EMPTY_STDDEV_THRESH 15
#define BLUR_STDDEV_THRESH 20
#define HOUGH_MIN_DIST 100
#define HOUGH_PARAM_ONE 60
#define HOUGH_PARAM_TWO 40
#define EMPTINESS_THRESHOLD 200
#define BLURRINESS_THRESHOLD 127
#define BLUR_MIN_SIZE 1000
#define BLUR_MAX_SIZE 3500
#define BINARY_THRESHOLD 87
#define MIN_AREA 10000.0
#define CIRCULARITY_FACTOR_THRESHOLD 0.39
#define BACKGROUND_THRESH 200
#define RED_STAIN_THRESH 50

// Function Headers
std::vector<int> Emptiness_Blurriness_Detection(cv::Mat);
double Hough(cv::Mat);
std::vector<float> Contour(cv::Mat);
bool compareContourArea(std::vector<cv::Point>, std::vector<cv::Point>);
std::vector<float> Center_Circle_Detection(std::vector<cv::Point>, cv::Mat);
bool Red_Stain_Detection(cv::Mat, cv::Mat);

int main(int argc, char* argv[]) {
// Checks if there is correct number of inputs
	if (argc < 2) {
		std::cout << "Usage: command input image" << std::endl;
		return -1;
	}
// Records name to store output under file name with extension ".jpeg"
	std::string name = argv[1];
// Removes file path and extension and appends ".jpeg"
	std::string image_name = name.substr(name.find_last_of("/")+1);	
	name = image_name.substr(0,image_name.find(".",0));
	name.append(".jpeg");
	unsigned sz = name.size();
	
// Loads in image
	cv::Mat im = cv::imread(argv[1], CV_LOAD_IMAGE_UNCHANGED);
	
// Checks if image is 1 channel
// If so, Returns output as bad and exits program
	if (im.channels() == 1)
	{
		std::ofstream txt_str;
		std::string file_name = "output.txt";
		txt_str.open(file_name.c_str());
                txt_str << name << "\tNot Valid" << "\tNot a color image\n";
 		txt_str << name << "\tBAD" << "\tNot a color image";
		txt_str.close();
		cv::imwrite("crop.png", im);
		return -1;
	}
	
	cv::Mat gray = cv::imread(argv[1], CV_LOAD_IMAGE_GRAYSCALE);
// Checks if image input is accurate
	if (!gray.data){
		std::cout << "Could not open or find image" << std::endl;
		return -1;
	}
// This process crops out black bars
	cv::Mat binary;
	cv::threshold(gray, binary, 1, 255, CV_THRESH_BINARY);
	std::vector<std::vector<cv::Point> > contours; 
	cv::findContours(binary, contours, CV_RETR_EXTERNAL, CV_CHAIN_APPROX_SIMPLE);
	std::vector<cv::Point> cnt;
	cv::Rect bounding = cv::boundingRect(contours[0]);
	cv::Mat crop  = im(bounding);
	cv::imwrite("crop.png", crop);

// Goes into QC Modules
	std::vector<int> StdDevVar = Emptiness_Blurriness_Detection(gray);
	std::vector<float> answer = Contour(gray);
	bool red_stain_bool = Red_Stain_Detection(im, gray);

// Records information in a text file
//  Checks if results from QC Modules are indicitive of a bad or good image
	int BlurSum = 0;
	if (StdDevVar[0] != 0)
		BlurSum = (100* StdDevVar[1]/StdDevVar[0]);
	std::string Score= "GOOD";
	std::string ScoreStr = "";
	std::string bubble_output = "NO";
        std::string red_stain_output = "NO";
	if (StdDevVar[0] <= EMPTY_THRESHOLD)
	{
		Score = "BAD";
		ScoreStr.append("Emptiness");
	}
	if (BlurSum >= BLUR_THRESHOLD)
	{	
		Score = "BAD";
		if (ScoreStr != "")
			ScoreStr.append(", Blurriness");
		else
			ScoreStr = "Blurriness";
	}
	if (answer[0] != 0 and answer[1] < 500.0 and answer[2] < 500.0)
	{
		Score = "BAD";
		bubble_output = "YES";
		if (ScoreStr != "")
			ScoreStr.append(", Bubble Detected");
		else
			ScoreStr = "Bubble Detected";
	}

	if (red_stain_bool == 1)
	{
		Score = "BAD";
                red_stain_output = "YES";
		if (ScoreStr != "")
			ScoreStr.append(", Red Stain Detected");
		else
			ScoreStr = "Red Stain Detected";
	}

// Writes information into a text file
	std::ofstream txt_str;
	std::string file_name = "output.txt";
	txt_str.open(file_name.c_str());
 	txt_str << name << "\tPercentage Empty\t" << 100 - StdDevVar[0] <<"%\n" 
		<< name << "\tPercentage Blurry\t" << BlurSum << "%\n"
		<< name << "\tBubble Detected\t" << bubble_output << std::endl
		<< name << "\tFalse Positive Stain Detected\t" << red_stain_output << std::endl
		<< name << "\t" << Score << "\t" << ScoreStr;
	txt_str.close();
	return 0;
}

// Subdivides entire image into 100 sub-images and calculates the standard deviation per sub image. 
std::vector<int> Emptiness_Blurriness_Detection(cv::Mat gray) {
// Function takes the image and per block, finds the standard deviation
// Returns percentage of blocks that were higher than threshold/not empty
	cv::Mat kernel = cv::Mat::zeros(1,1, CV_8UC1);
	cv::Mat empty_thresh, edges, scaled, blur_thresh, laplace, scale, dilation, blurred;

	cv::threshold(gray, empty_thresh, EMPTINESS_THRESHOLD, 255, CV_THRESH_BINARY);
	
	cv::Sobel(gray, edges, CV_64F, 1, 1, 5);
	cv::convertScaleAbs(edges, scaled);
	cv::threshold(scaled, blur_thresh, BLURRINESS_THRESHOLD, 255, CV_THRESH_BINARY);

	cv::Laplacian(gray, laplace, CV_64F);
	cv::convertScaleAbs(laplace, scale);  //absolute value scale
	cv::dilate(scale, dilation, kernel);
	cv::GaussianBlur(dilation, blurred, cv::Size(5,5), 5);
	
	double r = gray.rows/BLOCK_DIVISION;
	double c = gray.cols/BLOCK_DIVISION;
	cv::Mat frame_not_empty, frame_blur, location_blur, frame_laplacian_blur;
	cv::Scalar mean_not_empty;
	cv::Scalar stddev_not_empty;
	cv::Scalar mean_blur;
	cv::Scalar stddev_blur;
	int count_not_empty = 0;
	int count_blur = 0;

// Goes through blocks in image and decides whether blocks are empty or blurry	
	for (double i = 0; i < 10; i++)
	{
		for (double j = 0; j < 10; j++)
		{
			frame_not_empty = empty_thresh(cv::Range(i*r,(i+1)*r), cv::Range(j*c, (j+1)*c));
			frame_blur = blur_thresh(cv::Range(i*r, (i+1)*r), cv::Range(j*c, (j+1)*c));	
			cv::meanStdDev(frame_not_empty, mean_not_empty, stddev_not_empty);
			if (stddev_not_empty[0] >= NOT_EMPTY_STDDEV_THRESH)
			{
				count_not_empty +=1;
				cv::findNonZero(frame_blur, location_blur);
				if (location_blur.total() > 0)
				{
					if (location_blur.total() < BLUR_MIN_SIZE)
						count_blur += 1;
					else if (location_blur.total() <= BLUR_MAX_SIZE and location_blur.total() >= BLUR_MIN_SIZE)
					{
						frame_laplacian_blur = blurred(cv::Range(i*r, (i+1)*r), cv::Range(j*c, (j+1)*c));
						cv::meanStdDev(frame_laplacian_blur, mean_blur, stddev_blur);
						if ((stddev_blur[0] + stddev_blur[1]+stddev_blur[2]) <= BLUR_STDDEV_THRESH)
							count_blur +=1;
					}
				}
				else
					count_blur +=1;
			}
		}
	}
// Creates a vector and places the outputs into vector
// Returns vector due to need to return 2 values
	std::vector<int> Dev_vector;
	Dev_vector.push_back(count_not_empty);
	Dev_vector.push_back(count_blur);
	return Dev_vector;
}

bool compareContourAreas (std::vector<cv::Point> c1, std::vector<cv::Point> c2) {
//function returns which contour area is larger
//Called from Contour function
	double i = std::fabs(cv::contourArea(c1));
	double j = std::fabs(cv::contourArea(c2));
	return (i > j );
}


std::vector<float> Center_Circle_Detection (std::vector<cv::Point> c, cv::Mat img) {	
// Given a contour, Function walks around the edges of the contour and determines the center of the "circle" for multiple points. Returns the std dev of the centers.
// http://www.intmath.com/applications-differentiation/8-radius-curvature.php	

// Checks if points of contour are located on the edge of image,
// If so, ignores them. Places good ones in vector "valid_points"
	std::vector<cv::Point> valid_points;
	for (int i = 0; i < c.size(); i++)
	{
		if ((c[i].x <= 5 or c[i].y <= 5 or c[i].x >= img.cols-5 or c[i].y >= img.rows-5) == 0) 
			valid_points.push_back(cv::Point(c[i]));
	}		

	int parts = valid_points.size()/3;
	float center_x, center_y;

// Initializes the vectors for x and y values of computed centers
	std::vector<float> vector_x;
	std::vector<float> vector_y;
	std::vector<cv::Point> points_circle;
	points_circle.push_back(cv::Point(0,0));
	points_circle.push_back(cv::Point(0,0));
	points_circle.push_back(cv::Point(0,0));


// Goes into for loop to walk around contour to find centers of contour
	for (int i = 0; i < parts; i++)
	{
		for (int j = 0; j < 3; j++)
			points_circle[j] = valid_points[(parts*j)+i];
		
		float m1 = 0.0;
		float p0x = points_circle[0].x;
		float p1x = points_circle[1].x;
		float p0y = points_circle[0].y;
		float p1y = points_circle[1].y;	
		float p2x = points_circle[2].x;
		float p2y = points_circle[2].y;
		
		if (p0x != p1x)
			m1 = (p1y - p0y) / (p1x - p0x);

		float m2 = 0.0;
		if (p2x != p1x)
			m2 = (p2y - p1y) / (p2x - p1x);

		if (m1 != 0 and m2-m1 != 0)
		{
			center_x = ((m1 * m2 * (points_circle[0].y - points_circle[2].y)) + (m2 * (points_circle[0].x + points_circle[1].x)) - (m1 * (points_circle[1].x + points_circle[2].x))) / (2 * (m2-m1));

			center_y = ((-1/m1)*(center_x-((points_circle[0].x + points_circle[1].x)/2)))+((points_circle[0].y+points_circle[1].y)/2);
			
			vector_x.push_back(center_x);
			vector_y.push_back(center_y);
		}
	}

	std::vector<float> std_dev_centers;
	cv::Scalar mean_x, std_dev_x, mean_y, std_dev_y;
	cv::meanStdDev(vector_x, mean_x, std_dev_x);
	cv::meanStdDev(vector_y, mean_y, std_dev_y);
	float SD_x = std_dev_x[0] + std_dev_x[1] + std_dev_x[2];
	float SD_y = std_dev_y[0] + std_dev_y[1] + std_dev_y[2];

// Returns the std deviation of the centers found on the contour	
	std_dev_centers.push_back(SD_x);
	std_dev_centers.push_back(SD_y);
	return std_dev_centers;

}


std::vector<float> Contour (cv::Mat gray) {
// Function finds contours in binary image to detect bubble
// If it is a bubble, places into vector and returns 1 or 0 based on size

// Converts image to grayscale and segments it to find contours
	cv::Mat thresh, mask;
	std::vector<std::vector<cv::Point> > contours;
	std::vector<cv::Point> cnt;
	mask = cv::Mat::zeros(gray.size(), CV_8UC1);
	cv::threshold (gray, thresh, BINARY_THRESHOLD, 255, CV_THRESH_BINARY); 
	cv::findContours (thresh, contours, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	
// Sorts contours based on the area of the contour
	std::sort(contours.begin(), contours.end(), compareContourAreas);
	
	std::vector<std::vector<cv::Point> > contours_poly(contours.size());
	std::vector<cv::Rect> boundRect( contours.size());
	double area = 0;
	double perimeter = 0;
	std::vector<cv::Point> c;
// Adds polygonal curve to boundRect vector
	for (int i = 0; i < contours.size(); i++)
	{
		approxPolyDP( cv::Mat(contours[i]), contours_poly[i], 3, true);
		boundRect[i] = cv::boundingRect( cv::Mat(contours_poly[i]));
	}

// Determines if contour is bubble-like based on area and circularity threshold
	for (int i = 0; i < contours.size(); i++)
	{
		if ((boundRect[i].x <= 5 && boundRect[i].y <= 5 && boundRect[i].x + boundRect[i].width >= thresh.cols-5 &&  boundRect[i].y + boundRect[i].height >= thresh.rows - 5) == 0)
		{
			area = cv::contourArea(contours[i], false);
			if (area >= MIN_AREA)
			{
				perimeter = cv::arcLength(contours[i], true);
				// Circularity Factor Article: http://annals.fih.upt.ro/pdf-full/2013/ANNALS-2013-4-47.pdf
				//
				if ((4*CV_PI*area)/(perimeter*perimeter) >= CIRCULARITY_FACTOR_THRESHOLD)
					c = contours[i];
			}
		}
	}

// Goes into Center_Circle_Detection function and outputs the std dev of centers computed for potential bubble contour
	std::vector<float> std_dev_contour = Center_Circle_Detection(c, gray);
	std::vector<float> answer;
	answer.push_back(c.size());
	answer.push_back(std_dev_contour[0]);
	answer.push_back(std_dev_contour[1]);
// Returns the size of potential bubbles vector and std devs of centers of circle
	return answer;
}


bool Red_Stain_Detection (cv::Mat img, cv::Mat gray) {
// Function searches for red stains in background of images
// Output is a bool of whether a red stain was detected
	
// Start of RGB to SHV conversion
	std::vector<cv::Mat> spl;
	cv::Mat image_32f;

	img.convertTo(image_32f, CV_32F);
	cv::split(image_32f, spl);
	std::vector<cv::Mat> rgb(3);
	rgb[0] = spl[2];
	rgb[1] = spl[1];
	rgb[2] = spl[0];

	cv::Mat mask2 = cv::Mat::zeros(img.size(), CV_8UC3);
	cv::Mat mask2_32f;
	
	mask2.convertTo(mask2_32f, CV_32F);
	std::vector<cv::Mat> mask;
	cv::split(mask2_32f, mask);
	cv::Mat max_1 = max(rgb[0], rgb[1]);
	cv::Mat max_2 = max(max_1, rgb[2]);
	cv::Mat min_1 = min(rgb[0], rgb[1]);
	cv::Mat min_2 = min(min_1, rgb[2]);
	cv::Mat delta = max_2 - min_2;
	cv::Mat s = delta / max_2;

	for (int i = 0; i < max_2.rows; i++) 
	{
		for (int j = 0; j < max_2.cols; j++)
		{
			if (max_2.at<float>(i,j) == 0)
				s.at<float>(i,j) = 0;
		}
	}
	
	cv::Mat idx0 = (rgb[0] == max_2);
	cv::Mat idx1 = (rgb[1] == max_2);
	bool a, b;
	double num;
	for (int i = 0; i < idx0.rows; i++)
	{
		for (int j = 0; j < idx0.cols; j++) 
		{
			a = idx0.at<bool>(i,j);
			b = idx1.at<bool>(i,j);
			if (a == 255)
				mask[0].at<float>(i,j) = (rgb[1].at<float>(i,j) - rgb[2].at<float>(i,j)) / delta.at<float>(i,j);
			else if (b == 255)
				mask[0].at<float>(i,j) = 2.0 + ((rgb[2].at<float>(i,j) - rgb[0].at<float>(i,j)) / delta.at<float>(i,j));
			else
				mask[0].at<float>(i,j) = 4.0 + ((rgb[0].at<float>(i,j) - rgb[1].at<float>(i,j)) / delta.at<float>(i,j));
			num = fmod((fmod((mask[0].at<float>(i,j)/6.0), 1.0) + 1.0), 1.0);
			mask[0].at<float>(i,j) = num * 255.0;
			if (delta.at<float>(i,j) == 0)
				mask[0].at<float>(i,j) = 0;
			mask[1].at<float>(i,j) = s.at<float>(i,j)*255.0;
			mask[2].at<float>(i,j) = max_2.at<float>(i,j);
		}
	}

	
// Start of Thresholding
	cv::Mat red_stain_mask = cv::Mat::zeros(img.size(), CV_8UC1);
	cv::Mat m1, m2, m3;

	int temp[] = {225,50,125,255,0,255};
	std::vector<float> R(temp, temp+6);

	if (R[0] > R[1])
		m1 = ((R[0] <= mask[0]) | (mask[0] <= R[1]));
	else
		m1 = ((R[0] <= mask[0]) & (mask[0] <= R[1]));
	if (R[2] > R[3])
		m2 = ((R[2] <= mask[1]) | (mask[1] <= R[3]));
	else
		m2 = ((R[2] <= mask[1]) & (mask[1] <= R[3]));
	if (R[4] > R[5])
		m3 = ((R[4] <= mask[2]) | (mask[2] <= R[5]));
	else
		m3 = ((R[4] <= mask[2]) & (mask[2] <= R[5]));

	red_stain_mask = m1 & m2 & m3;
	
// Start of Detecting red stain
	cv::Mat background_mask;
// Segments image to detect the background and foreground of image
	cv::threshold(gray, background_mask, BACKGROUND_THRESH, 255, CV_THRESH_BINARY);
	std::vector<std::vector<cv::Point> > red_stain_contours, background_contours;
// Find contours in background mask and red stain mask
	cv::findContours(red_stain_mask, red_stain_contours, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	cv::findContours(background_mask, background_contours, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);

// Sorts the background contours to find the largest contour
	std::sort(background_contours.begin(), background_contours.end(), compareContourAreas);
	
	int red_stain = 0;
	double number;

// In loop, goes through points detected in red stain contours and compares to background to detect whether there is red stain in the background
	for (int i = 0; i < red_stain_contours.size(); i++)
	{
		for (int j = 0; j < red_stain_contours[i].size(); j++)
		{
			cv::Point red_stain_point = red_stain_contours[i][j];
			double number = cv::pointPolygonTest(background_contours[0], red_stain_point, 0);
			if ((number == 0) or (number == 1))		
				red_stain++;
		}
	}
	
// If there is more than a certain amount of red stain pixels detected, return true
	if (red_stain > RED_STAIN_THRESH)
		return 1;
	else
		return 0;
}
