#include <opencv2/core/core.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <iostream>
#include <map>
#include <cmath>
#include <fstream>
#include <string>

// Hard coded numbers
#define MAXIMUM_CELL_SIZE 20000
#define MINIMUM_CELL_SIZE 500
#define ASPECT_RATIO_THRESH 0.6
#define MINIMUM_DOT_SIZE 10
#define BAD_QUALITY_SIZE 20000
#define MED_QUALITY_SIZE 10000

// Function headers
std::vector<cv::Mat> rgb2hsv(cv::Mat);
std::string quality_control(cv::Mat);
std::vector<int> analyze(cv::Mat&, cv::Mat&);

int main(int argc, char* argv[]) {
// Function checks for potential errors in arguments and leads to other functions

// Checks if there were enough input parameters
	if (argc < 3)
	{
		std::cout << "Not enough arguments" << std::endl;
		return -1;
	}

// Initialize name of image and remove extension
	std::string name = argv[1];

        std::string image_path = name.substr(0, name.find_last_of("/"));
        std::string project = image_path.substr(image_path.find_last_of("/")+1);
        std::string set = argv[2];
        name = name.substr(name.find_last_of("/")+1, name.find(".",0));

// Imports image as is
	cv::Mat img = cv::imread(argv[1], CV_LOAD_IMAGE_COLOR);

// Checks if image exists
	if (!img.data)
	{
		std::cout << "Could not open or find image" << std::endl;
		return -1;
	}

// Checks number of channels of image to avoid potential error
	if (img.channels() == 1)
	{
		std::cout << "Wrong number of channels" << std::endl;
		return -1;
	}

// Heads into function
	std::string flagged = quality_control(img);
	std::vector<int> output = analyze(img, img);

	std::ofstream file_str;
	std::string cell_file = "output.txt";
	file_str.open(cell_file.c_str());

	file_str << "{\"type\": \"summary\", \"data\": {\"Project\": \"";
        file_str << project << "\", \"Set\" : \"" << set << "\", \"File\" : \"";
	file_str << name << "\", \"# of Cells\": " << output[0] << ", \"Total Cell Area\": ";
	file_str << output[1] << ", \"Dots Per Cell\": " << output[2];
	file_str << ", \"Flagged\": \"" << flagged << "\"}}" << std::endl;
	

	//file_str << "File\t# of Cells\tTotal Cell Area\tDots Per Cell\tFlagged" << std::endl;
	//file_str << name << "\t" << output[0] << "\t" << output[1] << "\t" << output[2] << "\t" << flagged << std::endl;
	file_str.close();

// Exits program
	return 0;
}



std::vector<cv::Mat> rgb2hsv (cv::Mat image) {

// Function converts image from BGR to RGB to HSV colorspace

	std::vector<cv::Mat> spl;
	cv::Mat image_32f;

// Rearranging channels to change from BGR to RGB
	image.convertTo(image_32f, CV_32F);
	cv::split(image_32f, spl);
	std::vector<cv::Mat> rgb(3);
	rgb[0] = spl[2];
	rgb[1] = spl[1];
	rgb[2] = spl[0];

// Initializing mask and finding min and max of vector
	cv::Mat mask2 = cv::Mat::zeros(image.size(), CV_8UC3);
	cv::Mat mask2_32f;
	mask2.convertTo(mask2_32f, CV_32F);
	std::vector<cv::Mat> mask;
	cv::split(mask2_32f, mask);
// Checks for min and max of channels
	cv::Mat max_1 = max(rgb[0], rgb[1]);
	cv::Mat max_2 = max(max_1, rgb[2]);
	cv::Mat min_1 = min(rgb[0], rgb[1]);
	cv::Mat min_2 = min(min_1, rgb[2]);
	cv::Mat delta = max_2 - min_2;
	cv::Mat s = delta/max_2;

// Checking if the max is 0, then s will be 0
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
	bool a,b;
	double num;

// For each pixel in the image, it converts it to HSV
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
			num = std::fmod((std::fmod((mask[0].at<float>(i,j)/6.0),1.0)+1.0),1.0);
			mask[0].at<float>(i,j) = num * 255.0;
			if (delta.at<float>(i,j) == 0)
				mask[0].at<float>(i,j) = 0;
			mask[1].at<float>(i,j) = s.at<float>(i,j)*255.0;
			mask[2].at<float>(i,j) = max_2.at<float>(i,j);
		}
	}

// Returns the HSV image
	return mask;
}	


std::string quality_control (cv::Mat image) {
// Function analyzes the image and verifies whether the image is good quality
// Main quality check is for dark large spots

// Convert image from RGB to HSV
	std::vector<cv::Mat> hsv_img = rgb2hsv(image);
	
// Start of thresholding
	cv::Mat quality_mask = cv::Mat::zeros(image.size(), CV_8UC1);
        cv::Mat m1, m2, m3;

	int temp_dot[] = {0,255,0,255,0,165};
	std::vector<float> R(temp_dot, temp_dot+6);

	m1 = ((R[0] <= hsv_img[0]) & (hsv_img[0] <= R[1]));
	m2 = ((R[2] <= hsv_img[1]) & (hsv_img[1] <= R[3]));
	m3 = ((R[4] <= hsv_img[2]) & (hsv_img[2] <= R[5]));

	quality_mask = m1 & m2 & m3;

// Find contours of the binary mask
	std::vector<std::vector<cv::Point> > cnt;
	cv::findContours(quality_mask, cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);

	for (int i = 0; i < cnt.size(); i++) {
		float cell_area = cv::contourArea(cnt[i]);
		if (cell_area > BAD_QUALITY_SIZE) {
			return "YES";
		} else if (cell_area > MED_QUALITY_SIZE) {
			return "MAYBE";
		}
	}

	return "NO";
}


std::vector<int> analyze (cv::Mat &cell_img, cv::Mat &dot_img) {
// Function analyzes the dots and cells in the image and returns the output in a vector

	cv::Mat img, im, cell_thresh, yuv_img;
// Sharpening the image quality
	cv::GaussianBlur(cell_img, im, cv::Size(0,0), 3);
        cv::addWeighted(cell_img, 1.5, im, -0.5, 0, img);
	cv::cvtColor(img, yuv_img, CV_BGR2YUV);

// Thresholding the image into binary 
	cv::inRange( yuv_img , cv::Scalar(0,0,0), cv::Scalar(150,255,255), cell_thresh);
         
// ---------- finding cells in the image ----------------
	std::vector<std::vector<cv::Point> > cells, cell_cnt;
	float cell_area_count = 0;
	float cell_area, true_area, aspect_ratio;
	cv::Rect bounding_rect;

	cv::findContours(cell_thresh, cell_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);

	for (int i = 0; i < cell_cnt.size(); i++) {
		cell_area = cv::contourArea(cell_cnt[i]);
		true_area = cv::contourArea(cell_cnt[i], true);
		bounding_rect = cv::boundingRect(cell_cnt[i]);
		aspect_ratio = (float) bounding_rect.width / bounding_rect.height;
		if (cell_area > MINIMUM_CELL_SIZE and aspect_ratio > ASPECT_RATIO_THRESH and cell_area < MAXIMUM_CELL_SIZE and true_area < 0) {
			cell_area_count = cell_area_count + cell_area;
			cells.push_back(cell_cnt[i]);
		}
	}

// ------------- finding dots in the image --------------
	std::vector<cv::Mat> hsv_img = rgb2hsv(dot_img);
	cv::Mat dot_mask = cv::Mat::zeros(dot_img.size(), CV_8UC1);
	cv::Mat m1, m2, m3;

// Threshold the hsv image (cannot use inRange function due to type of hsv_img)
	int temp_dot[] = {0,255,50,255,0,150};
	std::vector<float> R(temp_dot, temp_dot+6);

	m1 = ((R[0] <= hsv_img[0]) & (hsv_img[0] <= R[1]));
	m2 = ((R[2] <= hsv_img[1]) & (hsv_img[1] <= R[3]));
	m3 = ((R[4] <= hsv_img[2]) & (hsv_img[2] <= R[5]));
	
	dot_mask = m1 & m2 & m3;
	
	std::vector<std::vector<cv::Point> > dot_cnt, dots;
	cv::findContours(dot_mask, dot_cnt, CV_RETR_LIST, CV_CHAIN_APPROX_NONE);
	float dot_area;

	for (int i = 0; i < dot_cnt.size(); i++) {
		dot_area = cv::contourArea(dot_cnt[i]);
		if (dot_area > MINIMUM_DOT_SIZE) {
			dots.push_back(dot_cnt[i]);
		}
	}

// ------------ doing the point polygon test to check whether dot within cell -------------
	std::map<int, int> dot_to_cell;
	int keep_track = -1;
	int number, x, y;

	for (int i = 0; i < dots.size(); i++) {
		for (int j = 0; j < dots[i].size(); j++) {
			for (int m = 0; m < cells.size(); m++) {
				cv::Point dot = dots[i][j];
				number = cv::pointPolygonTest(cells[m], dot, false);
				if (number == 0 || number == 1) {
					if (dot_to_cell.find(m) != dot_to_cell.end() && keep_track != i) {
						dot_to_cell[m] ++;
						keep_track ++;		
					} else if (dot_to_cell.find(m) == dot_to_cell.end() && keep_track != i) {
						dot_to_cell[m] = 1;
						keep_track ++;
					}
				}
			}
		}
	}

	int average = 0;
	for (std::map<int,int>::iterator it = dot_to_cell.begin(); it != dot_to_cell.end(); it++) {
		average = average + it->second;
	}

	if (dot_to_cell.size() > 0) {
		average = average / dot_to_cell.size();
	} else {
		average = 0;
	}

	int temp_out[] = {int(cells.size()), int(cell_area_count), int(average)};	
	std::vector<int> output(temp_out, temp_out+3);
	return output;
}
